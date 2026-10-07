BEGIN;
CREATE FUNCTION public.customer_request_providers(p_lead_id uuid)
RETURNS TABLE(user_id uuid,company_name text,profile_photo_url text,contacted_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.leads WHERE id = p_lead_id AND customer_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  RETURN QUERY SELECT s.agent_id,COALESCE(p.company_name,'Professional'),p.profile_photo_url,s.contacted_at
    FROM public.lead_agent_state s LEFT JOIN public.provider_profiles p ON p.user_id = s.agent_id
    WHERE s.lead_id = p_lead_id AND s.contacted ORDER BY s.contacted_at;
END $$;
REVOKE ALL ON FUNCTION public.customer_request_providers(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.customer_request_providers(uuid) TO authenticated;
CREATE FUNCTION public.close_customer_request(p_lead_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.leads SET archived = true,archived_at = now() WHERE id = p_lead_id AND customer_user_id = auth.uid() AND NOT archived;
  RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.close_customer_request(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.close_customer_request(uuid) TO authenticated;
COMMIT;
