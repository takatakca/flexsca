CREATE TABLE public.support_tickets(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject text NOT NULL CHECK(length(subject) BETWEEN 3 AND 120),
  category text NOT NULL CHECK(category IN ('general','credits','account','privacy')),
  status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
  request_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,request_id)
);
CREATE TABLE public.support_messages(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id),is_staff boolean NOT NULL DEFAULT false,
  message text NOT NULL CHECK(length(message) BETWEEN 1 AND 4000),request_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(ticket_id,author_id,request_id)
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_tickets,public.support_messages FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.support_tickets,public.support_messages TO authenticated;
GRANT ALL ON public.support_tickets,public.support_messages TO service_role;
CREATE POLICY support_ticket_private_read ON public.support_tickets FOR SELECT TO authenticated
  USING(user_id=auth.uid() OR public.is_platform_admin());
CREATE POLICY support_message_private_read ON public.support_messages FOR SELECT TO authenticated
  USING(EXISTS(SELECT 1 FROM public.support_tickets t WHERE t.id=ticket_id AND (t.user_id=auth.uid() OR public.is_platform_admin())));
CREATE INDEX support_tickets_user_updated ON public.support_tickets(user_id,updated_at DESC,id DESC);
CREATE INDEX support_tickets_open_updated ON public.support_tickets(updated_at DESC) WHERE status='open';
CREATE INDEX support_messages_ticket_created ON public.support_messages(ticket_id,created_at,id);
ALTER TABLE public.notifications ADD COLUMN support_ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE;

CREATE FUNCTION public.create_support_ticket(p_subject text,p_category text,p_message text,p_request_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE existing public.support_tickets%ROWTYPE; ticket uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_subject IS NULL OR length(btrim(p_subject)) NOT BETWEEN 3 AND 120 OR p_category IS NULL OR p_category NOT IN ('general','credits','account','privacy')
    OR p_message IS NULL OR length(btrim(p_message)) NOT BETWEEN 10 AND 4000 OR p_request_id IS NULL THEN RAISE EXCEPTION 'Invalid support request'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('support-create:'||auth.uid()::text,0));
  SELECT * INTO existing FROM public.support_tickets WHERE user_id=auth.uid() AND request_id=p_request_id;
  IF FOUND THEN
    IF existing.subject<>btrim(p_subject) OR existing.category<>p_category OR NOT EXISTS(
      SELECT 1 FROM public.support_messages WHERE ticket_id=existing.id AND author_id=auth.uid() AND request_id=p_request_id AND message=btrim(p_message)) THEN
      RAISE EXCEPTION 'Support request already used';
    END IF;
    RETURN existing.id;
  END IF;
  IF (SELECT count(*) FROM public.support_tickets WHERE user_id=auth.uid() AND created_at>now()-interval '1 hour')>=5 THEN RAISE EXCEPTION 'Too many support requests'; END IF;
  INSERT INTO public.support_tickets(user_id,subject,category,request_id) VALUES(auth.uid(),btrim(p_subject),p_category,p_request_id) RETURNING id INTO ticket;
  INSERT INTO public.support_messages(ticket_id,author_id,message,request_id) VALUES(ticket,auth.uid(),btrim(p_message),p_request_id);
  RETURN ticket;
END $$;

CREATE FUNCTION public.reply_support_ticket(p_ticket_id uuid,p_message text,p_request_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ticket public.support_tickets%ROWTYPE; staff boolean:=public.is_platform_admin(); existing public.support_messages%ROWTYPE; created uuid;
BEGIN
  IF auth.uid() IS NULL OR p_message IS NULL OR length(btrim(p_message)) NOT BETWEEN 1 AND 4000 OR p_request_id IS NULL THEN RAISE EXCEPTION 'Invalid reply'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('support-reply:'||auth.uid()::text,0));
  SELECT * INTO ticket FROM public.support_tickets WHERE id=p_ticket_id AND (user_id=auth.uid() OR staff) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket not found'; END IF;
  SELECT * INTO existing FROM public.support_messages WHERE ticket_id=p_ticket_id AND author_id=auth.uid() AND request_id=p_request_id;
  IF FOUND THEN
    IF existing.message<>btrim(p_message) THEN RAISE EXCEPTION 'Reply request already used'; END IF;
    RETURN existing.id;
  END IF;
  IF ticket.status='closed' THEN RAISE EXCEPTION 'Ticket is closed'; END IF;
  IF (SELECT count(*) FROM public.support_messages WHERE author_id=auth.uid() AND created_at>now()-interval '1 hour')>=60 THEN RAISE EXCEPTION 'Too many replies'; END IF;
  INSERT INTO public.support_messages(ticket_id,author_id,is_staff,message,request_id)
    VALUES(p_ticket_id,auth.uid(),staff,btrim(p_message),p_request_id) RETURNING id INTO created;
  UPDATE public.support_tickets SET updated_at=now() WHERE id=p_ticket_id;
  IF staff THEN
    INSERT INTO public.operation_audit(actor_id,action,target_id) VALUES(auth.uid(),'support_reply',p_ticket_id);
    IF ticket.user_id<>auth.uid() AND COALESCE((SELECT messages FROM public.notification_preferences WHERE user_id=ticket.user_id),true) THEN
      INSERT INTO public.notifications(user_id,support_ticket_id,title) VALUES(ticket.user_id,p_ticket_id,'Support replied to your ticket');
    END IF;
  END IF;
  RETURN created;
END $$;

CREATE FUNCTION public.set_support_ticket_status(p_ticket_id uuid,p_status text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ticket public.support_tickets%ROWTYPE; staff boolean:=public.is_platform_admin();
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('open','closed') THEN RAISE EXCEPTION 'Invalid ticket status'; END IF;
  SELECT * INTO ticket FROM public.support_tickets WHERE id=p_ticket_id AND (user_id=auth.uid() OR staff) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket not found'; END IF;
  IF ticket.status=p_status THEN RETURN; END IF;
  UPDATE public.support_tickets SET status=p_status,updated_at=now() WHERE id=p_ticket_id;
  INSERT INTO public.operation_audit(actor_id,action,target_id) VALUES(auth.uid(),'support_'||p_status,p_ticket_id);
END $$;
REVOKE ALL ON FUNCTION public.create_support_ticket(text,text,text,uuid),public.reply_support_ticket(uuid,text,uuid),public.set_support_ticket_status(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_support_ticket(text,text,text,uuid),public.reply_support_ticket(uuid,text,uuid),public.set_support_ticket_status(uuid,text) TO authenticated;
