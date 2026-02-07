
-- ============================================
-- Credit system tables
-- ============================================

-- 1) credit_wallets — one row per pro
CREATE TABLE public.credit_wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
ON public.credit_wallets FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own wallet"
ON public.credit_wallets FOR UPDATE
USING (user_id = auth.uid());

-- 2) credit_transactions — ledger
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger for reason
CREATE OR REPLACE FUNCTION public.validate_credit_transaction_reason()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.reason NOT IN ('purchase', 'spend_lead', 'refund', 'admin_adjust', 'signup_bonus') THEN
    RAISE EXCEPTION 'Invalid credit transaction reason: %', NEW.reason;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_credit_transaction_reason_trigger
BEFORE INSERT OR UPDATE ON public.credit_transactions
FOR EACH ROW EXECUTE FUNCTION public.validate_credit_transaction_reason();

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.credit_transactions FOR SELECT
USING (user_id = auth.uid());

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);

-- 3) lead_pricing_rules — cost per category
CREATE TABLE public.lead_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  base_cost INT NOT NULL DEFAULT 5
);

-- Validation trigger for base_cost >= 0
CREATE OR REPLACE FUNCTION public.validate_lead_pricing_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.base_cost < 0 THEN
    RAISE EXCEPTION 'base_cost must be >= 0, got %', NEW.base_cost;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_lead_pricing_cost_trigger
BEFORE INSERT OR UPDATE ON public.lead_pricing_rules
FOR EACH ROW EXECUTE FUNCTION public.validate_lead_pricing_cost();

ALTER TABLE public.lead_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pricing rules"
ON public.lead_pricing_rules FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4) lead_purchases — tracks which pro unlocked which lead
CREATE TABLE public.lead_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  cost INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lead_id)
);

ALTER TABLE public.lead_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases"
ON public.lead_purchases FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert purchases for their leads"
ON public.lead_purchases FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND public.is_lead_assigned_to_current_user(lead_id)
);

CREATE INDEX idx_lead_purchases_user_id ON public.lead_purchases(user_id);
CREATE INDEX idx_lead_purchases_lead_id ON public.lead_purchases(lead_id);

-- ============================================
-- Seed pricing rules for common categories
-- ============================================
INSERT INTO public.lead_pricing_rules (category, base_cost) VALUES
  ('House Cleaning', 5),
  ('Plumbing', 8),
  ('Garden Maintenance', 4),
  ('Painting & Decorating', 6),
  ('Removals', 10),
  ('Electrical Work', 9),
  ('Dog Walking', 3),
  ('Handyman', 5),
  ('Carpentry', 7),
  ('Locksmith', 8),
  ('Pest Control', 6),
  ('Roofing', 12),
  ('Window Cleaning', 4),
  ('Tutoring', 5),
  ('Photography', 6);

-- ============================================
-- Atomic unlock_lead function
-- ============================================
CREATE OR REPLACE FUNCTION public.unlock_lead(p_lead_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_category TEXT;
  v_cost INT;
  v_balance INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Verify lead belongs to user
  SELECT category INTO v_category
  FROM public.leads
  WHERE id = p_lead_id AND assigned_to = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found or not assigned to you';
  END IF;

  -- 2. Check if already purchased
  IF EXISTS (
    SELECT 1 FROM public.lead_purchases
    WHERE user_id = v_user_id AND lead_id = p_lead_id
  ) THEN
    RETURN 0; -- Already unlocked
  END IF;

  -- 3. Get cost from rules (fallback 5)
  SELECT base_cost INTO v_cost
  FROM public.lead_pricing_rules
  WHERE category = v_category;

  IF NOT FOUND THEN
    v_cost := 5;
  END IF;

  -- 4. Check balance
  SELECT balance INTO v_balance
  FROM public.credit_wallets
  WHERE user_id = v_user_id
  FOR UPDATE; -- Lock row to prevent race conditions

  IF NOT FOUND OR v_balance < v_cost THEN
    RAISE EXCEPTION 'Insufficient credits. Need %, have %', v_cost, COALESCE(v_balance, 0);
  END IF;

  -- 5. Deduct credits
  UPDATE public.credit_wallets
  SET balance = balance - v_cost, updated_at = now()
  WHERE user_id = v_user_id;

  -- 6. Record purchase
  INSERT INTO public.lead_purchases (user_id, lead_id, cost)
  VALUES (v_user_id, p_lead_id, v_cost);

  -- 7. Record transaction
  INSERT INTO public.credit_transactions (user_id, lead_id, delta, reason)
  VALUES (v_user_id, p_lead_id, -v_cost, 'spend_lead');

  RETURN v_cost;
END;
$$;

-- ============================================
-- Update handle_new_user to seed wallet with 20 credits
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_lead_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  -- Create credit wallet with 20 bonus credits
  INSERT INTO public.credit_wallets (user_id, balance)
  VALUES (NEW.id, 20);

  -- Record signup bonus transaction
  INSERT INTO public.credit_transactions (user_id, delta, reason)
  VALUES (NEW.id, 20, 'signup_bonus');

  -- Seed sample leads
  INSERT INTO public.leads (category, location_text, customer_name, customer_email, customer_phone, details, status, assigned_to)
  VALUES
    ('House Cleaning', 'London, E1', 'Sarah Johnson', 'sarah.j@email.com', '07700 900001', 'Looking for a deep clean of a 3-bedroom house. Kitchen and bathrooms need extra attention. Available weekdays.', 'new', NEW.id)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES (new_lead_id, 'customer', 'Hi! I need my house cleaned before a family visit next weekend. Is that possible?');

  INSERT INTO public.leads (category, location_text, customer_name, customer_email, details, status, assigned_to)
  VALUES
    ('Plumbing', 'Manchester, M1', 'James Wilson', 'james.w@email.com', 'Leaking tap in the kitchen. Needs urgent repair. The tap is dripping constantly.', 'new', NEW.id)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES (new_lead_id, 'customer', 'The kitchen tap has been leaking for two days now. Can you come today?');

  INSERT INTO public.leads (category, location_text, customer_name, customer_phone, details, status, assigned_to)
  VALUES
    ('Garden Maintenance', 'Birmingham, B1', 'Emma Thompson', '07700 900003', 'Regular garden maintenance needed. Lawn mowing, hedge trimming, and weeding. Monthly visits preferred.', 'new', NEW.id)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES (new_lead_id, 'system', 'New lead assigned to you.');

  INSERT INTO public.leads (category, location_text, customer_name, customer_email, customer_phone, details, status, assigned_to)
  VALUES
    ('Painting & Decorating', 'Leeds, LS1', 'David Brown', 'david.b@email.com', '07700 900004', 'Need two bedrooms painted. Walls and ceilings. Paint already purchased. Rooms are empty and ready.', 'contacted', NEW.id)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES
    (new_lead_id, 'customer', 'I have the paint ready. When can you start?'),
    (new_lead_id, 'pro', 'I can come Tuesday morning for a look. Would that work?');

  INSERT INTO public.leads (category, location_text, customer_name, details, status, assigned_to)
  VALUES
    ('Removals', 'Bristol, BS1', 'Lisa Chen', 'Moving from a 2-bed flat to a 3-bed house. About 15 minutes drive between locations. Need help with heavy furniture.', 'new', NEW.id);

  INSERT INTO public.leads (category, location_text, customer_name, customer_email, details, status, assigned_to)
  VALUES
    ('Electrical Work', 'Glasgow, G1', 'Robert Taylor', 'rob.t@email.com', 'Need additional sockets installed in home office. Two double sockets on opposite walls. House built in 2005.', 'new', NEW.id);

  INSERT INTO public.leads (category, location_text, customer_name, details, status, assigned_to, created_at)
  VALUES
    ('Dog Walking', 'Edinburgh, EH1', 'Amy Stewart', 'Looking for a regular dog walker. Two friendly labradors. Monday to Friday lunchtime walks, about 45 minutes each.', 'won', NEW.id, now() - interval '3 days')
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES
    (new_lead_id, 'customer', 'Can you walk my two labradors? They are very friendly!'),
    (new_lead_id, 'pro', 'Absolutely! I love labradors. I can do weekday lunchtimes.'),
    (new_lead_id, 'customer', 'Perfect! When can you start?'),
    (new_lead_id, 'pro', 'I can start this Monday. I will come by at noon.');

  RETURN NEW;
END;
$$;
