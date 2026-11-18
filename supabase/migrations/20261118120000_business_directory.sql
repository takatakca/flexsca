-- Public business directory: businesses listed before they sign up.
-- A listing carries a name, a city, a trade and its public licence number. It never stores
-- or shows an email, a phone number or a street address. The owner claims it to get a
-- FLEXS account with a 30-day trial.

CREATE TABLE IF NOT EXISTS public.business_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('rbq')),
  source_ref text NOT NULL CHECK (char_length(source_ref) BETWEEN 1 AND 40),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  other_name text CHECK (other_name IS NULL OR char_length(other_name) <= 200),
  city text NOT NULL CHECK (char_length(city) BETWEEN 1 AND 120),
  region text CHECK (region IS NULL OR char_length(region) <= 120),
  province text NOT NULL DEFAULT 'QC',
  trade text NOT NULL CHECK (char_length(trade) <= 80),
  category_slug text,
  trade_codes text[] NOT NULL DEFAULT '{}',
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,160}$'),
  status text NOT NULL DEFAULT 'listed' CHECK (status IN ('listed','claimed','removed')),
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  trial_granted_at timestamptz,
  source_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_ref)
);
CREATE INDEX IF NOT EXISTS business_listings_city_trade_idx ON public.business_listings (lower(city), trade) WHERE status <> 'removed';
CREATE INDEX IF NOT EXISTS business_listings_name_idx ON public.business_listings (name) WHERE status <> 'removed';
CREATE UNIQUE INDEX IF NOT EXISTS business_listings_one_per_owner ON public.business_listings (claimed_by) WHERE claimed_by IS NOT NULL;
-- When the owning account is deleted the listing goes back to unclaimed; its trial stays used.
CREATE OR REPLACE FUNCTION public.business_listing_release() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.claimed_by IS NULL AND OLD.claimed_by IS NOT NULL AND NEW.status = 'claimed' THEN NEW.status := 'listed'; NEW.claimed_at := NULL; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS business_listing_release ON public.business_listings;
CREATE TRIGGER business_listing_release BEFORE UPDATE ON public.business_listings FOR EACH ROW EXECUTE FUNCTION public.business_listing_release();
ALTER TABLE public.business_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Listings are public" ON public.business_listings;
CREATE POLICY "Listings are public" ON public.business_listings FOR SELECT TO anon, authenticated USING (status <> 'removed');
REVOKE ALL ON public.business_listings FROM anon, authenticated;
GRANT SELECT (id, source, source_ref, name, other_name, city, region, province, trade, category_slug, slug, status, claimed_at) ON public.business_listings TO anon, authenticated;

-- Proof of ownership without keeping contact details: only a SHA-256 of the email the
-- business gave its licensing body. No policy: clients can never read this table.
CREATE TABLE IF NOT EXISTS public.business_listing_verifiers (
  listing_id uuid PRIMARY KEY REFERENCES public.business_listings(id) ON DELETE CASCADE,
  email_sha256 text NOT NULL CHECK (email_sha256 ~ '^[0-9a-f]{64}$')
);
ALTER TABLE public.business_listing_verifiers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_listing_verifiers FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.business_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.business_listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','manager','employee')),
  note text CHECK (note IS NULL OR char_length(note) <= 500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  method text CHECK (method IN ('email_match','admin')),
  decided_by uuid, decided_at timestamptz, decision_note text CHECK (decision_note IS NULL OR char_length(decision_note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS business_claims_one_open_per_listing ON public.business_claims (listing_id) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS business_claims_one_open_per_user ON public.business_claims (user_id) WHERE status = 'pending';
ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see their own claims" ON public.business_claims;
CREATE POLICY "Users see their own claims" ON public.business_claims FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE ALL ON public.business_claims FROM anon, authenticated;
GRANT SELECT ON public.business_claims TO authenticated;

CREATE TABLE IF NOT EXISTS public.provider_trials (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.business_listings(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  credits_granted integer NOT NULL CHECK (credits_granted >= 0)
);
ALTER TABLE public.provider_trials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see their own trial" ON public.provider_trials;
CREATE POLICY "Users see their own trial" ON public.provider_trials FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE ALL ON public.provider_trials FROM anon, authenticated;
GRANT SELECT ON public.provider_trials TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_credit_transaction_reason() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.reason NOT IN ('purchase','spend_lead','refund','admin_adjust','signup_bonus','trial_bonus','purchase_reversal') THEN
    RAISE EXCEPTION 'Invalid credit transaction reason: %', NEW.reason;
  END IF;
  RETURN NEW;
END $$;

-- Trial size. One row; the owner changes it in SQL or a later admin screen.
CREATE TABLE IF NOT EXISTS public.directory_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  trial_days integer NOT NULL DEFAULT 30 CHECK (trial_days BETWEEN 1 AND 365),
  trial_credits integer NOT NULL DEFAULT 20 CHECK (trial_credits BETWEEN 0 AND 500)
);
INSERT INTO public.directory_settings DEFAULT VALUES ON CONFLICT DO NOTHING;
ALTER TABLE public.directory_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trial terms are public" ON public.directory_settings;
CREATE POLICY "Trial terms are public" ON public.directory_settings FOR SELECT TO anon, authenticated USING (true);
REVOKE ALL ON public.directory_settings FROM anon, authenticated;
GRANT SELECT ON public.directory_settings TO anon, authenticated;

-- Internal: hand the listing to a user and start the trial. Never callable by clients.
CREATE OR REPLACE FUNCTION public.directory_grant_listing(p_claim uuid, p_method text, p_admin uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c public.business_claims; l public.business_listings; s public.directory_settings;
BEGIN
  SELECT * INTO c FROM public.business_claims WHERE id = p_claim FOR UPDATE;
  IF NOT FOUND OR c.status <> 'pending' THEN RAISE EXCEPTION 'Claim is not pending'; END IF;
  SELECT * INTO l FROM public.business_listings WHERE id = c.listing_id FOR UPDATE;
  IF l.status <> 'listed' THEN RAISE EXCEPTION 'Listing is not available'; END IF;
  SELECT * INTO s FROM public.directory_settings;
  UPDATE public.business_listings SET status = 'claimed', claimed_by = c.user_id, claimed_at = now() WHERE id = l.id;
  UPDATE public.business_claims SET status = 'approved', method = p_method, decided_by = p_admin, decided_at = now() WHERE id = c.id;
  INSERT INTO public.profiles (id, email) SELECT id, email FROM auth.users WHERE id = c.user_id ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.provider_profiles (user_id, company_name, city, province) VALUES (c.user_id, l.name, l.city, 'QC')
    ON CONFLICT (user_id) DO NOTHING;
  -- One trial per account and per listing, ever.
  IF l.trial_granted_at IS NULL AND NOT EXISTS (SELECT 1 FROM public.provider_trials WHERE user_id = c.user_id) THEN
    INSERT INTO public.provider_trials (user_id, listing_id, ends_at, credits_granted)
      VALUES (c.user_id, l.id, now() + make_interval(days => s.trial_days), s.trial_credits);
    UPDATE public.business_listings SET trial_granted_at = now() WHERE id = l.id;
    INSERT INTO public.credit_wallets (user_id, balance) VALUES (c.user_id, s.trial_credits)
      ON CONFLICT (user_id) DO UPDATE SET balance = credit_wallets.balance + s.trial_credits, updated_at = now();
    INSERT INTO public.credit_transactions (user_id, delta, reason) VALUES (c.user_id, s.trial_credits, 'trial_bonus');
  END IF;
  INSERT INTO public.notifications (user_id, title) VALUES (c.user_id, 'Your business is confirmed on FLEXS. Complete your profile to receive requests.');
END $$;
REVOKE ALL ON FUNCTION public.directory_grant_listing(uuid, text, uuid) FROM PUBLIC, anon, authenticated;

-- Claim a listing. Instant when the caller signed in with the confirmed email the business
-- gave its licensing body; otherwise it waits for an administrator.
CREATE OR REPLACE FUNCTION public.claim_business_listing(p_listing uuid, p_role text, p_note text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_user uuid := auth.uid(); v_email text; v_confirmed timestamptz; v_claim uuid; v_match boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in to claim a business'; END IF;
  IF p_role NOT IN ('owner','manager','employee') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  SELECT lower(email), email_confirmed_at INTO v_email, v_confirmed FROM auth.users WHERE id = v_user;
  IF v_confirmed IS NULL THEN RAISE EXCEPTION 'Confirm your email first'; END IF;
  IF EXISTS (SELECT 1 FROM public.business_listings WHERE claimed_by = v_user) THEN RAISE EXCEPTION 'This account already manages a business'; END IF;
  IF (SELECT count(*) FROM public.business_claims WHERE user_id = v_user AND created_at > now() - interval '30 days') >= 3 THEN
    RAISE EXCEPTION 'Too many claims. Contact support.';
  END IF;
  PERFORM 1 FROM public.business_listings WHERE id = p_listing AND status = 'listed' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This listing cannot be claimed'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.business_listing_verifiers v WHERE v.listing_id = p_listing
    AND v.email_sha256 = encode(sha256(convert_to(v_email, 'UTF8')), 'hex')) INTO v_match;
  -- A proven owner is never blocked by someone else's unproven claim.
  IF v_match THEN
    UPDATE public.business_claims SET status = 'rejected', method = 'email_match', decided_at = now(), decision_note = 'Another account proved ownership'
      WHERE listing_id = p_listing AND status = 'pending' AND user_id <> v_user;
  END IF;
  INSERT INTO public.business_claims (listing_id, user_id, role, note) VALUES (p_listing, v_user, p_role, NULLIF(btrim(left(p_note, 500)), ''))
    RETURNING id INTO v_claim;
  IF v_match THEN
    PERFORM public.directory_grant_listing(v_claim, 'email_match', NULL);
    RETURN jsonb_build_object('status', 'approved', 'claim_id', v_claim);
  END IF;
  RETURN jsonb_build_object('status', 'pending', 'claim_id', v_claim);
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'A claim is already open for this business or for your account';
END $$;
REVOKE ALL ON FUNCTION public.claim_business_listing(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_business_listing(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_claim_queue() RETURNS TABLE (claim_id uuid, created_at timestamptz, listing_name text, city text, trade text, licence text, claimant_email text, role text, note text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY SELECT c.id, c.created_at, l.name, l.city, l.trade, l.source_ref, u.email::text, c.role, c.note
    FROM public.business_claims c JOIN public.business_listings l ON l.id = c.listing_id JOIN auth.users u ON u.id = c.user_id
    WHERE c.status = 'pending' ORDER BY c.created_at LIMIT 200;
END $$;
REVOKE ALL ON FUNCTION public.admin_claim_queue() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_claim_queue() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_decide_claim(p_claim uuid, p_approve boolean, p_note text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_user uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF p_approve THEN
    PERFORM public.directory_grant_listing(p_claim, 'admin', auth.uid());
  ELSE
    UPDATE public.business_claims SET status = 'rejected', method = 'admin', decided_by = auth.uid(), decided_at = now(), decision_note = left(p_note, 500)
      WHERE id = p_claim AND status = 'pending' RETURNING user_id INTO v_user;
    IF NOT FOUND THEN RAISE EXCEPTION 'Claim is not pending'; END IF;
    INSERT INTO public.notifications (user_id, title) VALUES (v_user, 'Business claim not approved. Contact support to send proof that you represent this business.');
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.admin_decide_claim(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_decide_claim(uuid, boolean, text) TO authenticated;

-- A business that does not want to be listed is hidden and stays hidden on later imports.
CREATE OR REPLACE FUNCTION public.admin_remove_listing(p_listing uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE public.business_listings SET status = 'removed' WHERE id = p_listing AND status = 'listed';
  IF NOT FOUND THEN RAISE EXCEPTION 'Listing not found or already claimed'; END IF;
  DELETE FROM public.business_listing_verifiers WHERE listing_id = p_listing;
END $$;
REVOKE ALL ON FUNCTION public.admin_remove_listing(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_remove_listing(uuid) TO authenticated;
