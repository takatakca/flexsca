-- Production signup creates account records, not fictional customer demand.
-- Existing leads are retained; historical sample cleanup requires explicit review.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id,email,display_name)
  VALUES(NEW.id,NEW.email,COALESCE(NEW.raw_user_meta_data->>'display_name',split_part(NEW.email,'@',1)));
  INSERT INTO public.credit_wallets(user_id,balance) VALUES(NEW.id,20);
  INSERT INTO public.credit_transactions(user_id,delta,reason) VALUES(NEW.id,20,'signup_bonus');
  PERFORM public.seed_default_statuses(NEW.id);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;
