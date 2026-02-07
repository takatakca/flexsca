
-- Update handle_new_user to seed sample leads for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_lead_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
