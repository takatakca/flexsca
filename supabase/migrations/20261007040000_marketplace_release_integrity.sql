-- FLEXS remains independent. TAKATAK receives only opaque verified attribution.
BEGIN;
ALTER TABLE public.leads ADD COLUMN customer_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN attribution_id uuid;
CREATE INDEX leads_customer_user ON public.leads(customer_user_id);
CREATE INDEX leads_customer_email ON public.leads(lower(customer_email));

-- Neither a saved/read state nor a fabricated purchase proves payment.
DROP POLICY IF EXISTS leads_read_own ON public.leads;
CREATE POLICY leads_read_entitled ON public.leads FOR SELECT TO authenticated USING (
  customer_user_id = auth.uid() OR assigned_to = auth.uid() OR EXISTS (
    SELECT 1 FROM public.lead_agent_state s
    WHERE s.lead_id = leads.id AND s.agent_id = auth.uid() AND s.contacted
  )
);
DROP POLICY IF EXISTS leads_insert_anyone ON public.leads;
DROP POLICY IF EXISTS purchases_insert_own ON public.lead_purchases;
REVOKE INSERT, UPDATE, DELETE ON public.lead_purchases FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.leads FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.credit_wallets, public.credit_transactions, public.credit_purchases FROM anon, authenticated;
REVOKE INSERT, UPDATE ON public.lead_agent_state FROM anon, authenticated;
GRANT INSERT (lead_id, agent_id) ON public.lead_agent_state TO authenticated;
GRANT UPDATE (is_unread, is_archived, archived_at, custom_status_id, updated_at) ON public.lead_agent_state TO authenticated;

-- Purpose-built marketplace projection. Its owner bypasses base-table RLS,
-- so authentication and contact entitlement MUST be checked inside this view.
-- Free-text details/answers and precise location are private until purchase.
CREATE OR REPLACE VIEW public.leads_safe WITH (security_invoker = false) AS
SELECT l.id, l.category,
  CASE WHEN access.entitled THEN l.location_text ELSE COALESCE(l.city, 'Location provided') END AS location_text,
  l.city, CASE WHEN access.entitled THEN l.postal_code ELSE NULL END AS postal_code, l.province,
  l.service_subtype, CASE WHEN access.entitled THEN l.details ELSE NULL END AS details,
  CASE WHEN access.entitled THEN l.answers ELSE '{}'::jsonb END AS answers,
  l.status, COALESCE(p.base_cost, l.credits_cost) AS credits_cost,
  l.is_urgent, l.has_additional_details, l.assigned_to,
  l.created_at, l.updated_at, l.submitted_at, l.last_activity_at, l.archived, l.archived_at,
  CASE WHEN access.entitled THEN l.customer_name ELSE left(l.customer_name, 1) || '***' END AS customer_name,
  CASE WHEN access.entitled THEN l.customer_email ELSE NULL END AS customer_email,
  CASE WHEN access.entitled THEN l.customer_phone ELSE NULL END AS customer_phone
FROM public.leads l
LEFT JOIN public.lead_pricing_rules p ON p.category = l.category
CROSS JOIN LATERAL (SELECT (
  l.customer_user_id = auth.uid() OR l.assigned_to = auth.uid() OR EXISTS (
    SELECT 1 FROM public.lead_agent_state s WHERE s.lead_id = l.id AND s.agent_id = auth.uid() AND s.contacted
  )) IS TRUE AS entitled) access
WHERE auth.uid() IS NOT NULL AND (NOT l.archived OR access.entitled);
REVOKE ALL ON public.leads_safe FROM PUBLIC, anon;
GRANT SELECT ON public.leads_safe TO authenticated;

-- Keep each professional's private thread isolated from other professionals.
DROP POLICY IF EXISTS msgs_read_if_has_state ON public.lead_messages;
CREATE POLICY messages_read_entitled ON public.lead_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.customer_user_id = auth.uid())
  OR (
    EXISTS (SELECT 1 FROM public.lead_agent_state s WHERE s.lead_id = lead_messages.lead_id AND s.agent_id = auth.uid() AND s.contacted)
    AND (agent_id = auth.uid() OR (agent_id IS NULL AND sender_type IN ('customer', 'system')))
  )
);
DROP POLICY IF EXISTS msgs_insert_pro_contacted ON public.lead_messages;
CREATE POLICY messages_pro_insert ON public.lead_messages FOR INSERT TO authenticated WITH CHECK (
  sender_type = 'pro' AND agent_id = auth.uid() AND length(trim(message)) BETWEEN 1 AND 4000
  AND EXISTS (SELECT 1 FROM public.lead_agent_state s WHERE s.lead_id = lead_messages.lead_id AND s.agent_id = auth.uid() AND s.contacted)
);
CREATE POLICY messages_customer_insert ON public.lead_messages FOR INSERT TO authenticated WITH CHECK (
  sender_type = 'customer' AND agent_id IS NOT NULL AND length(trim(message)) BETWEEN 1 AND 4000
  AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.customer_user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.lead_agent_state s WHERE s.lead_id = lead_messages.lead_id AND s.agent_id = lead_messages.agent_id AND s.contacted)
);

-- Public reviews must not expose reviewer email through the base table.
DROP POLICY IF EXISTS "Public can view provider reviews without email" ON public.provider_reviews;
ALTER VIEW public.provider_reviews_public SET (security_invoker = false);
REVOKE ALL ON public.provider_reviews_public FROM PUBLIC;
GRANT SELECT ON public.provider_reviews_public TO anon, authenticated;
-- Owners can manage imported reviews but cannot assert independent verification.
REVOKE INSERT, UPDATE ON public.provider_reviews FROM anon, authenticated;
GRANT INSERT (user_id, reviewer_name, reviewer_email, rating, review_text, source) ON public.provider_reviews TO authenticated;

CREATE TABLE public.takatak_attribution_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  attribution_id uuid NOT NULL,
  event_type text NOT NULL DEFAULT 'lead' CHECK (event_type IN ('lead','form_submit','call','conversion')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  attempts int NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_id uuid,
  leased_until timestamptz,
  delivered_at timestamptz,
  last_status int,
  UNIQUE(lead_id, event_type)
);
ALTER TABLE public.takatak_attribution_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.takatak_attribution_outbox FROM anon, authenticated;
GRANT ALL ON public.takatak_attribution_outbox TO service_role;

-- Verified email ownership is checked against auth.users, never editable profiles.
CREATE FUNCTION public.claim_customer_leads() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text; v_count integer;
BEGIN
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RAISE EXCEPTION 'Verified email required'; END IF;
  UPDATE public.leads SET customer_user_id = auth.uid()
    WHERE customer_user_id IS NULL AND lower(customer_email) = v_email;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  INSERT INTO public.takatak_attribution_outbox(lead_id, attribution_id)
    SELECT id, attribution_id FROM public.leads WHERE customer_user_id = auth.uid() AND attribution_id IS NOT NULL
    ON CONFLICT (lead_id,event_type) DO NOTHING;
  RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.claim_customer_leads() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_customer_leads() TO authenticated;

-- Replace intake, preserving legacy callers while accepting an opaque click ID.
DROP FUNCTION public.submit_lead(text,text,text,text,text,text,text,text,jsonb,boolean);
CREATE FUNCTION public.submit_lead(
  p_category text, p_location_text text, p_city text DEFAULT NULL, p_postal_code text DEFAULT NULL,
  p_customer_name text DEFAULT NULL, p_customer_email text DEFAULT NULL, p_customer_phone text DEFAULT NULL,
  p_details text DEFAULT NULL, p_answers jsonb DEFAULT '{}'::jsonb, p_is_urgent boolean DEFAULT false,
  p_attribution_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_owner uuid; v_cost integer;
BEGIN
  IF p_category IS NULL OR p_location_text IS NULL OR p_customer_name IS NULL OR p_customer_email IS NULL
    OR length(trim(p_location_text)) NOT BETWEEN 1 AND 200 OR length(trim(p_customer_name)) NOT BETWEEN 1 AND 100
    OR length(p_customer_email) > 255 OR trim(p_customer_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR length(COALESCE(p_customer_phone,'')) > 40 OR length(COALESCE(p_details,'')) > 2000
    OR length(COALESCE(p_city,'')) > 100 OR length(COALESCE(p_postal_code,'')) > 20
    OR jsonb_typeof(p_answers) IS DISTINCT FROM 'object' OR octet_length(p_answers::text) > 16000 THEN
    RAISE EXCEPTION 'Invalid request details';
  END IF;
  SELECT base_credit_cost INTO v_cost FROM public.service_categories WHERE name = p_category AND is_active LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Service unavailable'; END IF;
  -- Bound duplicate abuse by mailbox without retaining an IP or fingerprint.
  PERFORM pg_advisory_xact_lock(hashtextextended(lower(trim(p_customer_email)),0));
  IF (SELECT count(*) FROM public.leads WHERE lower(customer_email) = lower(trim(p_customer_email))
      AND created_at > now() - interval '15 minutes') >= 3 THEN RAISE EXCEPTION 'Too many requests. Try again later.'; END IF;
  SELECT id INTO v_owner FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL
    AND lower(email) = lower(trim(p_customer_email));
  INSERT INTO public.leads(category,location_text,city,postal_code,customer_name,customer_email,customer_phone,
    details,answers,is_urgent,status,credits_cost,customer_user_id,attribution_id)
  VALUES(p_category,trim(p_location_text),p_city,p_postal_code,trim(p_customer_name),lower(trim(p_customer_email)),
    p_customer_phone,p_details,p_answers,p_is_urgent,'new',v_cost,v_owner,p_attribution_id) RETURNING id INTO v_id;
  INSERT INTO public.lead_messages(lead_id,sender_type,message)
    VALUES(v_id,'customer',COALESCE(NULLIF(trim(p_details),''),'New '||p_category||' request'));
  IF v_owner IS NOT NULL AND p_attribution_id IS NOT NULL THEN
    INSERT INTO public.takatak_attribution_outbox(lead_id,attribution_id) VALUES(v_id,p_attribution_id);
  END IF;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.submit_lead(text,text,text,text,text,text,text,text,jsonb,boolean,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_lead(text,text,text,text,text,text,text,text,jsonb,boolean,uuid) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.contact_lead(p_lead_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_agent uuid := auth.uid(); v_lead record; v_cost integer; v_balance integer; v_contacted boolean; v_first boolean;
BEGIN
  IF v_agent IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  -- Serialize all unlocks for the same lead, including first responder election.
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  SELECT contacted INTO v_contacted FROM public.lead_agent_state WHERE lead_id = p_lead_id AND agent_id = v_agent;
  IF NOT COALESCE(v_contacted,false) THEN
    IF v_lead.archived OR v_lead.status IN ('won','lost') THEN RAISE EXCEPTION 'Lead unavailable'; END IF;
    SELECT COALESCE((SELECT base_cost FROM public.lead_pricing_rules WHERE category = v_lead.category),v_lead.credits_cost,5) INTO v_cost;
    IF v_cost <= 0 THEN RAISE EXCEPTION 'Invalid lead price'; END IF;
    SELECT balance INTO v_balance FROM public.credit_wallets WHERE user_id = v_agent FOR UPDATE;
    IF NOT FOUND OR v_balance < v_cost THEN RAISE EXCEPTION 'INSUFFICIENT_CREDITS'; END IF;
    v_first := NOT EXISTS(SELECT 1 FROM public.lead_agent_state WHERE lead_id = p_lead_id AND contacted);
    UPDATE public.credit_wallets SET balance = balance - v_cost, updated_at = now() WHERE user_id = v_agent;
    INSERT INTO public.lead_agent_state(lead_id,agent_id,contacted,contacted_at,is_unread,first_to_respond)
      VALUES(p_lead_id,v_agent,true,now(),false,v_first)
      ON CONFLICT(lead_id,agent_id) DO UPDATE SET contacted = true,contacted_at = now(),is_unread = false,first_to_respond = v_first,updated_at = now();
    INSERT INTO public.lead_purchases(user_id,lead_id,cost) VALUES(v_agent,p_lead_id,v_cost) ON CONFLICT(user_id,lead_id) DO NOTHING;
    INSERT INTO public.credit_transactions(user_id,lead_id,delta,reason) VALUES(v_agent,p_lead_id,-v_cost,'spend_lead');
  END IF;
  RETURN jsonb_build_object('already_contacted',COALESCE(v_contacted,false),'credits_spent',COALESCE(v_cost,0),
    'customer_name',v_lead.customer_name,'customer_email',v_lead.customer_email,'customer_phone',v_lead.customer_phone);
END $$;
REVOKE ALL ON FUNCTION public.contact_lead(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.contact_lead(uuid) TO authenticated;
-- Legacy callers use the same serialized path instead of a second charging path.
CREATE OR REPLACE FUNCTION public.unlock_lead(p_lead_id uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN (public.contact_lead(p_lead_id)->>'credits_spent')::integer; END $$;
REVOKE ALL ON FUNCTION public.unlock_lead(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.unlock_lead(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.fulfill_credit_purchase(p_user_id uuid,p_session_id text,p_payment_intent_id text,
  p_credits integer,p_amount_cents integer,p_currency text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_purchase record;
BEGIN
  -- The webhook signature is verified by the Edge Function; SQL is service-only.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_session_id,0));
  SELECT * INTO v_purchase FROM public.credit_purchases WHERE stripe_checkout_session_id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown checkout session'; END IF;
  IF v_purchase.user_id IS DISTINCT FROM p_user_id OR v_purchase.credits IS DISTINCT FROM p_credits
    OR v_purchase.amount_cents IS DISTINCT FROM p_amount_cents OR v_purchase.currency IS DISTINCT FROM lower(p_currency) THEN
    RAISE EXCEPTION 'Checkout does not match purchase';
  END IF;
  IF v_purchase.status = 'paid' THEN RETURN false; END IF;
  UPDATE public.credit_purchases SET status = 'paid',stripe_payment_intent_id = p_payment_intent_id WHERE id = v_purchase.id;
  INSERT INTO public.credit_wallets(user_id,balance) VALUES(p_user_id,p_credits)
    ON CONFLICT(user_id) DO UPDATE SET balance = credit_wallets.balance + p_credits,updated_at = now();
  INSERT INTO public.credit_transactions(user_id,delta,reason) VALUES(p_user_id,p_credits,'purchase');
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.fulfill_credit_purchase(uuid,text,text,integer,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_credit_purchase(uuid,text,text,integer,integer,text) TO service_role;

CREATE FUNCTION public.claim_attribution_batch(p_limit integer DEFAULT 20)
RETURNS SETOF public.takatak_attribution_outbox LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.takatak_attribution_outbox o SET attempts = o.attempts+1, lease_id = gen_random_uuid(),leased_until = now()+interval '2 minutes'
  WHERE o.id IN (SELECT id FROM public.takatak_attribution_outbox WHERE delivered_at IS NULL AND attempts < 12
    AND next_attempt_at <= now() AND (leased_until IS NULL OR leased_until < now()) ORDER BY occurred_at
    LIMIT LEAST(GREATEST(p_limit,1),50) FOR UPDATE SKIP LOCKED) RETURNING o.*;
$$;
CREATE FUNCTION public.complete_attribution(p_id uuid,p_lease_id uuid,p_status integer,p_success boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.takatak_attribution_outbox SET delivered_at = CASE WHEN p_success THEN now() ELSE NULL END,
    last_status = p_status,lease_id = NULL,leased_until = NULL,
    next_attempt_at = now() + make_interval(secs => LEAST(3600,power(2,attempts)::integer * 15))
    WHERE id = p_id AND lease_id = p_lease_id AND delivered_at IS NULL;
  RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.claim_attribution_batch(integer),public.complete_attribution(uuid,uuid,integer,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_attribution_batch(integer),public.complete_attribution(uuid,uuid,integer,boolean) TO service_role;
COMMIT;
