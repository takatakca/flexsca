
-- Credit purchases table for Stripe payment tracking
CREATE TABLE public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  credits INT NOT NULL,
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'cad',
  status TEXT NOT NULL DEFAULT 'created',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation triggers instead of CHECK constraints
CREATE OR REPLACE FUNCTION public.validate_credit_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.credits <= 0 THEN
    RAISE EXCEPTION 'credits must be > 0';
  END IF;
  IF NEW.amount_cents <= 0 THEN
    RAISE EXCEPTION 'amount_cents must be > 0';
  END IF;
  IF NEW.status NOT IN ('created', 'paid', 'failed') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_credit_purchase_trigger
BEFORE INSERT OR UPDATE ON public.credit_purchases
FOR EACH ROW EXECUTE FUNCTION public.validate_credit_purchase();

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own credit purchases"
ON public.credit_purchases FOR SELECT
USING (user_id = auth.uid());

-- No direct insert/update from client — only service role (edge functions)

CREATE INDEX idx_credit_purchases_user_id ON public.credit_purchases(user_id);

-- Function to fulfill a credit purchase (called by webhook edge function via service role)
CREATE OR REPLACE FUNCTION public.fulfill_credit_purchase(
  p_user_id UUID,
  p_session_id TEXT,
  p_payment_intent_id TEXT,
  p_credits INT,
  p_amount_cents INT,
  p_currency TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Idempotency: check if already fulfilled
  IF EXISTS (
    SELECT 1 FROM public.credit_purchases
    WHERE stripe_checkout_session_id = p_session_id AND status = 'paid'
  ) THEN
    RETURN FALSE; -- Already processed
  END IF;

  -- Upsert purchase record
  INSERT INTO public.credit_purchases (user_id, stripe_checkout_session_id, stripe_payment_intent_id, credits, amount_cents, currency, status)
  VALUES (p_user_id, p_session_id, p_payment_intent_id, p_credits, p_amount_cents, p_currency, 'paid')
  ON CONFLICT (stripe_checkout_session_id)
  DO UPDATE SET status = 'paid', stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id;

  -- Upsert wallet balance
  INSERT INTO public.credit_wallets (user_id, balance, updated_at)
  VALUES (p_user_id, p_credits, now())
  ON CONFLICT (user_id)
  DO UPDATE SET balance = credit_wallets.balance + p_credits, updated_at = now();

  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, delta, reason)
  VALUES (p_user_id, p_credits, 'purchase');

  RETURN TRUE; -- Successfully fulfilled
END;
$$;
