
-- Insert parent categories
INSERT INTO service_categories (name, slug, icon, hero_image, parent_slug, is_active, sort_order, base_credit_cost, questions)
VALUES
  ('Event and Travel Services', 'event-and-travel-services', '🎉', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop', NULL, true, 1, 5, '[]'::jsonb),
  ('Financial and Tax', 'financial-and-tax', '💰', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop', NULL, true, 2, 5, '[]'::jsonb),
  ('Financial Planning', 'financial-planning', '📈', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop', NULL, true, 3, 5, '[]'::jsonb),
  ('Legal Services', 'legal-services', '⚖️', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop', NULL, true, 4, 5, '[]'::jsonb),
  ('Business', 'business', '🏢', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop', NULL, true, 0, 5, '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET parent_slug = EXCLUDED.parent_slug, hero_image = EXCLUDED.hero_image, sort_order = EXCLUDED.sort_order;

-- Insert child categories for Event and Travel Services
INSERT INTO service_categories (name, slug, icon, hero_image, parent_slug, is_active, sort_order, base_credit_cost, questions)
VALUES
  ('Security Guard Services', 'security-guard-services', '🛡️', 'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=800&h=400&fit=crop', 'event-and-travel-services', true, 10, 6, '[]'::jsonb),
  ('Corporate Coach and Minibus Hire', 'corporate-coach-minibus-hire', '🚌', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop', 'event-and-travel-services', true, 11, 6, '[]'::jsonb),
  ('Corporate Event Photography', 'corporate-event-photography', '📷', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop', 'event-and-travel-services', true, 12, 6, '[]'::jsonb),
  ('Commercial Catering', 'commercial-catering', '🍽️', 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=400&fit=crop', 'event-and-travel-services', true, 13, 6, '[]'::jsonb),
  ('Commercial Event Planning', 'commercial-event-planning', '📋', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop', 'event-and-travel-services', true, 14, 6, '[]'::jsonb),
  ('Corporate Event Entertainment', 'corporate-event-entertainment', '🎭', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop', 'event-and-travel-services', true, 15, 6, '[]'::jsonb),
  ('Corporate Event Venue Hire', 'corporate-event-venue-hire', '🏛️', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=400&fit=crop', 'event-and-travel-services', true, 16, 6, '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET parent_slug = EXCLUDED.parent_slug, hero_image = EXCLUDED.hero_image, sort_order = EXCLUDED.sort_order;

-- Insert child categories for Financial and Tax
INSERT INTO service_categories (name, slug, icon, hero_image, parent_slug, is_active, sort_order, base_credit_cost, questions)
VALUES
  ('Tax Lawyer', 'tax-lawyer', '⚖️', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop', 'financial-and-tax', true, 20, 8, '[]'::jsonb),
  ('Pensions and Incentives', 'pensions-and-incentives', '🏦', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=400&fit=crop', 'financial-and-tax', true, 21, 7, '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET parent_slug = EXCLUDED.parent_slug, hero_image = EXCLUDED.hero_image, sort_order = EXCLUDED.sort_order;

-- Insert child categories for Financial Planning
INSERT INTO service_categories (name, slug, icon, hero_image, parent_slug, is_active, sort_order, base_credit_cost, questions)
VALUES
  ('Business Financial Planning', 'business-financial-planning', '📊', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop', 'financial-planning', true, 30, 7, '[]'::jsonb),
  ('Budgeting and Forecasting Services', 'budgeting-forecasting-services', '📉', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop', 'financial-planning', true, 31, 7, '[]'::jsonb),
  ('Business Modelling Services', 'business-modelling-services', '🧮', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop', 'financial-planning', true, 32, 7, '[]'::jsonb),
  ('Valuations', 'valuations', '💎', 'https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=800&h=400&fit=crop', 'financial-planning', true, 33, 7, '[]'::jsonb),
  ('Venture Capital', 'venture-capital', '🚀', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=400&fit=crop', 'financial-planning', true, 34, 8, '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET parent_slug = EXCLUDED.parent_slug, hero_image = EXCLUDED.hero_image, sort_order = EXCLUDED.sort_order;

-- Insert child categories for Legal Services
INSERT INTO service_categories (name, slug, icon, hero_image, parent_slug, is_active, sort_order, base_credit_cost, questions)
VALUES
  ('Employment Lawyer', 'employment-lawyer', '👔', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop', 'legal-services', true, 40, 8, '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET parent_slug = EXCLUDED.parent_slug, hero_image = EXCLUDED.hero_image, sort_order = EXCLUDED.sort_order;

-- Also add related categories visible in screenshots
INSERT INTO service_categories (name, slug, icon, hero_image, parent_slug, is_active, sort_order, base_credit_cost, questions)
VALUES
  ('Wedding Catering', 'wedding-catering', '💒', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=400&fit=crop', NULL, true, 50, 6, '[]'::jsonb),
  ('Private Chef Services', 'private-chef-services', '👨‍🍳', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=400&fit=crop', NULL, true, 51, 6, '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET hero_image = EXCLUDED.hero_image;
