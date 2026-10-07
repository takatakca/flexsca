-- Search the entitlement-aware projection, never raw private lead data.
CREATE OR REPLACE FUNCTION public.search_marketplace_leads(
  p_filters jsonb DEFAULT '{}'::jsonb, p_page integer DEFAULT 0, p_page_size integer DEFAULT 20
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE result jsonb; cutoff timestamptz; upper_cutoff timestamptz; zone text := COALESCE(p_filters->>'timezone','UTC'); day_start timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF jsonb_typeof(p_filters) IS DISTINCT FROM 'object' OR octet_length(p_filters::text) > 8192
    OR p_page IS NULL OR p_page < 0 OR p_page > 100000
    OR p_page_size IS NULL OR p_page_size < 1 OR p_page_size > 50
    OR length(COALESCE(p_filters->>'keyword','')) > 200 THEN
    RAISE EXCEPTION 'Invalid search parameters';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name=zone) THEN RAISE EXCEPTION 'Invalid timezone'; END IF;
  day_start := date_trunc('day',now() AT TIME ZONE zone) AT TIME ZONE zone;
  cutoff := CASE p_filters->>'timeRange'
    WHEN 'last_hour' THEN now()-interval '1 hour'
    WHEN 'today' THEN day_start
    WHEN 'yesterday' THEN (date_trunc('day',now() AT TIME ZONE zone)-interval '1 day') AT TIME ZONE zone
    WHEN '3_days' THEN now()-interval '3 days'
    WHEN '7_days' THEN now()-interval '7 days'
    WHEN '2_weeks' THEN now()-interval '2 weeks' END;
  upper_cutoff := CASE WHEN p_filters->>'timeRange'='yesterday' THEN day_start END;
  WITH visible AS MATERIALIZED (
    SELECT l.*, COALESCE(s.is_unread,true) AS is_unread,
      COALESCE(s.is_archived,false) AS is_archived, COALESCE(s.contacted,false) AS contacted,
      COALESCE(s.first_to_respond,false) AS first_to_respond, s.custom_status_id
    FROM public.leads_safe l LEFT JOIN public.lead_agent_state s ON s.lead_id=l.id AND s.agent_id=auth.uid()
    WHERE COALESCE(s.is_archived,false)=COALESCE((p_filters->>'archived')::boolean,false)
      AND (l.status NOT IN ('closed','accepted') AND NOT l.archived OR COALESCE(s.contacted,false))
  ), filtered AS MATERIALIZED (
    SELECT * FROM visible l WHERE
      (btrim(COALESCE(p_filters->>'keyword',''))='' OR
        to_tsvector('simple',concat_ws(' ',l.category,l.location_text,l.customer_name,l.details))
          @@ websearch_to_tsquery('simple',p_filters->>'keyword'))
      AND (COALESCE(jsonb_array_length(p_filters->'services'),0)=0 OR l.category IN (SELECT jsonb_array_elements_text(p_filters->'services')))
      AND (COALESCE(jsonb_array_length(p_filters->'credits'),0)=0 OR l.credits_cost IN (SELECT value::integer FROM jsonb_array_elements_text(p_filters->'credits')))
      AND (COALESCE(jsonb_array_length(p_filters->'statusIds'),0)=0 OR l.custom_status_id::text IN (SELECT jsonb_array_elements_text(p_filters->'statusIds')))
      AND (NOT COALESCE((p_filters->>'urgentOnly')::boolean,false) OR l.is_urgent)
      AND (NOT COALESCE((p_filters->>'unreadOnly')::boolean,false) OR l.is_unread)
      AND (NOT COALESCE((p_filters->>'firstToRespondOnly')::boolean,false) OR l.first_to_respond)
      AND (NOT COALESCE((p_filters->>'hasAdditionalDetails')::boolean,false) OR l.has_additional_details)
      AND (cutoff IS NULL OR l.created_at>=cutoff)
      AND (upper_cutoff IS NULL OR l.created_at<upper_cutoff)
  ), page AS (
    SELECT * FROM filtered ORDER BY
      CASE WHEN p_filters->>'sort'='recommended' THEN is_urgent ELSE false END DESC,
      created_at DESC, id DESC LIMIT p_page_size OFFSET p_page*p_page_size
  )
  SELECT jsonb_build_object(
    'leads',COALESCE((SELECT jsonb_agg(to_jsonb(page) ORDER BY CASE WHEN p_filters->>'sort'='recommended' THEN is_urgent ELSE false END DESC, created_at DESC, id DESC) FROM page),'[]'::jsonb),
    'total',(SELECT count(*) FROM filtered),'page',p_page,'pageSize',p_page_size,
    'services',COALESCE((SELECT jsonb_agg(category ORDER BY category) FROM (SELECT DISTINCT category FROM visible) x),'[]'::jsonb),
    'credits',COALESCE((SELECT jsonb_agg(credits_cost ORDER BY credits_cost) FROM (SELECT DISTINCT credits_cost FROM visible) x),'[]'::jsonb)
  ) INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.search_marketplace_leads(jsonb,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.search_marketplace_leads(jsonb,integer,integer) TO authenticated;
CREATE INDEX IF NOT EXISTS leads_marketplace_created_idx ON public.leads(created_at DESC,id DESC) WHERE NOT archived;
