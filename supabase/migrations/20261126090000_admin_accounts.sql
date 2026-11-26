-- Owner dashboard: find an account by email, name or business, with what it has done.
CREATE OR REPLACE FUNCTION public.admin_accounts(p_search text DEFAULT NULL)
RETURNS TABLE (user_id uuid, email text, display_name text, created_at timestamptz, company text, credits integer, frozen boolean, requests bigint, unlocks bigint, spent_cents bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE term text := NULLIF(btrim(left(COALESCE(p_search, ''), 100)), '');
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT p.id, p.email, p.display_name, p.created_at, pp.company_name,
    COALESCE(w.balance, 0), w.frozen_at IS NOT NULL,
    (SELECT count(*) FROM public.leads l WHERE l.customer_user_id = p.id OR lower(l.customer_email) = lower(p.email)),
    (SELECT count(*) FROM public.lead_purchases lp WHERE lp.user_id = p.id),
    (SELECT COALESCE(sum(cp.amount_cents), 0) FROM public.credit_purchases cp WHERE cp.user_id = p.id AND cp.status = 'paid')
  FROM public.profiles p
  LEFT JOIN public.provider_profiles pp ON pp.user_id = p.id
  LEFT JOIN public.credit_wallets w ON w.user_id = p.id
  WHERE term IS NULL
     OR p.email ILIKE '%' || replace(replace(term, '%', '\%'), '_', '\_') || '%'
     OR p.display_name ILIKE '%' || replace(replace(term, '%', '\%'), '_', '\_') || '%'
     OR pp.company_name ILIKE '%' || replace(replace(term, '%', '\%'), '_', '\_') || '%'
  ORDER BY p.created_at DESC
  LIMIT 100;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_accounts(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_accounts(text) TO authenticated;
