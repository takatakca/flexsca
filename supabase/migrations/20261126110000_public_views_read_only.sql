-- SECURITY: the public projection views are read-only.
-- They run with their owner's rights so that anyone can read the safe columns. Supabase's default
-- privileges had also granted INSERT, UPDATE and DELETE on them to anon and authenticated, and a
-- simple view passes writes through to its table WITHOUT that table's row-level security: an
-- anonymous visitor could rename or delete professional profiles and reviews. Found and proven in
-- a rolled-back test on 2026-11-26 (no profile or review existed). Only SELECT stays.
DO $$
DECLARE v text;
BEGIN
  FOREACH v IN ARRAY ARRAY['provider_profiles_public', 'provider_reviews_public', 'leads_safe', 'lead_last_message'] LOOP
    IF to_regclass('public.' || v) IS NOT NULL THEN
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM PUBLIC, anon, authenticated', v);
    END IF;
  END LOOP;
END $$;

-- A trigger function is not an API: nobody needs to call it directly.
REVOKE EXECUTE ON FUNCTION public.block_frozen_wallet_spend() FROM PUBLIC, anon, authenticated;
