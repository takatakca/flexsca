ALTER TABLE public.reminders ADD COLUMN request_id uuid;
ALTER TABLE public.reminders ADD COLUMN notified_at timestamptz;
CREATE UNIQUE INDEX reminders_request_deduplication ON public.reminders(user_id,request_id) WHERE request_id IS NOT NULL;
CREATE INDEX reminders_due_pending ON public.reminders(user_id,remind_at) WHERE status='open' AND notified_at IS NULL;
REVOKE INSERT,UPDATE ON public.reminders FROM anon,authenticated;
GRANT UPDATE(status) ON public.reminders TO authenticated;

CREATE FUNCTION public.create_follow_up(p_lead_id uuid,p_remind_at timestamptz,p_note text DEFAULT NULL,p_request_id uuid DEFAULT gen_random_uuid()) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE existing public.reminders%ROWTYPE; created uuid; note_value text := nullif(btrim(p_note),'');
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_request_id IS NULL THEN RAISE EXCEPTION 'Invalid reminder'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('follow-up-user:'||auth.uid()::text,0));
  SELECT * INTO existing FROM public.reminders WHERE user_id=auth.uid() AND request_id=p_request_id;
  IF FOUND THEN
    IF existing.lead_id IS DISTINCT FROM p_lead_id OR existing.remind_at IS DISTINCT FROM p_remind_at OR existing.note IS DISTINCT FROM note_value THEN
      RAISE EXCEPTION 'Reminder request already used';
    END IF;
    RETURN existing.id;
  END IF;
  IF p_remind_at IS NULL OR p_remind_at <= now() OR p_remind_at > now()+interval '365 days' OR length(COALESCE(note_value,''))>2000 THEN
    RAISE EXCEPTION 'Invalid reminder';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.leads_safe WHERE id=p_lead_id) THEN RAISE EXCEPTION 'Request not available'; END IF;
  IF (SELECT count(*) FROM public.reminders WHERE user_id=auth.uid() AND created_at>now()-interval '1 hour')>=100 THEN
    RAISE EXCEPTION 'Too many reminders';
  END IF;
  INSERT INTO public.reminders(lead_id,user_id,remind_at,note,request_id)
    VALUES(p_lead_id,auth.uid(),p_remind_at,note_value,p_request_id) RETURNING id INTO created;
  RETURN created;
END $$;

-- Collect only this user's due reminders when their app refreshes.
-- This is in-app delivery, not a background email/SMS/push scheduler.
CREATE FUNCTION public.collect_due_follow_ups() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE reminder record; delivered integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  FOR reminder IN SELECT id,lead_id FROM public.reminders
    WHERE user_id=auth.uid() AND status='open' AND notified_at IS NULL AND remind_at<=now()
    ORDER BY remind_at,id LIMIT 100 FOR UPDATE SKIP LOCKED
  LOOP
    INSERT INTO public.notifications(user_id,lead_id,title) VALUES(auth.uid(),reminder.lead_id,'A follow-up reminder is due');
    UPDATE public.reminders SET notified_at=now() WHERE id=reminder.id;
    delivered := delivered+1;
  END LOOP;
  RETURN delivered;
END $$;
REVOKE ALL ON FUNCTION public.create_follow_up(uuid,timestamptz,text,uuid),public.collect_due_follow_ups() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_follow_up(uuid,timestamptz,text,uuid),public.collect_due_follow_ups() TO authenticated;
