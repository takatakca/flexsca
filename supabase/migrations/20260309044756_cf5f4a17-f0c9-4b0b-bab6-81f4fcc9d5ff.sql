
-- Fix: Change view to security invoker to respect RLS of the querying user
CREATE OR REPLACE VIEW public.leads_safe
WITH (security_invoker = true)
AS
SELECT
  id, category, location_text, city, postal_code, province,
  service_subtype, details, answers, status, credits_cost,
  is_urgent, has_additional_details, assigned_to,
  created_at, updated_at, submitted_at, last_activity_at,
  archived, archived_at,
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
