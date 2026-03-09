
-- Fix 1: Drop the overly-broad SELECT policy that exposes PII
DROP POLICY IF EXISTS "leads_read_authenticated" ON public.leads;

-- Create a view that hides PII for non-contacted leads
CREATE OR REPLACE VIEW public.leads_safe AS
SELECT
  id, category, location_text, city, postal_code, province,
  service_subtype, details, answers, status, credits_cost,
  is_urgent, has_additional_details, assigned_to,
  created_at, updated_at, submitted_at, last_activity_at,
  archived, archived_at,
  -- Only reveal PII if the caller has contacted this lead
  CASE WHEN EXISTS (
    SELECT 1 FROM public.lead_agent_state
    WHERE lead_id = leads.id AND agent_id = auth.uid() AND contacted = true
  ) THEN customer_name ELSE
    CASE WHEN customer_name IS NOT NULL THEN
      LEFT(customer_name, 1) || '***'
    ELSE NULL END
  END AS customer_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM public.lead_agent_state
    WHERE lead_id = leads.id AND agent_id = auth.uid() AND contacted = true
  ) THEN customer_email ELSE NULL END AS customer_email,
  CASE WHEN EXISTS (
    SELECT 1 FROM public.lead_agent_state
    WHERE lead_id = leads.id AND agent_id = auth.uid() AND contacted = true
  ) THEN customer_phone ELSE NULL END AS customer_phone
FROM public.leads;

-- Grant access to the safe view
GRANT SELECT ON public.leads_safe TO authenticated;

-- Re-add a SELECT policy that only allows reading leads assigned to you or where you have agent state
CREATE POLICY "leads_read_own" ON public.leads
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.lead_agent_state
      WHERE lead_id = leads.id AND agent_id = auth.uid()
    )
  );

-- Fix 2: Drop the overly-broad UPDATE policy
DROP POLICY IF EXISTS "leads_update_authenticated" ON public.leads;

-- Only allow updates through SECURITY DEFINER RPCs (no direct client UPDATE)
-- If needed, add a narrow policy for specific use cases:
-- For now, no direct UPDATE is allowed - all mutations go through RPCs
