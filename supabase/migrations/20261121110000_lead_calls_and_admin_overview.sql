-- Calls between a professional and the customer of a request they unlocked, placed through
-- a phone provider (MIMT / Twilio). FLEXS calls the professional first, then connects the customer:
-- neither side dials the other directly and the call is logged, not recorded.
CREATE TABLE IF NOT EXISTS public.lead_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  pro_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','ringing','in_progress','completed','busy','no_answer','failed','canceled')),
  provider text NOT NULL DEFAULT 'twilio',
  provider_sid text UNIQUE,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lead_calls_pro_created_idx ON public.lead_calls (pro_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lead_calls_lead_idx ON public.lead_calls (lead_id);
ALTER TABLE public.lead_calls ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lead_calls FROM PUBLIC, anon;
GRANT SELECT ON public.lead_calls TO authenticated;

-- A professional sees their own calls, a customer sees calls about their own request, an administrator sees all.
-- Nobody writes from the browser: rows are created and updated by the server functions only.
DROP POLICY IF EXISTS lead_calls_read ON public.lead_calls;
CREATE POLICY lead_calls_read ON public.lead_calls FOR SELECT TO authenticated USING (
  pro_id = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_calls.lead_id AND l.customer_user_id = (SELECT auth.uid()))
  OR public.is_platform_admin()
);

-- Checks that this professional may call about this request and stays within the limits,
-- then opens the call record and returns the customer's number to the server function.
CREATE OR REPLACE FUNCTION public.authorize_lead_call(p_pro_id uuid, p_lead_id uuid)
RETURNS TABLE (call_id uuid, customer_phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.leads%ROWTYPE;
  new_id uuid;
BEGIN
  SELECT * INTO target FROM public.leads WHERE id = p_lead_id;
  IF NOT FOUND OR target.archived THEN RAISE EXCEPTION 'Request not available' USING ERRCODE = 'P0002'; END IF;
  IF NOT (target.assigned_to = p_pro_id OR EXISTS (SELECT 1 FROM public.lead_purchases lp WHERE lp.lead_id = p_lead_id AND lp.user_id = p_pro_id)) THEN
    RAISE EXCEPTION 'Unlock this request before calling' USING ERRCODE = '42501';
  END IF;
  IF target.customer_phone IS NULL OR btrim(target.customer_phone) = '' THEN RAISE EXCEPTION 'The customer gave no phone number' USING ERRCODE = 'P0002'; END IF;
  IF (SELECT count(*) FROM public.lead_calls c WHERE c.pro_id = p_pro_id AND c.lead_id = p_lead_id AND c.created_at > now() - interval '1 hour') >= 3 THEN
    RAISE EXCEPTION 'Too many calls to this customer in the last hour' USING ERRCODE = 'P0001';
  END IF;
  IF (SELECT count(*) FROM public.lead_calls c WHERE c.pro_id = p_pro_id AND c.created_at > now() - interval '24 hours') >= 40 THEN
    RAISE EXCEPTION 'Daily call limit reached' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.lead_calls (lead_id, pro_id) VALUES (p_lead_id, p_pro_id) RETURNING id INTO new_id;
  RETURN QUERY SELECT new_id, target.customer_phone;
END;
$$;
REVOKE ALL ON FUNCTION public.authorize_lead_call(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authorize_lead_call(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.record_lead_call(p_call_id uuid, p_provider_sid text, p_status text, p_duration integer DEFAULT NULL)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.lead_calls SET
    provider_sid = COALESCE(p_provider_sid, provider_sid),
    status = p_status,
    duration_seconds = COALESCE(p_duration, duration_seconds),
    ended_at = CASE WHEN p_status IN ('completed','busy','no_answer','failed','canceled') THEN now() ELSE ended_at END
  WHERE (p_call_id IS NOT NULL AND id = p_call_id) OR (p_call_id IS NULL AND provider_sid = p_provider_sid);
$$;
REVOKE ALL ON FUNCTION public.record_lead_call(uuid, text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_lead_call(uuid, text, text, integer) TO service_role;

-- Owner dashboard: the figures an administrator needs on one screen.
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'accounts', (SELECT count(*) FROM public.profiles),
    'accounts_7d', (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'professionals', (SELECT count(*) FROM public.provider_profiles),
    'requests', (SELECT count(*) FROM public.leads),
    'requests_7d', (SELECT count(*) FROM public.leads WHERE created_at > now() - interval '7 days'),
    'requests_open', (SELECT count(*) FROM public.leads WHERE NOT archived),
    'unlocks', (SELECT count(*) FROM public.lead_purchases),
    'unlocks_7d', (SELECT count(*) FROM public.lead_purchases WHERE created_at > now() - interval '7 days'),
    'revenue_cents', (SELECT COALESCE(sum(amount_cents), 0) FROM public.credit_purchases WHERE status = 'paid'),
    'revenue_cents_30d', (SELECT COALESCE(sum(amount_cents), 0) FROM public.credit_purchases WHERE status = 'paid' AND created_at > now() - interval '30 days'),
    'credits_sold', (SELECT COALESCE(sum(credits), 0) FROM public.credit_purchases WHERE status = 'paid'),
    'credits_held', (SELECT COALESCE(sum(balance), 0) FROM public.credit_wallets),
    'listings', (SELECT count(*) FROM public.business_listings WHERE status = 'listed'),
    'listings_claimed', (SELECT count(*) FROM public.business_listings WHERE status = 'claimed'),
    'claims_pending', (SELECT count(*) FROM public.business_claims WHERE status = 'pending'),
    'tickets_open', (SELECT count(*) FROM public.support_tickets WHERE status <> 'closed'),
    'calls_30d', (SELECT count(*) FROM public.lead_calls WHERE created_at > now() - interval '30 days'),
    'call_minutes_30d', (SELECT COALESCE(ceil(sum(duration_seconds) / 60.0), 0) FROM public.lead_calls WHERE created_at > now() - interval '30 days')
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_overview() TO authenticated;
