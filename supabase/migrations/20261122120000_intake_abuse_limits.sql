-- Limits on anonymous request intake, so the public form cannot be used to flood
-- professionals with fake requests or to send confirmation emails to strangers.

-- 1. No more than 8 requests per hour from one network address. The address itself is not kept:
--    only a hash salted with a server secret and the date, which cannot be turned back into an
--    address and stops matching the next day. Rows older than two days are deleted.
CREATE TABLE IF NOT EXISTS public.lead_intake_rate (
  bucket text NOT NULL,
  hour timestamptz NOT NULL,
  requests integer NOT NULL DEFAULT 1,
  PRIMARY KEY (bucket, hour)
);
ALTER TABLE public.lead_intake_rate ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lead_intake_rate FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.limit_lead_intake() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  headers jsonb;
  address text;
  salt text;
  seen integer;
BEGIN
  BEGIN headers := NULLIF(current_setting('request.headers', true), '')::jsonb; EXCEPTION WHEN OTHERS THEN headers := NULL; END;
  address := btrim(split_part(COALESCE(headers->>'x-forwarded-for', ''), ',', 1));
  -- Requests created by the server itself (partner intake, administration) carry no visitor address.
  IF address = '' OR NEW.source_application IS NOT NULL THEN RETURN NEW; END IF;
  SELECT worker_secret INTO salt FROM public.email_settings LIMIT 1;
  INSERT INTO public.lead_intake_rate AS r (bucket, hour)
  VALUES (md5(COALESCE(salt, '') || current_date::text || address), date_trunc('hour', now()))
  ON CONFLICT (bucket, hour) DO UPDATE SET requests = r.requests + 1
  RETURNING requests INTO seen;
  IF seen > 8 THEN RAISE EXCEPTION 'Too many requests. Try again later.' USING ERRCODE = 'P0001'; END IF;
  DELETE FROM public.lead_intake_rate WHERE hour < now() - interval '2 days';
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.limit_lead_intake() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS limit_lead_intake ON public.leads;
CREATE TRIGGER limit_lead_intake BEFORE INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.limit_lead_intake();

-- 2. Emails about a new request are held back during a burst, and one address gets at most
--    one confirmation every twelve hours.
CREATE OR REPLACE FUNCTION public.queue_request_emails() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  burst boolean := (SELECT count(*) FROM public.leads WHERE created_at > now() - interval '10 minutes') > 30;
BEGIN
  IF NEW.customer_email IS NOT NULL AND NEW.customer_email LIKE '%_@_%._%'
    AND NOT EXISTS (SELECT 1 FROM public.email_outbox o WHERE o.kind = 'request_received' AND o.to_email = lower(NEW.customer_email) AND o.created_at > now() - interval '12 hours')
    AND (SELECT count(*) FROM public.email_outbox o WHERE o.kind = 'request_received' AND o.created_at > now() - interval '1 hour') < 100 THEN
    INSERT INTO public.email_outbox (kind, to_email, lead_id, payload)
    VALUES ('request_received', lower(NEW.customer_email), NEW.id, jsonb_build_object('service', NEW.category, 'city', NEW.city));
  END IF;
  IF burst THEN RETURN NEW; END IF;
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
REVOKE ALL ON FUNCTION public.queue_request_emails() FROM PUBLIC, anon, authenticated;
