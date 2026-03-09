
-- Add parent categories
INSERT INTO service_categories (name, slug, icon, hero_image, parent_slug, is_active, sort_order, base_credit_cost, questions)
VALUES
  ('Advertising and Media Buying', 'advertising-and-media-buying', '📺', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop', NULL, true, 5, 5, '[]'::jsonb),
  ('Design and Media', 'design-and-media', '🎨', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=400&fit=crop', NULL, true, 6, 5, '[]'::jsonb),
  ('Branding', 'branding', '✨', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=400&fit=crop', 'design-and-media', true, 60, 5, '[]'::jsonb),
  ('Financial and Accounting', 'financial-and-accounting', '🧾', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop', NULL, true, 7, 5, '[]'::jsonb),
  ('General Accounting', 'general-accounting', '📒', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop', 'financial-and-accounting', true, 70, 5, '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET parent_slug = EXCLUDED.parent_slug, hero_image = EXCLUDED.hero_image, sort_order = EXCLUDED.sort_order, name = EXCLUDED.name;

-- Children of Advertising and Media Buying
INSERT INTO service_categories (name, slug, icon, hero_image, parent_slug, is_active, sort_order, base_credit_cost, questions)
VALUES
  ('Print Media Purchasing', 'print-media-purchasing', '🖨️', 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=800&h=400&fit=crop', 'advertising-and-media-buying', true, 61, 6, '[]'::jsonb),
  ('Radio Airtime Purchasing', 'radio-airtime-purchasing', '📻', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=400&fit=crop', 'advertising-and-media-buying', true, 62, 6, '[]'::jsonb),
  ('Broadlines and Slogans', 'broadlines-and-slogans', '💬', 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&h=400&fit=crop', 'advertising-and-media-buying', true, 63, 6, '[]'::jsonb),
  ('TV Media Buying', 'tv-media-buying', '📺', 'https://images.unsplash.com/photo-1593078166039-c9878df5c520?w=800&h=400&fit=crop', 'advertising-and-media-buying', true, 64, 6, '[]'::jsonb),
  ('Advertising Copywriting', 'advertising-copywriting', '✍️', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=400&fit=crop', 'advertising-and-media-buying', true, 65, 6, '[]'::jsonb),
  ('Online Media Buying', 'online-media-buying', '🌐', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop', 'advertising-and-media-buying', true, 66, 6, '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET parent_slug = EXCLUDED.parent_slug, hero_image = EXCLUDED.hero_image, sort_order = EXCLUDED.sort_order, name = EXCLUDED.name;

-- Update existing Advertising to be child of Advertising and Media Buying
UPDATE service_categories SET parent_slug = 'advertising-and-media-buying', sort_order = 60 WHERE slug = 'advertising' AND parent_slug IS NULL;

-- Children of Branding (under Design and Media)
INSERT INTO service_categories (name, slug, icon, hero_image, parent_slug, is_active, sort_order, base_credit_cost, questions)
VALUES
  ('Email Template Design', 'email-template-design', '📧', 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&h=400&fit=crop', 'branding', true, 67, 6, '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET parent_slug = EXCLUDED.parent_slug, hero_image = EXCLUDED.hero_image, sort_order = EXCLUDED.sort_order, name = EXCLUDED.name;

-- Update existing categories to be children of Branding
UPDATE service_categories SET parent_slug = 'branding', sort_order = 68 WHERE slug = 'logo-design' AND parent_slug IS NULL;
UPDATE service_categories SET parent_slug = 'branding', sort_order = 69 WHERE slug = 'flyer-leaflet-design' AND parent_slug IS NULL;
UPDATE service_categories SET parent_slug = 'branding', sort_order = 70 WHERE slug = 'business-stationery-design' AND parent_slug IS NULL;

-- Children of General Accounting
INSERT INTO service_categories (name, slug, icon, hero_image, parent_slug, is_active, sort_order, base_credit_cost, questions)
VALUES
  ('Business Accounting Services', 'business-accounting-services', '📊', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop', 'general-accounting', true, 71, 6, '[]'::jsonb),
  ('Invoice Finance', 'invoice-finance', '🧾', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop', 'general-accounting', true, 72, 6, '[]'::jsonb),
  ('Accounting Software', 'accounting-software', '💻', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop', 'general-accounting', true, 73, 6, '[]'::jsonb),
  ('Card Processing', 'card-processing', '💳', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop', 'general-accounting', true, 74, 6, '[]'::jsonb),
  ('POS', 'pos', '🖥️', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop', 'general-accounting', true, 75, 6, '[]'::jsonb),
  ('Small Business Loans', 'small-business-loans', '🏦', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=400&fit=crop', 'general-accounting', true, 76, 6, '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET parent_slug = EXCLUDED.parent_slug, hero_image = EXCLUDED.hero_image, sort_order = EXCLUDED.sort_order, name = EXCLUDED.name;

-- Update existing Accounting and Bookkeeping to be children of General Accounting
UPDATE service_categories SET parent_slug = 'general-accounting', sort_order = 77 WHERE slug = 'accounting' AND parent_slug IS NULL;
UPDATE service_categories SET parent_slug = 'general-accounting', sort_order = 78 WHERE slug = 'bookkeeping' AND parent_slug IS NULL;

-- Also set Financial Planning and Financial and Tax under Financial and Accounting as siblings
UPDATE service_categories SET parent_slug = 'financial-and-accounting' WHERE slug = 'financial-and-tax' AND parent_slug IS NULL;
UPDATE service_categories SET parent_slug = 'financial-and-accounting' WHERE slug = 'financial-planning' AND parent_slug IS NULL;
UPDATE service_categories SET parent_slug = 'financial-and-accounting' WHERE slug = 'general-accounting';
