-- Administrator invitations: an owner email can be named before its account exists.
-- The first time that person signs in with a confirmed email, the app calls
-- accept_admin_invite() and the account becomes a platform administrator.
CREATE TABLE IF NOT EXISTS public.platform_admin_invites (
  email text PRIMARY KEY CHECK (email = lower(email)),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_admin_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_admin_invites FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.accept_admin_invite()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  caller_email text;
BEGIN
  IF caller IS NULL THEN RETURN false; END IF;
  -- Only an address the person has proved they own counts.
  SELECT lower(u.email) INTO caller_email FROM auth.users u WHERE u.id = caller AND u.email_confirmed_at IS NOT NULL;
  IF caller_email IS NULL THEN RETURN false; END IF;
  DELETE FROM public.platform_admin_invites WHERE email = caller_email;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.platform_admins (user_id) VALUES (caller) ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_admin_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_admin_invite() TO authenticated;
