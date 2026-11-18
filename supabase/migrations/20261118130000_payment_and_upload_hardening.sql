-- 1. Public media bucket: images only, 5 MB. Before this any signed-in user could store
--    any file type of any size on a public URL (HTML or SVG pages, large files).
UPDATE storage.buckets SET file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id = 'provider-media';

-- 2. Refunds and chargebacks take the credits back. Without this a buyer could pay,
--    spend the credits, dispute the charge and keep both.
CREATE OR REPLACE FUNCTION public.validate_credit_purchase() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.credits <= 0 THEN RAISE EXCEPTION 'credits must be > 0'; END IF;
  IF NEW.amount_cents <= 0 THEN RAISE EXCEPTION 'amount_cents must be > 0'; END IF;
  IF NEW.status NOT IN ('created','paid','failed','refunded','disputed') THEN RAISE EXCEPTION 'Invalid status: %', NEW.status; END IF;
  RETURN NEW;
END $$;

ALTER TABLE public.credit_wallets ADD COLUMN IF NOT EXISTS frozen_at timestamptz;

CREATE OR REPLACE FUNCTION public.reverse_credit_purchase(p_payment_intent_id text, p_kind text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v public.credit_purchases;
BEGIN
  IF p_kind NOT IN ('refunded','disputed') THEN RAISE EXCEPTION 'Invalid reversal'; END IF;
  SELECT * INTO v FROM public.credit_purchases WHERE stripe_payment_intent_id = p_payment_intent_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v.status <> 'paid' THEN
    -- Already reversed once; a dispute after a refund only freezes.
    IF p_kind = 'disputed' THEN UPDATE public.credit_wallets SET frozen_at = COALESCE(frozen_at, now()) WHERE user_id = v.user_id; END IF;
    RETURN false;
  END IF;
  UPDATE public.credit_purchases SET status = p_kind WHERE id = v.id;
  -- The balance may go below zero: the debt is cleared by the next purchase.
  UPDATE public.credit_wallets SET balance = balance - v.credits, updated_at = now(),
    frozen_at = CASE WHEN p_kind = 'disputed' THEN COALESCE(frozen_at, now()) ELSE frozen_at END
  WHERE user_id = v.user_id;
  INSERT INTO public.credit_transactions (user_id, delta, reason) VALUES (v.user_id, -v.credits, 'purchase_reversal');
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reverse_credit_purchase(text, text) FROM PUBLIC, anon, authenticated;

-- 3. Limit how many checkouts one account can open, so the checkout cannot be used to
--    test stolen card numbers.
CREATE OR REPLACE FUNCTION public.checkout_allowed(p_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT (SELECT count(*) FROM public.credit_purchases WHERE user_id = p_user_id AND created_at > now() - interval '1 hour') < 5
     AND (SELECT count(*) FROM public.credit_purchases WHERE user_id = p_user_id AND created_at > now() - interval '1 day') < 15
     AND NOT EXISTS (SELECT 1 FROM public.credit_wallets WHERE user_id = p_user_id AND frozen_at IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION public.checkout_allowed(uuid) FROM PUBLIC, anon, authenticated;

-- 4. A wallet frozen by a chargeback cannot spend until an administrator clears it.
CREATE OR REPLACE FUNCTION public.block_frozen_wallet_spend() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.reason = 'spend_lead' AND EXISTS (SELECT 1 FROM public.credit_wallets WHERE user_id = NEW.user_id AND frozen_at IS NOT NULL) THEN
    RAISE EXCEPTION 'ACCOUNT_FROZEN';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS block_frozen_wallet_spend ON public.credit_transactions;
CREATE TRIGGER block_frozen_wallet_spend BEFORE INSERT ON public.credit_transactions FOR EACH ROW EXECUTE FUNCTION public.block_frozen_wallet_spend();

CREATE OR REPLACE FUNCTION public.admin_unfreeze_wallet(p_user_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE public.credit_wallets SET frozen_at = NULL WHERE user_id = p_user_id;
END $$;
REVOKE ALL ON FUNCTION public.admin_unfreeze_wallet(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_unfreeze_wallet(uuid) TO authenticated;
