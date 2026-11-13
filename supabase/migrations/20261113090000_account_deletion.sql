-- Self-service account deletion (required by Google Play and the App Store).
-- The delete-account Edge Function calls these with the service role only.

-- Why an account may not delete itself. NULL means deletion may proceed.
CREATE OR REPLACE FUNCTION public.account_deletion_blocker(p_user_id uuid) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_other boolean := false;
BEGIN
  IF p_user_id IS NULL THEN RETURN 'unknown_account'; END IF;
  -- A login with no FLEXS profile belongs to the other product only.
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN RETURN 'used_by_another_product'; END IF;
  IF EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = p_user_id) THEN RETURN 'administrator'; END IF;
  -- This database is shared with another product. Never remove a login that product still uses.
  IF to_regclass('public.ticketing_memberships') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.ticketing_memberships WHERE user_id = $1)' INTO v_other USING p_user_id;
    IF v_other THEN RETURN 'used_by_another_product'; END IF;
  END IF;
  IF to_regclass('public.ticketing_campaigns') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.ticketing_campaigns WHERE created_by = $1)' INTO v_other USING p_user_id;
    IF v_other THEN RETURN 'used_by_another_product'; END IF;
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.account_deletion_blocker(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.account_deletion_blocker(uuid) TO service_role;

-- Files the account uploaded, so they can be removed from storage before the login is deleted.
CREATE OR REPLACE FUNCTION public.account_storage_objects(p_user_id uuid) RETURNS TABLE(bucket_id text, name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT o.bucket_id, o.name FROM storage.objects o
  WHERE o.owner_id = p_user_id::text AND o.bucket_id IN ('provider-media', 'request-attachments')
  LIMIT 1000
$$;
REVOKE ALL ON FUNCTION public.account_storage_objects(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.account_storage_objects(uuid) TO service_role;
