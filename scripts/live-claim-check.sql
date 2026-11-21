-- End-to-end check of claiming a business listing on the real database, leaving nothing behind.
-- It ALWAYS ends with an error: that error carries the result and rolls everything back.
-- Expected: claim pending, a second claim by the same person refused, an ordinary account cannot
-- approve, the administrator approves, the listing is claimed, the trial runs 30 days with 20 credits.
DO $$
DECLARE
  owner_id uuid := gen_random_uuid(); admin_id uuid := gen_random_uuid(); listing uuid; claim uuid;
  result jsonb; log text := ''; n int; ok boolean; refused boolean := false; denied boolean := false; trial record; before int; after int;
BEGIN
  INSERT INTO auth.users (instance_id,id,aud,role,email,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES ('00000000-0000-0000-0000-000000000000',owner_id,'authenticated','authenticated','sim-owner@example.com',now(),now(),now(),'{}','{}'),
         ('00000000-0000-0000-0000-000000000000',admin_id,'authenticated','authenticated','sim-admin@example.com',now(),now(),now(),'{}','{}');
  INSERT INTO public.platform_admins (user_id) VALUES (admin_id);
  SELECT id INTO listing FROM public.business_listings WHERE status = 'listed' AND source = 'osm' ORDER BY id LIMIT 1;

  PERFORM set_config('request.jwt.claims', json_build_object('sub',owner_id,'role','authenticated','email','sim-owner@example.com')::text, true);
  SELECT balance INTO before FROM public.credit_wallets WHERE user_id = owner_id;
  result := public.claim_business_listing(listing, 'owner', 'Simulation claim');
  log := log || 'claim_result=' || COALESCE(result->>'status', result::text);
  SELECT id INTO claim FROM public.business_claims WHERE listing_id = listing AND user_id = owner_id;
  BEGIN PERFORM public.claim_business_listing(listing, 'owner', 'again'); EXCEPTION WHEN OTHERS THEN refused := true; END;
  SELECT count(*) INTO n FROM public.business_claims WHERE listing_id = listing AND user_id = owner_id;
  log := log || ' one_claim_only=' || (n = 1) || ' repeat_refused_or_ignored=' || (refused OR n = 1);
  BEGIN PERFORM public.admin_decide_claim(claim, true, 'self-approval attempt'); EXCEPTION WHEN OTHERS THEN denied := true; END;
  log := log || ' owner_cannot_approve_own_claim=' || denied;

  PERFORM set_config('request.jwt.claims', json_build_object('sub',admin_id,'role','authenticated','email','sim-admin@example.com')::text, true);
  SELECT count(*) INTO n FROM public.admin_claim_queue(); log := log || ' admin_queue=' || n;
  IF (SELECT status FROM public.business_claims WHERE id = claim) = 'pending' THEN PERFORM public.admin_decide_claim(claim, true, 'Simulation approval'); END IF;
  SELECT (status = 'claimed') INTO ok FROM public.business_listings WHERE id = listing; log := log || ' listing_claimed=' || ok;
  SELECT * INTO trial FROM public.provider_trials WHERE user_id = owner_id;
  log := log || ' trial_days=' || round(extract(epoch FROM (trial.ends_at - trial.started_at)) / 86400) || ' trial_credits=' || trial.credits_granted;
  SELECT balance INTO after FROM public.credit_wallets WHERE user_id = owner_id; log := log || ' wallet ' || before || '->' || after;
  SELECT count(*) INTO n FROM public.notifications WHERE user_id = owner_id; log := log || ' owner_notified=' || (n > 0);
  RAISE EXCEPTION 'CLAIM CHECK (rolled back) %', log;
END $$;
