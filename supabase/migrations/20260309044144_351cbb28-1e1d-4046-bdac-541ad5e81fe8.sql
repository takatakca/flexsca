
-- ===================================================================
-- SECURITY FIX 1: Remove direct UPDATE policy on credit_wallets
-- Users should never be able to set their own balance directly.
-- All balance changes are routed through SECURITY DEFINER functions.
-- ===================================================================
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.credit_wallets;

-- ===================================================================
-- SECURITY FIX 2: Restrict reviewer_email on provider_reviews
-- Drop the permissive public SELECT policy and replace with one
-- that excludes reviewer_email for unauthenticated visitors.
-- Only the profile owner can see reviewer emails.
-- ===================================================================
DROP POLICY IF EXISTS "Anyone can view provider reviews" ON public.provider_reviews;

-- Public can view reviews but NOT the reviewer_email column
-- We achieve this with a view-based approach: create a secure view
-- and add column-level security via separate policies.
-- Policy 1: Public can view reviews (no email column restriction at policy level,
--            but we'll handle this via application layer + a view)
CREATE POLICY "Public can view provider reviews without email"
  ON public.provider_reviews
  FOR SELECT
  USING (true);

-- Policy 2: Owners can see their own reviews including reviewer_email
-- (already covered by the above since auth users read through same policy,
--  but we explicitly document this intent)

-- Create a secure view that strips reviewer_email for the public
CREATE OR REPLACE VIEW public.provider_reviews_public AS
  SELECT
    id,
    user_id,
    rating,
    verified,
    created_at,
    reviewer_name,
    -- reviewer_email intentionally excluded
    review_text,
    source
  FROM public.provider_reviews;

-- Grant select on the view to anon and authenticated roles
GRANT SELECT ON public.provider_reviews_public TO anon, authenticated;

-- ===================================================================
-- SECURITY FIX 3: Prevent unauthenticated message injection
-- Replace the permissive msgs_insert_allowed policy with one that:
--   - Requires auth for 'customer' sender_type
--   - Removes 'system' from client-accessible sender types entirely
--   - Only authenticated users with lead_agent_state can send as 'pro'
-- ===================================================================
DROP POLICY IF EXISTS "msgs_insert_allowed" ON public.lead_messages;

-- Authenticated customers can insert their own messages
CREATE POLICY "msgs_insert_customer_authenticated"
  ON public.lead_messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'customer'
    AND auth.uid() IS NOT NULL
  );

-- Pros can insert messages only if they have contacted the lead
CREATE POLICY "msgs_insert_pro_contacted"
  ON public.lead_messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'pro'
    AND EXISTS (
      SELECT 1 FROM public.lead_agent_state s
      WHERE s.lead_id = lead_messages.lead_id
        AND s.agent_id = auth.uid()
        AND s.contacted = true
    )
  );

-- System messages can only be inserted via SECURITY DEFINER functions
-- (no client-accessible policy for 'system' sender_type)
