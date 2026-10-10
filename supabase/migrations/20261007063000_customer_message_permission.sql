-- Customer replies must check a professional's paid entitlement without depending
-- on the professional-only RLS policy on lead_agent_state.
CREATE FUNCTION public.can_customer_message_lead(p_lead_id uuid,p_agent_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.leads l JOIN public.lead_agent_state s ON s.lead_id=l.id
    WHERE l.id=p_lead_id AND l.customer_user_id=auth.uid() AND s.agent_id=p_agent_id AND s.contacted
  );
$$;
REVOKE ALL ON FUNCTION public.can_customer_message_lead(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_customer_message_lead(uuid,uuid) TO authenticated;
DROP POLICY messages_customer_insert ON public.lead_messages;
CREATE POLICY messages_customer_insert ON public.lead_messages FOR INSERT TO authenticated WITH CHECK(
  sender_type='customer' AND agent_id IS NOT NULL AND length(trim(message)) BETWEEN 1 AND 4000
  AND public.can_customer_message_lead(lead_id,agent_id)
);
