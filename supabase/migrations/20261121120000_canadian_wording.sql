-- Canadian wording for service names and wizard answers (the seed data used British terms),
-- one broken category photo, and the double hyphen in region names. Addresses (slugs) do not change.

UPDATE public.service_categories SET name = 'Moving' WHERE name = 'Removals';
UPDATE public.lead_pricing_rules SET category = 'Moving' WHERE category = 'Removals';
UPDATE public.leads SET category = 'Moving' WHERE category = 'Removals';
UPDATE public.service_categories SET name = 'Landscaping and Yard Care' WHERE name = 'Garden Maintenance';
UPDATE public.lead_pricing_rules SET category = 'Landscaping and Yard Care' WHERE category = 'Garden Maintenance';
UPDATE public.leads SET category = 'Landscaping and Yard Care' WHERE category = 'Garden Maintenance';
UPDATE public.service_categories SET name = 'Painting' WHERE name = 'Painting & Decorating';
UPDATE public.lead_pricing_rules SET category = 'Painting' WHERE category = 'Painting & Decorating';
UPDATE public.leads SET category = 'Painting' WHERE category = 'Painting & Decorating';
UPDATE public.service_categories SET name = 'Corporate Bus and Minibus Rental' WHERE name = 'Corporate Coach and Minibus Hire';
UPDATE public.lead_pricing_rules SET category = 'Corporate Bus and Minibus Rental' WHERE category = 'Corporate Coach and Minibus Hire';
UPDATE public.leads SET category = 'Corporate Bus and Minibus Rental' WHERE category = 'Corporate Coach and Minibus Hire';
UPDATE public.service_categories SET name = 'Corporate Event Venue Rental' WHERE name = 'Corporate Event Venue Hire';
UPDATE public.lead_pricing_rules SET category = 'Corporate Event Venue Rental' WHERE category = 'Corporate Event Venue Hire';
UPDATE public.leads SET category = 'Corporate Event Venue Rental' WHERE category = 'Corporate Event Venue Hire';
UPDATE public.service_categories SET name = 'Ad Design' WHERE name = 'Advert Design';
UPDATE public.lead_pricing_rules SET category = 'Ad Design' WHERE category = 'Advert Design';
UPDATE public.leads SET category = 'Ad Design' WHERE category = 'Advert Design';
UPDATE public.service_categories SET name = 'Tagline and Slogan Writer' WHERE name = 'Strapline and Slogan Writer';
UPDATE public.lead_pricing_rules SET category = 'Tagline and Slogan Writer' WHERE category = 'Strapline and Slogan Writer';
UPDATE public.leads SET category = 'Tagline and Slogan Writer' WHERE category = 'Strapline and Slogan Writer';

UPDATE public.service_categories SET questions = replace(questions::text, '"Leaking tap"', '"Leaking faucet"')::jsonb WHERE questions::text LIKE '%' || '"Leaking tap"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Boiler issue"', '"Water heater issue"')::jsonb WHERE questions::text LIKE '%' || '"Boiler issue"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"End of tenancy"', '"Move-out cleaning"')::jsonb WHERE questions::text LIKE '%' || '"End of tenancy"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Full garden tidy"', '"Full yard clean-up"')::jsonb WHERE questions::text LIKE '%' || '"Full garden tidy"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"How big is your garden?"', '"How big is your yard?"')::jsonb WHERE questions::text LIKE '%' || '"How big is your garden?"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"What garden work do you need?"', '"What yard work do you need?"')::jsonb WHERE questions::text LIKE '%' || '"What garden work do you need?"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Tree surgery"', '"Tree care"')::jsonb WHERE questions::text LIKE '%' || '"Tree surgery"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Fuse box"', '"Electrical panel"')::jsonb WHERE questions::text LIKE '%' || '"Fuse box"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Light fitting"', '"Light fixture installation"')::jsonb WHERE questions::text LIKE '%' || '"Light fitting"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Socket installation"', '"Outlet installation"')::jsonb WHERE questions::text LIKE '%' || '"Socket installation"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Full redecoration"', '"Full repaint"')::jsonb WHERE questions::text LIKE '%' || '"Full redecoration"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Same area (under 10 miles)"', '"Same area (under 15 km)"')::jsonb WHERE questions::text LIKE '%' || '"Same area (under 10 miles)"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Flyers/leaflets"', '"Flyers"')::jsonb WHERE questions::text LIKE '%' || '"Flyers/leaflets"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Headed Paper"', '"Letterhead"')::jsonb WHERE questions::text LIKE '%' || '"Headed Paper"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Advert production"', '"Ad production"')::jsonb WHERE questions::text LIKE '%' || '"Advert production"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Advertising strapline"', '"Advertising tagline"')::jsonb WHERE questions::text LIKE '%' || '"Advertising strapline"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"One-off"', '"One-time"')::jsonb WHERE questions::text LIKE '%' || '"One-off"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"130 GSM (Standard e.g. Takeaway menu)"', '"130 GSM (Standard e.g. Takeout menu)"')::jsonb WHERE questions::text LIKE '%' || '"130 GSM (Standard e.g. Takeaway menu)"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Please describe your leaflet/flyer design requirement"', '"Please describe your flyer design requirement"')::jsonb WHERE questions::text LIKE '%' || '"Please describe your leaflet/flyer design requirement"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Less than 1 months"', '"Less than 1 month"')::jsonb WHERE questions::text LIKE '%' || '"Less than 1 months"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Up to 1 months"', '"Up to 1 month"')::jsonb WHERE questions::text LIKE '%' || '"Up to 1 months"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Removals"', '"Moving"')::jsonb WHERE questions::text LIKE '%' || '"Removals"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Garden Maintenance"', '"Landscaping and Yard Care"')::jsonb WHERE questions::text LIKE '%' || '"Garden Maintenance"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Painting & Decorating"', '"Painting"')::jsonb WHERE questions::text LIKE '%' || '"Painting & Decorating"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Corporate Coach and Minibus Hire"', '"Corporate Bus and Minibus Rental"')::jsonb WHERE questions::text LIKE '%' || '"Corporate Coach and Minibus Hire"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Corporate Event Venue Hire"', '"Corporate Event Venue Rental"')::jsonb WHERE questions::text LIKE '%' || '"Corporate Event Venue Hire"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Advert Design"', '"Ad Design"')::jsonb WHERE questions::text LIKE '%' || '"Advert Design"' || '%';
UPDATE public.service_categories SET questions = replace(questions::text, '"Strapline and Slogan Writer"', '"Tagline and Slogan Writer"')::jsonb WHERE questions::text LIKE '%' || '"Strapline and Slogan Writer"' || '%';

UPDATE public.service_categories SET hero_image = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop' WHERE hero_image LIKE '%photo-1504711434969-e33886168d6c%';

UPDATE public.business_listings SET region = replace(region, '--', '–') WHERE region LIKE '%--%';
