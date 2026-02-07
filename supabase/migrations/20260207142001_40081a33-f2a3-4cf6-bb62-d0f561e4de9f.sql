
-- Fix: Drop and recreate view with SECURITY INVOKER
DROP VIEW IF EXISTS public.lead_last_message;

CREATE VIEW public.lead_last_message
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (lm.lead_id)
  lm.lead_id,
  lm.message,
  lm.sender_type,
  lm.created_at
FROM public.lead_messages lm
ORDER BY lm.lead_id, lm.created_at DESC;
