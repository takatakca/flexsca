
-- Fix Security Definer View warning: alter view to use security_invoker
ALTER VIEW public.provider_reviews_public SET (security_invoker = true);

-- Create a SECURITY DEFINER function for the public lead intake flow.
-- This allows unauthenticated customers to submit a lead + initial message
-- atomically, without opening up direct table access.
CREATE OR REPLACE FUNCTION public.submit_lead(
  p_category TEXT,
  p_location_text TEXT,
  p_city TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_answers JSONB DEFAULT '{}'::jsonb,
  p_is_urgent BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id UUID;
  v_message TEXT;
BEGIN
  -- Insert the lead (anyone can call this function)
  INSERT INTO public.leads (
    category, location_text, city, postal_code,
    customer_name, customer_email, customer_phone,
    details, answers, is_urgent, status
  ) VALUES (
    p_category, p_location_text, p_city, p_postal_code,
    p_customer_name, p_customer_email, p_customer_phone,
    p_details, p_answers, p_is_urgent, 'new'
  )
  RETURNING id INTO v_lead_id;

  -- Insert the initial customer message
  v_message := COALESCE(NULLIF(trim(p_details), ''), 'New ' || p_category || ' request');

  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES (v_lead_id, 'customer', v_message);

  RETURN v_lead_id;
END;
$$;

-- Grant execute to anon and authenticated (public intake flow)
GRANT EXECUTE ON FUNCTION public.submit_lead TO anon, authenticated;

-- Now drop the unauthenticated customer insert policy on lead_messages
-- (replaced by the SECURITY DEFINER function above)
DROP POLICY IF EXISTS "msgs_insert_customer_authenticated" ON public.lead_messages;

-- Keep only the pro insert policy (requires auth + contacted state)
-- The system messages are now only inserted via SECURITY DEFINER functions
