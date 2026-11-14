-- New accounts must not receive prototype demo leads (fake UK customers and contact details).
-- Sign-up keeps: profile, wallet with the 20-credit welcome bonus, bonus ledger entry, default statuses.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.credit_wallets (user_id, balance)
  VALUES (NEW.id, 20);

  INSERT INTO public.credit_transactions (user_id, delta, reason)
  VALUES (NEW.id, 20, 'signup_bonus');

  PERFORM public.seed_default_statuses(NEW.id);

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Internal helpers must not be callable through the public API.
-- seed_default_statuses accepted any user id from an anonymous caller; it is only needed by the sign-up trigger.
REVOKE ALL ON FUNCTION public.seed_default_statuses(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_lead_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_lead_last_activity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_lead_custom_status(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_lead_custom_status(uuid, uuid) TO authenticated;
