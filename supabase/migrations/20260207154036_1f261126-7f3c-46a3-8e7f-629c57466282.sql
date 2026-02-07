
-- =============================================
-- MARKETPLACE MODEL MIGRATION
-- Bark-style multi-agent lead system
-- =============================================

-- 1. Add new columns to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS service_subtype text,
  ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS credits_cost integer NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS has_additional_details boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz NOT NULL DEFAULT now();

-- Make assigned_to nullable (multi-agent: leads aren't "owned")
ALTER TABLE public.leads ALTER COLUMN assigned_to DROP NOT NULL;

-- Populate computed columns from existing data
UPDATE public.leads SET
  has_additional_details = (details IS NOT NULL AND length(trim(details)) > 0),
  submitted_at = created_at;

-- 2. Add agent_id to lead_messages
ALTER TABLE public.lead_messages
  ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Create lead_agent_state table
CREATE TABLE public.lead_agent_state (
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_unread boolean NOT NULL DEFAULT true,
  is_archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  contacted boolean NOT NULL DEFAULT false,
  contacted_at timestamptz,
  first_to_respond boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, agent_id)
);

CREATE INDEX idx_state_agent_unread ON public.lead_agent_state(agent_id, is_unread);
CREATE INDEX idx_state_agent_archived ON public.lead_agent_state(agent_id, is_archived);
CREATE INDEX idx_state_agent_contacted ON public.lead_agent_state(agent_id, contacted);

ALTER TABLE public.lead_agent_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "state_read_own" ON public.lead_agent_state
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "state_insert_own" ON public.lead_agent_state
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "state_update_own" ON public.lead_agent_state
  FOR UPDATE USING (agent_id = auth.uid()) WITH CHECK (agent_id = auth.uid());

-- 4. Update leads RLS: all authenticated can read
DROP POLICY IF EXISTS "Users can view their assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads assigned to them" ON public.leads;

CREATE POLICY "leads_read_authenticated" ON public.leads
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "leads_insert_authenticated" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "leads_update_authenticated" ON public.leads
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 5. Update lead_messages RLS for multi-agent
DROP POLICY IF EXISTS "Users can view messages for their leads" ON public.lead_messages;
DROP POLICY IF EXISTS "Users can insert messages for their leads" ON public.lead_messages;

CREATE POLICY "msgs_read_if_has_state" ON public.lead_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lead_agent_state s
      WHERE s.lead_id = lead_messages.lead_id AND s.agent_id = auth.uid()
    )
  );

CREATE POLICY "msgs_insert_if_contacted" ON public.lead_messages
  FOR INSERT WITH CHECK (
    sender_type = 'pro'
    AND EXISTS (
      SELECT 1 FROM public.lead_agent_state s
      WHERE s.lead_id = lead_messages.lead_id
        AND s.agent_id = auth.uid()
        AND s.contacted = true
    )
  );

-- 6. Update responses RLS
DROP POLICY IF EXISTS "Users can insert responses for their leads" ON public.responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON public.responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON public.responses;

CREATE POLICY "responses_read_own" ON public.responses
  FOR SELECT USING (pro_id = auth.uid());

CREATE POLICY "responses_insert_contacted" ON public.responses
  FOR INSERT WITH CHECK (
    pro_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lead_agent_state s
      WHERE s.lead_id = responses.lead_id
        AND s.agent_id = auth.uid()
        AND s.contacted = true
    )
  );

CREATE POLICY "responses_update_own" ON public.responses
  FOR UPDATE USING (pro_id = auth.uid());

-- 7. Update lead_purchases RLS
DROP POLICY IF EXISTS "Users can insert purchases for their leads" ON public.lead_purchases;

CREATE POLICY "purchases_insert_own" ON public.lead_purchases
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8. Update reminders RLS
DROP POLICY IF EXISTS "Users can create reminders for their leads" ON public.reminders;

CREATE POLICY "reminders_insert_own" ON public.reminders
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lead_agent_state s
      WHERE s.lead_id = reminders.lead_id AND s.agent_id = auth.uid()
    )
  );

-- 9. Trigger for has_additional_details
CREATE OR REPLACE FUNCTION public.leads_set_has_details()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.has_additional_details := (NEW.details IS NOT NULL AND length(trim(NEW.details)) > 0);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_leads_has_details
BEFORE INSERT OR UPDATE OF details ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.leads_set_has_details();

-- 10. contact_lead RPC (uses credit_wallets)
CREATE OR REPLACE FUNCTION public.contact_lead(p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_agent uuid := auth.uid();
  v_cost int;
  v_balance int;
  v_already boolean;
  v_lead record;
  v_pricing_cost int;
BEGIN
  IF v_agent IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  -- Get cost: pricing rules > lead credits_cost > fallback 5
  SELECT base_cost INTO v_pricing_cost
  FROM public.lead_pricing_rules
  WHERE category = v_lead.category;

  v_cost := COALESCE(v_pricing_cost, v_lead.credits_cost, 5);

  -- Ensure state row exists
  INSERT INTO public.lead_agent_state(lead_id, agent_id)
  VALUES (p_lead_id, v_agent)
  ON CONFLICT (lead_id, agent_id) DO NOTHING;

  SELECT contacted INTO v_already
  FROM public.lead_agent_state
  WHERE lead_id = p_lead_id AND agent_id = v_agent;

  IF v_already THEN
    RETURN jsonb_build_object(
      'already_contacted', true,
      'customer_name', v_lead.customer_name,
      'customer_email', v_lead.customer_email,
      'customer_phone', v_lead.customer_phone
    );
  END IF;

  -- Lock wallet row
  SELECT balance INTO v_balance
  FROM public.credit_wallets
  WHERE user_id = v_agent
  FOR UPDATE;

  IF NOT FOUND OR v_balance < v_cost THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  -- Deduct credits
  UPDATE public.credit_wallets
  SET balance = balance - v_cost, updated_at = now()
  WHERE user_id = v_agent;

  -- Mark contacted
  UPDATE public.lead_agent_state
  SET contacted = true,
      contacted_at = now(),
      is_unread = false,
      updated_at = now()
  WHERE lead_id = p_lead_id AND agent_id = v_agent;

  -- Record transaction
  INSERT INTO public.credit_transactions(user_id, delta, reason, lead_id)
  VALUES (v_agent, -v_cost, 'spend_lead', p_lead_id);

  -- Check if first to respond
  IF NOT EXISTS (
    SELECT 1 FROM public.lead_agent_state
    WHERE lead_id = p_lead_id AND contacted = true AND agent_id != v_agent
  ) THEN
    UPDATE public.lead_agent_state
    SET first_to_respond = true
    WHERE lead_id = p_lead_id AND agent_id = v_agent;
  END IF;

  RETURN jsonb_build_object(
    'already_contacted', false,
    'customer_name', v_lead.customer_name,
    'customer_email', v_lead.customer_email,
    'customer_phone', v_lead.customer_phone,
    'credits_spent', v_cost
  );
END;
$$;

REVOKE ALL ON FUNCTION public.contact_lead(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.contact_lead(uuid) TO authenticated;

-- 11. Indexes on leads for filtering
CREATE INDEX IF NOT EXISTS idx_leads_urgent ON public.leads(is_urgent);
CREATE INDEX IF NOT EXISTS idx_leads_has_details ON public.leads(has_additional_details);
CREATE INDEX IF NOT EXISTS idx_leads_credits_cost ON public.leads(credits_cost);
CREATE INDEX IF NOT EXISTS idx_leads_submitted ON public.leads(submitted_at DESC);

-- 12. Migrate existing data: create lead_agent_state from assigned_to + purchases
INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread, is_archived, archived_at, contacted, contacted_at)
SELECT
  l.id,
  l.assigned_to,
  CASE WHEN l.status = 'new' THEN true ELSE false END,
  l.archived,
  l.archived_at,
  CASE WHEN EXISTS (
    SELECT 1 FROM public.lead_purchases lp
    WHERE lp.lead_id = l.id AND lp.user_id = l.assigned_to
  ) THEN true ELSE false END,
  (SELECT lp.created_at FROM public.lead_purchases lp
   WHERE lp.lead_id = l.id AND lp.user_id = l.assigned_to LIMIT 1)
FROM public.leads l
WHERE l.assigned_to IS NOT NULL
ON CONFLICT (lead_id, agent_id) DO NOTHING;

-- 13. Enable realtime on lead_agent_state
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_agent_state;

-- 14. Update handle_new_user to create lead_agent_state entries
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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

  -- Seed sample leads with lead_agent_state
  INSERT INTO public.leads (category, location_text, customer_name, customer_email, customer_phone, details, status, assigned_to, city, postal_code, credits_cost)
  VALUES ('House Cleaning', 'London, E1', 'Sarah Johnson', 'sarah.j@email.com', '07700 900001',
    'Looking for a deep clean of a 3-bedroom house. Kitchen and bathrooms need extra attention. Available weekdays.',
    'new', NEW.id, 'London', 'E1', 6)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES (new_lead_id, 'customer', 'Hi! I need my house cleaned before a family visit next weekend. Is that possible?');
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread) VALUES (new_lead_id, NEW.id, true);

  INSERT INTO public.leads (category, location_text, customer_name, customer_email, details, status, assigned_to, city, postal_code, credits_cost)
  VALUES ('Plumbing', 'Manchester, M1', 'James Wilson', 'james.w@email.com',
    'Leaking tap in the kitchen. Needs urgent repair. The tap is dripping constantly.',
    'new', NEW.id, 'Manchester', 'M1', 5)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES (new_lead_id, 'customer', 'The kitchen tap has been leaking for two days now. Can you come today?');
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread) VALUES (new_lead_id, NEW.id, true);

  INSERT INTO public.leads (category, location_text, customer_name, customer_phone, details, status, assigned_to, city, postal_code, credits_cost, is_urgent)
  VALUES ('Garden Maintenance', 'Birmingham, B1', 'Emma Thompson', '07700 900003',
    'Regular garden maintenance needed. Lawn mowing, hedge trimming, and weeding. Monthly visits preferred.',
    'new', NEW.id, 'Birmingham', 'B1', 7, false)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES (new_lead_id, 'system', 'New lead assigned to you.');
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread) VALUES (new_lead_id, NEW.id, true);

  INSERT INTO public.leads (category, location_text, customer_name, customer_email, customer_phone, details, status, assigned_to, city, postal_code, credits_cost)
  VALUES ('Painting & Decorating', 'Leeds, LS1', 'David Brown', 'david.b@email.com', '07700 900004',
    'Need two bedrooms painted. Walls and ceilings. Paint already purchased. Rooms are empty and ready.',
    'contacted', NEW.id, 'Leeds', 'LS1', 8)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES
    (new_lead_id, 'customer', 'I have the paint ready. When can you start?'),
    (new_lead_id, 'pro', 'I can come Tuesday morning for a look. Would that work?');
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread, contacted, contacted_at)
  VALUES (new_lead_id, NEW.id, false, true, now());

  INSERT INTO public.leads (category, location_text, customer_name, details, status, assigned_to, city, postal_code, credits_cost)
  VALUES ('Removals', 'Bristol, BS1', 'Lisa Chen',
    'Moving from a 2-bed flat to a 3-bed house. About 15 minutes drive between locations. Need help with heavy furniture.',
    'new', NEW.id, 'Bristol', 'BS1', 9)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread) VALUES (new_lead_id, NEW.id, true);

  INSERT INTO public.leads (category, location_text, customer_name, customer_email, details, status, assigned_to, city, postal_code, credits_cost)
  VALUES ('Electrical Work', 'Glasgow, G1', 'Robert Taylor', 'rob.t@email.com',
    'Need additional sockets installed in home office. Two double sockets on opposite walls. House built in 2005.',
    'new', NEW.id, 'Glasgow', 'G1', 6)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread) VALUES (new_lead_id, NEW.id, true);

  INSERT INTO public.leads (category, location_text, customer_name, details, status, assigned_to, created_at, city, postal_code, credits_cost)
  VALUES ('Dog Walking', 'Edinburgh, EH1', 'Amy Stewart',
    'Looking for a regular dog walker. Two friendly labradors. Monday to Friday lunchtime walks, about 45 minutes each.',
    'won', NEW.id, now() - interval '3 days', 'Edinburgh', 'EH1', 5)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES
    (new_lead_id, 'customer', 'Can you walk my two labradors? They are very friendly!'),
    (new_lead_id, 'pro', 'Absolutely! I love labradors. I can do weekday lunchtimes.'),
    (new_lead_id, 'customer', 'Perfect! When can you start?'),
    (new_lead_id, 'pro', 'I can start this Monday. I will come by at noon.');
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread, contacted, contacted_at)
  VALUES (new_lead_id, NEW.id, false, true, now() - interval '3 days');

  RETURN NEW;
END;
$$;
