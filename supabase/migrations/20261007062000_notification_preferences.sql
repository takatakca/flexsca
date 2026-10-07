CREATE TABLE public.notification_preferences(
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  messages boolean NOT NULL DEFAULT true,reminders boolean NOT NULL DEFAULT true
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_preferences_own ON public.notification_preferences FOR ALL TO authenticated
  USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
REVOKE ALL ON public.notification_preferences FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.notification_preferences TO authenticated;
GRANT INSERT(user_id,messages,reminders),UPDATE(messages,reminders) ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
CREATE FUNCTION public.set_notification_preferences(p_messages boolean,p_reminders boolean) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL OR p_messages IS NULL OR p_reminders IS NULL THEN RAISE EXCEPTION 'Invalid notification preferences'; END IF;
  INSERT INTO public.notification_preferences(user_id,messages,reminders) VALUES(auth.uid(),p_messages,p_reminders)
    ON CONFLICT(user_id) DO UPDATE SET messages=EXCLUDED.messages,reminders=EXCLUDED.reminders;
END $$;
REVOKE ALL ON FUNCTION public.set_notification_preferences(boolean,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_notification_preferences(boolean,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_lead_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE customer uuid; recipient uuid; title text;
BEGIN
  SELECT customer_user_id INTO customer FROM public.leads WHERE id=NEW.lead_id;
  IF NEW.sender_type='pro' THEN recipient := customer; title := 'A professional sent you a message';
  ELSIF NEW.agent_id IS NOT NULL AND NEW.sender_type IN ('customer','system') THEN
    recipient := NEW.agent_id; title := CASE WHEN NEW.sender_type='customer' THEN 'A customer sent you a message' ELSE 'A customer updated a quote' END;
  END IF;
  IF recipient IS NOT NULL AND COALESCE((SELECT messages FROM public.notification_preferences WHERE user_id=recipient),true) THEN
    INSERT INTO public.notifications(user_id,lead_id,title) VALUES(recipient,NEW.lead_id,title);
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.collect_due_follow_ups() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE reminder record; delivered integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT COALESCE((SELECT reminders FROM public.notification_preferences WHERE user_id=auth.uid()),true) THEN RETURN 0; END IF;
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
