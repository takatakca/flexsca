-- Lets a person turn notification emails off (and on again) from Settings.
CREATE OR REPLACE FUNCTION public.set_email_notifications(p_enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.notification_preferences (user_id, email) VALUES (auth.uid(), COALESCE(p_enabled, true))
  ON CONFLICT (user_id) DO UPDATE SET email = COALESCE(p_enabled, true);
END;
$$;
REVOKE ALL ON FUNCTION public.set_email_notifications(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_email_notifications(boolean) TO authenticated;
