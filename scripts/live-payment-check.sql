-- End-to-end check of the money path on the real database, without Stripe, leaving nothing behind.
-- It plays what the payment webhook does: a paid purchase, the same event delivered twice,
-- a refund, then a dispute. It ALWAYS ends with an error that carries the result and rolls back.
-- Expected: credits added once, a replay adds nothing, a wrong amount is refused, a refund removes
-- the credits, a dispute freezes the wallet (no unlock, no new checkout), revenue counts paid purchases only.
DO $$
DECLARE
  pro uuid := gen_random_uuid(); log text := ''; ok boolean; n int; b0 int; b1 int; b2 int; b3 int; refused boolean := false; blocked boolean := false; lead uuid;
BEGIN
  INSERT INTO auth.users (instance_id,id,aud,role,email,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES ('00000000-0000-0000-0000-000000000000',pro,'authenticated','authenticated','sim-buyer@example.com',now(),now(),now(),'{}','{}');
  SELECT balance INTO b0 FROM public.credit_wallets WHERE user_id = pro;
  log := log || 'checkout_allowed=' || public.checkout_allowed(pro);

  -- The checkout function records the pending purchase before sending the buyer to Stripe.
  INSERT INTO public.credit_purchases (user_id, stripe_checkout_session_id, credits, amount_cents, currency, status) VALUES (pro, 'cs_sim_1', 50, 3900, 'cad', 'created');
  ok := public.fulfill_credit_purchase(pro, 'cs_sim_1', 'pi_sim_1', 50, 3900, 'cad');
  SELECT balance INTO b1 FROM public.credit_wallets WHERE user_id = pro;
  log := log || ' purchase_recorded=' || ok || ' balance ' || b0 || '->' || b1;
  ok := public.fulfill_credit_purchase(pro, 'cs_sim_1', 'pi_sim_1', 50, 3900, 'cad');
  SELECT balance INTO n FROM public.credit_wallets WHERE user_id = pro;
  log := log || ' replay_adds_nothing=' || (n = b1);
  -- A payment event that does not match the recorded purchase (more credits, lower price) or names no recorded checkout.
  BEGIN PERFORM public.fulfill_credit_purchase(pro, 'cs_sim_1b', 'pi_sim_bad', 500, 100, 'cad'); EXCEPTION WHEN OTHERS THEN refused := true; END;
  SELECT balance INTO n FROM public.credit_wallets WHERE user_id = pro;
  log := log || ' wrong_price_refused=' || (refused AND n = b1);

  INSERT INTO public.credit_purchases (user_id, stripe_checkout_session_id, credits, amount_cents, currency, status) VALUES (pro, 'cs_sim_3', 20, 1900, 'cad', 'created');
  refused := false; BEGIN PERFORM public.fulfill_credit_purchase(pro, 'cs_sim_3', 'pi_sim_3', 120, 1900, 'cad'); EXCEPTION WHEN OTHERS THEN refused := true; END;
  SELECT balance INTO n FROM public.credit_wallets WHERE user_id = pro; log := log || ' mismatched_credits_refused=' || (refused AND n = b1);

  ok := public.reverse_credit_purchase('pi_sim_1', 'refunded');
  SELECT balance INTO b2 FROM public.credit_wallets WHERE user_id = pro;
  log := log || ' refund_removes_credits=' || (b2 = b0) || ' (' || b1 || '->' || b2 || ')';
  ok := public.reverse_credit_purchase('pi_sim_1', 'refunded');
  SELECT balance INTO n FROM public.credit_wallets WHERE user_id = pro; log := log || ' second_refund_adds_nothing=' || (n = b2);

  INSERT INTO public.credit_purchases (user_id, stripe_checkout_session_id, credits, amount_cents, currency, status) VALUES (pro, 'cs_sim_2', 20, 1900, 'cad', 'created');
  PERFORM public.fulfill_credit_purchase(pro, 'cs_sim_2', 'pi_sim_2', 20, 1900, 'cad');
  PERFORM public.reverse_credit_purchase('pi_sim_2', 'disputed');
  SELECT balance, (frozen_at IS NOT NULL) INTO b3, ok FROM public.credit_wallets WHERE user_id = pro;
  log := log || ' dispute_freezes_wallet=' || ok || ' checkout_after_dispute=' || public.checkout_allowed(pro);

  lead := public.submit_lead('Plumbing','Montréal','Montréal',NULL,'Sim Customer','sim-payer@example.com',NULL,'Simulation','{}'::jsonb,false);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',pro,'role','authenticated')::text, true);
  BEGIN PERFORM public.unlock_lead(lead); EXCEPTION WHEN OTHERS THEN blocked := true; END;
  log := log || ' frozen_wallet_cannot_unlock=' || blocked;
  SELECT count(*) INTO n FROM public.credit_purchases WHERE user_id = pro AND status = 'paid';
  log := log || ' purchases_still_counted_as_paid=' || n;
  RAISE EXCEPTION 'PAYMENT CHECK (rolled back) %', log;
END $$;
