
-- Allow unauthenticated users to insert leads (customer job posting)
DROP POLICY IF EXISTS "leads_insert_authenticated" ON public.leads;
CREATE POLICY "leads_insert_anyone"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- Allow unauthenticated users to insert lead messages (customer's initial message)
DROP POLICY IF EXISTS "msgs_insert_if_contacted" ON public.lead_messages;
CREATE POLICY "msgs_insert_allowed"
  ON public.lead_messages FOR INSERT
  WITH CHECK (
    -- Professionals: must be contacted
    (sender_type = 'pro' AND EXISTS (
      SELECT 1 FROM lead_agent_state s
      WHERE s.lead_id = lead_messages.lead_id AND s.agent_id = auth.uid() AND s.contacted = true
    ))
    OR
    -- Customers and system: allow insert (no auth required)
    (sender_type IN ('customer', 'system'))
  );
