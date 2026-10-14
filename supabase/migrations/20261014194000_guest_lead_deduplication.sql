-- Idempotent, non-disclosing duplicate guard for native public intake.
-- Replaces only the existing submit_lead signature; does not modify stored leads.
-- Existing 3-per-15-minute mailbox limit remains in force.
CREATE OR REPLACE FUNCTION public.submit_lead(
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
  -- The same email is serialized above. Fail closed for exact rapid retries:
  -- never return an existing request ID to an unauthenticated sender.
  -- Changed answers/details remain separate requests and the mailbox quota still applies.
  IF EXISTS (
    SELECT 1 FROM public.leads l
    WHERE lower(l.customer_email) = lower(trim(p_customer_email))
      AND l.created_at > now() - interval '10 minutes'
      AND l.category = p_category
      AND lower(btrim(l.customer_name)) = lower(btrim(p_customer_name))
      AND lower(btrim(l.location_text)) = lower(btrim(p_location_text))
      AND COALESCE(btrim(l.details), '') = COALESCE(btrim(p_details), '')
      AND COALESCE(l.answers, '{}'::jsonb) = p_answers
      AND COALESCE(l.is_urgent, false) = COALESCE(p_is_urgent, false)
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_REQUEST' USING ERRCODE = 'P0001';
  END IF;
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
