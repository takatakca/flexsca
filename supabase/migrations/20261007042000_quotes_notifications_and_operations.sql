BEGIN;
-- Price and status decisions are server-owned, never arbitrary provider updates.
REVOKE INSERT, UPDATE, DELETE ON public.responses FROM anon,authenticated;
CREATE POLICY responses_customer_read ON public.responses FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.customer_user_id = auth.uid())
);
CREATE FUNCTION public.send_quote(p_lead_id uuid,p_message text,p_price_min numeric DEFAULT NULL,p_price_max numeric DEFAULT NULL,p_availability text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM 1 FROM public.leads WHERE id = p_lead_id AND NOT archived AND status NOT IN ('won','lost') FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.lead_agent_state WHERE lead_id=p_lead_id AND agent_id=auth.uid() AND contacted) THEN
    RAISE EXCEPTION 'Quote not available';
  END IF;
  IF p_message IS NULL OR length(trim(p_message)) NOT BETWEEN 1 AND 4000
    OR (p_price_min IS NOT NULL AND (p_price_min < 0 OR p_price_min > 1000000 OR p_price_min::text IN ('NaN','Infinity','-Infinity')))
    OR (p_price_max IS NOT NULL AND (p_price_max < 0 OR p_price_max > 1000000 OR p_price_max::text IN ('NaN','Infinity','-Infinity')))
    OR (p_price_min IS NOT NULL AND p_price_max IS NOT NULL AND p_price_max < p_price_min) THEN RAISE EXCEPTION 'Invalid quote'; END IF;
  INSERT INTO public.responses(lead_id,pro_id,message,price_min,price_max,availability)
    VALUES(p_lead_id,auth.uid(),trim(p_message),p_price_min,p_price_max,p_availability) RETURNING id INTO v_id;
  INSERT INTO public.lead_messages(lead_id,agent_id,sender_type,message) VALUES(p_lead_id,auth.uid(),'pro',trim(p_message));
  RETURN v_id;
END $$;
CREATE FUNCTION public.decide_quote(p_quote_id uuid,p_decision text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lead_id uuid; v_quote record;
BEGIN
  IF p_decision IS NULL OR p_decision NOT IN ('accepted','declined') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  SELECT lead_id INTO v_lead_id FROM public.responses WHERE id = p_quote_id;
  PERFORM 1 FROM public.leads WHERE id = v_lead_id AND customer_user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  SELECT * INTO v_quote FROM public.responses WHERE id=p_quote_id FOR UPDATE;
  IF v_quote.status = p_decision THEN RETURN false; END IF;
  IF v_quote.status <> 'sent' THEN RAISE EXCEPTION 'Quote already decided'; END IF;
  IF p_decision='accepted' AND EXISTS(SELECT 1 FROM public.responses WHERE lead_id=v_lead_id AND status='accepted') THEN
    RAISE EXCEPTION 'A quote has already been accepted';
  END IF;
  UPDATE public.responses SET status=p_decision WHERE id=p_quote_id;
  IF p_decision='accepted' THEN
    UPDATE public.leads SET status='won',archived=true,archived_at=now() WHERE id=v_lead_id;
    UPDATE public.responses SET status='declined' WHERE lead_id=v_lead_id AND id<>p_quote_id AND status='sent';
  END IF;
  INSERT INTO public.lead_messages(lead_id,agent_id,sender_type,message)
    VALUES(v_lead_id,v_quote.pro_id,'system','Customer '||p_decision||' this quote.');
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.send_quote(uuid,text,numeric,numeric,text),public.decide_quote(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.send_quote(uuid,text,numeric,numeric,text),public.decide_quote(uuid,text) TO authenticated;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,title text NOT NULL,read_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_read_own ON public.notifications FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
REVOKE ALL ON public.notifications FROM anon,authenticated;
GRANT SELECT,UPDATE(read_at) ON public.notifications TO authenticated;
CREATE INDEX notifications_user_created ON public.notifications(user_id,created_at DESC);
CREATE FUNCTION public.notify_lead_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_customer uuid;
BEGIN
  SELECT customer_user_id INTO v_customer FROM public.leads WHERE id=NEW.lead_id;
  IF NEW.sender_type='pro' AND v_customer IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,lead_id,title) VALUES(v_customer,NEW.lead_id,'A professional sent you a message');
  ELSIF NEW.agent_id IS NOT NULL AND NEW.sender_type IN ('customer','system') THEN
    INSERT INTO public.notifications(user_id,lead_id,title) VALUES(NEW.agent_id,NEW.lead_id,
      CASE WHEN NEW.sender_type='customer' THEN 'A customer sent you a message' ELSE 'A customer updated a quote' END);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER lead_message_notification AFTER INSERT ON public.lead_messages FOR EACH ROW EXECUTE FUNCTION public.notify_lead_message();

-- Privileged operations require server-managed membership, not user_metadata.
CREATE TABLE public.platform_admins(user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE);
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_admins FROM anon,authenticated;
GRANT ALL ON public.platform_admins TO service_role;
CREATE FUNCTION public.is_platform_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.platform_admins WHERE user_id=auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
CREATE TABLE public.operation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),actor_id uuid REFERENCES public.profiles(id),action text NOT NULL,
  target_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.operation_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.operation_audit FROM anon,authenticated;
CREATE FUNCTION public.admin_lead_queue() RETURNS TABLE(id uuid,category text,city text,status text,archived boolean,created_at timestamptz,purchases bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT l.id,l.category,l.city,l.status,l.archived,l.created_at,
    (SELECT count(*) FROM public.lead_purchases p WHERE p.lead_id=l.id)
    FROM public.leads l ORDER BY l.created_at DESC LIMIT 100;
END $$;
CREATE FUNCTION public.admin_archive_lead(p_lead_id uuid,p_archived boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.leads SET archived=p_archived,archived_at=CASE WHEN p_archived THEN now() ELSE NULL END WHERE id=p_lead_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  INSERT INTO public.operation_audit(actor_id,action,target_id) VALUES(auth.uid(),CASE WHEN p_archived THEN 'archive_lead' ELSE 'restore_lead' END,p_lead_id);
END $$;
CREATE TABLE public.lead_refund_requests(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),purchase_id uuid NOT NULL UNIQUE REFERENCES public.lead_purchases(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),reason text NOT NULL CHECK(length(trim(reason)) BETWEEN 10 AND 2000),
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','declined')),created_at timestamptz NOT NULL DEFAULT now(),resolved_at timestamptz
);
ALTER TABLE public.lead_refund_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lead_refund_requests FROM anon,authenticated;
GRANT SELECT ON public.lead_refund_requests TO authenticated;
CREATE POLICY refund_read ON public.lead_refund_requests FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_platform_admin());
CREATE FUNCTION public.request_lead_refund(p_lead_id uuid,p_reason text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_purchase uuid; v_id uuid;
BEGIN
  SELECT id INTO v_purchase FROM public.lead_purchases WHERE lead_id=p_lead_id AND user_id=auth.uid();
  IF v_purchase IS NULL THEN RAISE EXCEPTION 'Purchase not found'; END IF;
  INSERT INTO public.lead_refund_requests(purchase_id,user_id,reason) VALUES(v_purchase,auth.uid(),trim(p_reason))
    ON CONFLICT(purchase_id) DO NOTHING RETURNING id INTO v_id;
  RETURN COALESCE(v_id,(SELECT id FROM public.lead_refund_requests WHERE purchase_id=v_purchase));
END $$;
CREATE FUNCTION public.admin_decide_refund(p_request_id uuid,p_approve boolean) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_request record; v_purchase record;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO v_request FROM public.lead_refund_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Refund not found'; END IF;
  IF v_request.status <> 'pending' THEN RETURN false; END IF;
  SELECT * INTO v_purchase FROM public.lead_purchases WHERE id=v_request.purchase_id;
  IF p_approve THEN
    UPDATE public.credit_wallets SET balance=balance+v_purchase.cost,updated_at=now() WHERE user_id=v_request.user_id;
    INSERT INTO public.credit_transactions(user_id,lead_id,delta,reason) VALUES(v_request.user_id,v_purchase.lead_id,v_purchase.cost,'refund');
  END IF;
  UPDATE public.lead_refund_requests SET status=CASE WHEN p_approve THEN 'approved' ELSE 'declined' END,resolved_at=now() WHERE id=p_request_id;
  INSERT INTO public.operation_audit(actor_id,action,target_id) VALUES(auth.uid(),CASE WHEN p_approve THEN 'approve_refund' ELSE 'decline_refund' END,p_request_id);
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.admin_lead_queue(),public.admin_archive_lead(uuid,boolean),public.request_lead_refund(uuid,text),public.admin_decide_refund(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_lead_queue(),public.admin_archive_lead(uuid,boolean),public.request_lead_refund(uuid,text),public.admin_decide_refund(uuid,boolean) TO authenticated;
-- Merchant reputation/verification can only be set by a trusted backend.
REVOKE INSERT,UPDATE ON public.merchant_profiles FROM anon,authenticated;
GRANT INSERT(user_id) ON public.merchant_profiles TO authenticated;
GRANT UPDATE(business_name,business_description,cover_image_url,logo_url,primary_category,address,city,province,postal_code,phone,website,menu_url,latitude,longitude,specialties,history,business_status,updated_at) ON public.merchant_profiles TO authenticated;
COMMIT;
