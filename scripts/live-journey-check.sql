-- End-to-end check of the signed-in journey on the real database, leaving nothing behind.
-- Paste into the Supabase SQL editor (or run with the management API). It ALWAYS ends with an
-- error: that error carries the result and rolls back everything the check created.
-- Expected: every "=true", "signup_credits=20", "unlock_returned=<cost>", and the three email kinds.
DO $$
DECLARE
  pro uuid := gen_random_uuid(); cust uuid := gen_random_uuid();
  lead uuid; quote uuid; rev uuid; cost int; bal_before int; bal_after int; log text := '';
  n int; ok boolean; denied boolean := false; callrow record; kinds text;
BEGIN
  INSERT INTO auth.users (instance_id,id,aud,role,email,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES ('00000000-0000-0000-0000-000000000000',pro,'authenticated','authenticated','sim-pro@example.com',now(),now(),now(),'{}','{}'),
         ('00000000-0000-0000-0000-000000000000',cust,'authenticated','authenticated','sim-customer@example.com',now(),now(),now(),'{}','{}');
  SELECT count(*) INTO n FROM public.profiles WHERE id IN (pro,cust); log := log || 'profiles=' || n;
  SELECT balance INTO bal_before FROM public.credit_wallets WHERE user_id = pro; log := log || ' signup_credits=' || bal_before;

  -- The customer posts a request.
  PERFORM set_config('request.jwt.claims', json_build_object('sub',cust,'role','authenticated','email','sim-customer@example.com')::text, true);
  lead := public.submit_lead('Plumbing','Montréal','Montréal',NULL,'Sim Customer','sim-customer@example.com','514 555 0100','Simulation request','{}'::jsonb,false);
  SELECT (customer_user_id = cust) INTO ok FROM public.leads WHERE id = lead; log := log || ' lead_owned_by_customer=' || ok;

  -- The professional sees no contact details, unlocks once, is not charged twice, quotes, and may call.
  PERFORM set_config('request.jwt.claims', json_build_object('sub',pro,'role','authenticated','email','sim-pro@example.com')::text, true);
  SELECT (customer_phone IS NULL AND customer_email IS NULL) INTO ok FROM public.leads_safe WHERE id = lead; log := log || ' contact_hidden_before_unlock=' || ok;
  cost := public.unlock_lead(lead);
  SELECT balance INTO bal_after FROM public.credit_wallets WHERE user_id = pro; log := log || ' unlock_returned=' || cost || ' balance ' || bal_before || '->' || bal_after;
  SELECT (customer_phone IS NOT NULL) INTO ok FROM public.leads_safe WHERE id = lead; log := log || ' contact_visible_after_unlock=' || ok;
  PERFORM public.unlock_lead(lead);
  SELECT balance INTO n FROM public.credit_wallets WHERE user_id = pro; log := log || ' second_unlock_not_charged=' || (n = bal_after);
  quote := public.send_quote(lead,'I can come this week.',100,150,'this_week'); log := log || ' quote=' || (quote IS NOT NULL);
  SELECT * INTO callrow FROM public.authorize_lead_call(pro, lead); log := log || ' call_authorised=' || (callrow.call_id IS NOT NULL);

  -- The customer accepts the quote and leaves a review; an ordinary account cannot read the owner overview.
  PERFORM set_config('request.jwt.claims', json_build_object('sub',cust,'role','authenticated','email','sim-customer@example.com')::text, true);
  ok := public.decide_quote(quote,'accepted'); log := log || ' quote_accepted=' || ok;
  rev := public.submit_customer_review(lead,5,'Arrived on time and fixed the leak.'); log := log || ' review=' || (rev IS NOT NULL);
  BEGIN PERFORM public.admin_overview(); EXCEPTION WHEN OTHERS THEN denied := true; END; log := log || ' admin_overview_denied=' || denied;

  SELECT count(*), string_agg(DISTINCT kind, '+') INTO n, kinds FROM public.email_outbox WHERE lead_id = lead;
  log := log || ' emails_queued=' || n || ' kinds=' || kinds;
  SELECT count(*) INTO n FROM public.notifications WHERE user_id IN (pro,cust); log := log || ' notifications=' || n;
  RAISE EXCEPTION 'JOURNEY CHECK (rolled back) %', log;
END $$;
