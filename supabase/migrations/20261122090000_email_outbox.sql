-- Email notifications. Events are written to an outbox inside the same transaction as the
-- event; the send-emails function delivers them through the mail provider. Nothing is sent
-- until the provider key is set, and an email that could not be sent within two days is dropped.
CREATE TABLE IF NOT EXISTS public.email_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  worker_secret text NOT NULL DEFAULT (md5(gen_random_uuid()::text) || md5(gen_random_uuid()::text)),
  function_url text NOT NULL DEFAULT 'https://ysghtkallwuoodwqgkjm.supabase.co/functions/v1/send-emails'
);
INSERT INTO public.email_settings (id) VALUES (true) ON CONFLICT DO NOTHING;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_settings FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('request_received','new_request','quote_received','notification')),
  user_id uuid,
  to_email text CHECK (to_email IS NULL OR (length(to_email) BETWEEN 5 AND 254 AND to_email LIKE '%_@_%._%')),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','failed','skipped')),
  attempts integer NOT NULL DEFAULT 0,
  leased_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR to_email IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS email_outbox_queue_idx ON public.email_outbox (created_at) WHERE status IN ('queued','sending');
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_outbox FROM PUBLIC, anon, authenticated;

ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS email boolean NOT NULL DEFAULT true;

-- A new request: confirm it to the customer and tell the professionals who offer that service.
CREATE OR REPLACE FUNCTION public.queue_request_emails() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.customer_email IS NOT NULL AND NEW.customer_email LIKE '%_@_%._%' THEN
    INSERT INTO public.email_outbox (kind, to_email, lead_id, payload)
    VALUES ('request_received', lower(NEW.customer_email), NEW.id, jsonb_build_object('service', NEW.category, 'city', NEW.city));
  END IF;
  INSERT INTO public.email_outbox (kind, user_id, lead_id, payload)
  SELECT 'new_request', matched.user_id, NEW.id, jsonb_build_object('service', NEW.category, 'city', NEW.city, 'urgent', NEW.is_urgent)
  FROM (
    SELECT DISTINCT ps.user_id
    FROM public.provider_services ps
    JOIN public.provider_profiles pp ON pp.user_id = ps.user_id
    LEFT JOIN public.notification_preferences np ON np.user_id = ps.user_id
    WHERE lower(btrim(ps.title)) = lower(btrim(NEW.category))
      AND COALESCE(np.email, true)
      AND (NOT COALESCE(pp.match_service_area_only, false) OR lower(COALESCE(pp.service_area_city, '')) = lower(COALESCE(NEW.city, '')))
    LIMIT 50
  ) matched;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS queue_request_emails ON public.leads;
CREATE TRIGGER queue_request_emails AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.queue_request_emails();

-- A quote: tell the customer by email. (The professional's message thread already creates in-app notices.)
CREATE OR REPLACE FUNCTION public.queue_quote_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target public.leads%ROWTYPE;
BEGIN
  SELECT * INTO target FROM public.leads WHERE id = NEW.lead_id;
  IF FOUND AND target.customer_email IS NOT NULL AND target.customer_email LIKE '%_@_%._%' THEN
    INSERT INTO public.email_outbox (kind, to_email, lead_id, payload)
    VALUES ('quote_received', lower(target.customer_email), target.id, jsonb_build_object('service', target.category));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS queue_quote_email ON public.responses;
CREATE TRIGGER queue_quote_email AFTER INSERT ON public.responses FOR EACH ROW EXECUTE FUNCTION public.queue_quote_email();

-- Every in-app notice is also emailed, unless the person turned email off.
CREATE OR REPLACE FUNCTION public.queue_notification_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE((SELECT np.email FROM public.notification_preferences np WHERE np.user_id = NEW.user_id), true) THEN
    INSERT INTO public.email_outbox (kind, user_id, lead_id, payload)
    VALUES ('notification', NEW.user_id, NEW.lead_id, jsonb_build_object('title', left(NEW.title, 200)));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS queue_notification_email ON public.notifications;
CREATE TRIGGER queue_notification_email AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.queue_notification_email();

-- The worker takes a batch under a lease; a batch that crashed is taken again after five minutes.
CREATE OR REPLACE FUNCTION public.claim_email_batch(p_limit integer DEFAULT 20)
RETURNS TABLE (id uuid, kind text, user_id uuid, to_email text, lead_id uuid, payload jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.email_outbox o SET status = 'skipped'
  WHERE o.status IN ('queued','sending') AND (o.created_at < now() - interval '2 days' OR o.attempts >= 5);
  RETURN QUERY
  UPDATE public.email_outbox o SET status = 'sending', leased_at = now(), attempts = o.attempts + 1
  WHERE o.id IN (
    SELECT q.id FROM public.email_outbox q
    WHERE q.status = 'queued' OR (q.status = 'sending' AND q.leased_at < now() - interval '5 minutes')
    ORDER BY q.created_at LIMIT LEAST(GREATEST(p_limit, 1), 50) FOR UPDATE SKIP LOCKED
  )
  RETURNING o.id, o.kind, o.user_id, o.to_email, o.lead_id, o.payload;
END;
$$;
CREATE OR REPLACE FUNCTION public.complete_email(p_id uuid, p_sent boolean, p_retry boolean DEFAULT true)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.email_outbox SET
    status = CASE WHEN p_sent THEN 'sent' WHEN p_retry THEN 'queued' ELSE 'failed' END,
    sent_at = CASE WHEN p_sent THEN now() ELSE sent_at END, leased_at = NULL
  WHERE id = p_id AND status = 'sending';
$$;
REVOKE ALL ON FUNCTION public.claim_email_batch(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_email(uuid, boolean, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_batch(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_email(uuid, boolean, boolean) TO service_role;
REVOKE ALL ON FUNCTION public.queue_request_emails() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.queue_quote_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.queue_notification_email() FROM PUBLIC, anon, authenticated;

-- Wakes the worker. Uses pg_net when the database has it; otherwise the queue simply waits for the next call.
CREATE OR REPLACE FUNCTION public.kick_email_worker() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE settings public.email_settings%ROWTYPE;
BEGIN
  SELECT * INTO settings FROM public.email_settings LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;
  BEGIN
    EXECUTE 'SELECT net.http_post(url := $1, headers := $2, body := $3)'
      USING settings.function_url, jsonb_build_object('Content-Type', 'application/json', 'x-flexs-worker', settings.worker_secret), '{}'::jsonb;
  EXCEPTION WHEN OTHERS THEN NULL; -- never block the event that queued the email
  END;
END;
$$;
REVOKE ALL ON FUNCTION public.kick_email_worker() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.kick_email_worker_trigger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.kick_email_worker(); RETURN NULL; END;
$$;
REVOKE ALL ON FUNCTION public.kick_email_worker_trigger() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS kick_email_worker ON public.email_outbox;
CREATE TRIGGER kick_email_worker AFTER INSERT ON public.email_outbox FOR EACH STATEMENT EXECUTE FUNCTION public.kick_email_worker_trigger();

DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS pg_net; EXCEPTION WHEN OTHERS THEN NULL; END $$;
-- Retries: every five minutes when the database has pg_cron.
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.unschedule('flexs-email-retries') FROM cron.job WHERE jobname = 'flexs-email-retries';
  PERFORM cron.schedule('flexs-email-retries', '*/5 * * * *', 'SELECT public.kick_email_worker() WHERE EXISTS (SELECT 1 FROM public.email_outbox WHERE status IN (''queued'',''sending''))');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
