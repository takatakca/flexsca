-- Read-only delivery evidence and tightly scoped administrator replay.
CREATE FUNCTION public.admin_attribution_health() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required'; END IF;
  SELECT jsonb_build_object(
    'pending',count(*) FILTER(WHERE delivered_at IS NULL AND attempts<12),
    'delivered',count(*) FILTER(WHERE delivered_at IS NOT NULL),
    'exhausted',count(*) FILTER(WHERE delivered_at IS NULL AND attempts>=12),
    'leased',count(*) FILTER(WHERE delivered_at IS NULL AND leased_until>now()),
    'lastDeliveredAt',max(delivered_at),
    'oldestPendingAt',min(occurred_at) FILTER(WHERE delivered_at IS NULL),
    'recent',COALESCE((SELECT jsonb_agg(item ORDER BY occurred_at DESC,id DESC) FROM (
      SELECT id,occurred_at,attempts,last_status,delivered_at,next_attempt_at,
        (leased_until>now()) AS leased
      FROM public.takatak_attribution_outbox ORDER BY occurred_at DESC,id DESC LIMIT 20
    ) item),'[]'::jsonb)
  ) INTO result FROM public.takatak_attribution_outbox;
  RETURN result;
END $$;
CREATE FUNCTION public.admin_retry_attribution(p_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE job public.takatak_attribution_outbox%ROWTYPE;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required'; END IF;
  SELECT * INTO job FROM public.takatak_attribution_outbox WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;
  IF job.delivered_at IS NOT NULL THEN RAISE EXCEPTION 'Event already delivered'; END IF;
  IF job.leased_until>now() THEN RAISE EXCEPTION 'Event is being delivered'; END IF;
  -- The retry button only releases exhausted jobs, never duplicates active work.
  IF job.attempts<12 THEN RETURN false; END IF;
  UPDATE public.takatak_attribution_outbox SET attempts=0,next_attempt_at=now(),lease_id=NULL,leased_until=NULL WHERE id=p_id;
  INSERT INTO public.operation_audit(actor_id,action,target_id) VALUES(auth.uid(),'attribution_retry',p_id);
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.admin_attribution_health(),public.admin_retry_attribution(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_attribution_health(),public.admin_retry_attribution(uuid) TO authenticated;
