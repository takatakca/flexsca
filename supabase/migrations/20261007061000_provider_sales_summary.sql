CREATE FUNCTION public.provider_sales_summary(p_since timestamptz DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_since IS NOT NULL AND p_since>now() THEN RAISE EXCEPTION 'Invalid reporting period'; END IF;
  WITH own_quotes AS MATERIALIZED (
    SELECT * FROM public.responses WHERE pro_id=auth.uid() AND (p_since IS NULL OR created_at>=p_since)
  ), own_credits AS MATERIALIZED (
    SELECT * FROM public.credit_transactions WHERE user_id=auth.uid() AND (p_since IS NULL OR created_at>=p_since)
  )
  SELECT jsonb_build_object(
    'quotedRequests',(SELECT count(DISTINCT lead_id) FROM own_quotes),
    'acceptedRequests',(SELECT count(DISTINCT lead_id) FROM own_quotes WHERE status='accepted'),
    'pendingQuotes',(SELECT count(*) FROM own_quotes WHERE status='sent'),
    'declinedQuotes',(SELECT count(*) FROM own_quotes WHERE status='declined'),
    'pricedAccepted',(SELECT count(*) FROM own_quotes WHERE status='accepted' AND COALESCE(price_min,price_max) IS NOT NULL),
    'estimatedMin',COALESCE((SELECT sum(COALESCE(price_min,price_max)) FROM own_quotes WHERE status='accepted'),0),
    'estimatedMax',COALESCE((SELECT sum(COALESCE(price_max,price_min)) FROM own_quotes WHERE status='accepted'),0),
    'creditsSpent',COALESCE((SELECT sum(-delta) FROM own_credits WHERE reason='spend_lead' AND delta<0),0),
    'creditsRefunded',COALESCE((SELECT sum(delta) FROM own_credits WHERE reason='refund' AND delta>0),0)
  ) INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.provider_sales_summary(timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.provider_sales_summary(timestamptz) TO authenticated;
CREATE INDEX IF NOT EXISTS responses_provider_created_idx ON public.responses(pro_id,created_at DESC);
CREATE INDEX IF NOT EXISTS credit_transactions_provider_created_idx ON public.credit_transactions(user_id,created_at DESC);
