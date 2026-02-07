
-- =============================================
-- CUSTOM STATUSES + LEAD STATUS TRACKING
-- =============================================

-- 1. Custom statuses table (per-agent status definitions)
CREATE TABLE public.custom_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'pending',
  name text NOT NULL,
  color text NOT NULL DEFAULT '#F59E0B',
  sort_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_statuses_agent ON public.custom_statuses(agent_id, category, sort_order);

ALTER TABLE public.custom_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_statuses_select_own" ON public.custom_statuses
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "custom_statuses_insert_own" ON public.custom_statuses
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "custom_statuses_update_own" ON public.custom_statuses
  FOR UPDATE USING (agent_id = auth.uid());

CREATE POLICY "custom_statuses_delete_own" ON public.custom_statuses
  FOR DELETE USING (agent_id = auth.uid());

-- 2. Add custom_status_id to lead_agent_state
ALTER TABLE public.lead_agent_state
  ADD COLUMN IF NOT EXISTS custom_status_id uuid REFERENCES public.custom_statuses(id) ON DELETE SET NULL;

-- 3. Validation trigger for category
CREATE OR REPLACE FUNCTION public.validate_custom_status_category()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.category NOT IN ('pending', 'hired', 'archived') THEN
    RAISE EXCEPTION 'Invalid status category: %. Must be pending, hired, or archived.', NEW.category;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_custom_status_category
BEFORE INSERT OR UPDATE OF category ON public.custom_statuses
FOR EACH ROW EXECUTE FUNCTION public.validate_custom_status_category();

-- 4. Function to seed default statuses for a user
CREATE OR REPLACE FUNCTION public.seed_default_statuses(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only seed if user has no statuses yet
  IF EXISTS (SELECT 1 FROM public.custom_statuses WHERE agent_id = p_user_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.custom_statuses (agent_id, category, name, color, sort_order, is_default) VALUES
    (p_user_id, 'pending', 'New Lead', '#3B82F6', 0, true),
    (p_user_id, 'pending', 'Quoted', '#F59E0B', 1, false),
    (p_user_id, 'pending', 'In Discussion', '#8B5CF6', 2, false),
    (p_user_id, 'hired', 'Hired', '#22C55E', 0, true),
    (p_user_id, 'hired', 'Job Complete', '#10B981', 1, false),
    (p_user_id, 'archived', 'Not Interested', '#6B7280', 0, true),
    (p_user_id, 'archived', 'Lost', '#EF4444', 1, false);
END;
$$;

-- 5. Update handle_new_user to seed default statuses
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_lead_id UUID;
  default_status_id UUID;
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

  -- Seed default custom statuses
  PERFORM public.seed_default_statuses(NEW.id);

  -- Get default pending status for new leads
  SELECT id INTO default_status_id FROM public.custom_statuses
  WHERE agent_id = NEW.id AND category = 'pending' AND is_default = true LIMIT 1;

  -- Seed sample leads
  INSERT INTO public.leads (category, location_text, customer_name, customer_email, customer_phone, details, status, assigned_to, city, postal_code, credits_cost)
  VALUES ('House Cleaning', 'London, E1', 'Sarah Johnson', 'sarah.j@email.com', '07700 900001',
    'Looking for a deep clean of a 3-bedroom house. Kitchen and bathrooms need extra attention. Available weekdays.',
    'new', NEW.id, 'London', 'E1', 6)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES (new_lead_id, 'customer', 'Hi! I need my house cleaned before a family visit next weekend. Is that possible?');
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread, custom_status_id) VALUES (new_lead_id, NEW.id, true, default_status_id);

  INSERT INTO public.leads (category, location_text, customer_name, customer_email, details, status, assigned_to, city, postal_code, credits_cost)
  VALUES ('Plumbing', 'Manchester, M1', 'James Wilson', 'james.w@email.com',
    'Leaking tap in the kitchen. Needs urgent repair. The tap is dripping constantly.',
    'new', NEW.id, 'Manchester', 'M1', 5)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES (new_lead_id, 'customer', 'The kitchen tap has been leaking for two days now. Can you come today?');
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread, custom_status_id) VALUES (new_lead_id, NEW.id, true, default_status_id);

  INSERT INTO public.leads (category, location_text, customer_name, customer_phone, details, status, assigned_to, city, postal_code, credits_cost, is_urgent)
  VALUES ('Garden Maintenance', 'Birmingham, B1', 'Emma Thompson', '07700 900003',
    'Regular garden maintenance needed. Lawn mowing, hedge trimming, and weeding. Monthly visits preferred.',
    'new', NEW.id, 'Birmingham', 'B1', 7, false)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES (new_lead_id, 'system', 'New lead assigned to you.');
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread, custom_status_id) VALUES (new_lead_id, NEW.id, true, default_status_id);

  INSERT INTO public.leads (category, location_text, customer_name, customer_email, customer_phone, details, status, assigned_to, city, postal_code, credits_cost)
  VALUES ('Painting & Decorating', 'Leeds, LS1', 'David Brown', 'david.b@email.com', '07700 900004',
    'Need two bedrooms painted. Walls and ceilings. Paint already purchased. Rooms are empty and ready.',
    'contacted', NEW.id, 'Leeds', 'LS1', 8)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_messages (lead_id, sender_type, message)
  VALUES
    (new_lead_id, 'customer', 'I have the paint ready. When can you start?'),
    (new_lead_id, 'pro', 'I can come Tuesday morning for a look. Would that work?');
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread, contacted, contacted_at, custom_status_id)
  VALUES (new_lead_id, NEW.id, false, true, now(), default_status_id);

  INSERT INTO public.leads (category, location_text, customer_name, details, status, assigned_to, city, postal_code, credits_cost)
  VALUES ('Removals', 'Bristol, BS1', 'Lisa Chen',
    'Moving from a 2-bed flat to a 3-bed house. About 15 minutes drive between locations. Need help with heavy furniture.',
    'new', NEW.id, 'Bristol', 'BS1', 9)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread, custom_status_id) VALUES (new_lead_id, NEW.id, true, default_status_id);

  INSERT INTO public.leads (category, location_text, customer_name, customer_email, details, status, assigned_to, city, postal_code, credits_cost)
  VALUES ('Electrical Work', 'Glasgow, G1', 'Robert Taylor', 'rob.t@email.com',
    'Need additional sockets installed in home office. Two double sockets on opposite walls. House built in 2005.',
    'new', NEW.id, 'Glasgow', 'G1', 6)
  RETURNING id INTO new_lead_id;
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread, custom_status_id) VALUES (new_lead_id, NEW.id, true, default_status_id);

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
  INSERT INTO public.lead_agent_state (lead_id, agent_id, is_unread, contacted, contacted_at, custom_status_id)
  VALUES (new_lead_id, NEW.id, false, true, now() - interval '3 days', default_status_id);

  RETURN NEW;
END;
$$;

-- 6. RPC: set custom status on a lead
CREATE OR REPLACE FUNCTION public.set_lead_custom_status(
  p_lead_id uuid,
  p_status_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the status belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM public.custom_statuses
    WHERE id = p_status_id AND agent_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Status not found or not yours';
  END IF;

  -- Upsert agent state with the new status
  INSERT INTO public.lead_agent_state (lead_id, agent_id, custom_status_id, updated_at)
  VALUES (p_lead_id, auth.uid(), p_status_id, now())
  ON CONFLICT (lead_id, agent_id)
  DO UPDATE SET custom_status_id = p_status_id, updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.set_lead_custom_status(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.set_lead_custom_status(uuid, uuid) TO authenticated;

-- 7. Seed default statuses for existing users who don't have any
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.seed_default_statuses(r.id);
  END LOOP;
END;
$$;
