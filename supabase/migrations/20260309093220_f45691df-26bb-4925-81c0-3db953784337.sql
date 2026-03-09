
-- Add "Advertising Agency" as a child of advertising-and-media-buying  
INSERT INTO service_categories (name, slug, parent_slug, hero_image, icon, sort_order, questions)
VALUES (
  'Advertising Agency',
  'advertising-agency',
  'advertising-and-media-buying',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
  '📢',
  8,
  '[
    {"id":"stationery_type","label":"What kind of stationery would you like?","type":"checkbox","options":["Booklets","Business Cards","Envelopes","Headed Paper","Pencils","Pens","I''m not sure"],"required":true,"hasOther":true},
    {"id":"paper_weight","label":"Desired Paper Weight","type":"radio","options":["350-400 GSM (Business Cards)","300 GSM","250 GSM (Lightweight Card)","200 GSM (Premium Paper)","170 GSM","130 GSM (Standard e.g. Takeaway menu)","100 GSM","Not Applicable","Not sure"],"required":true,"hasOther":true},
    {"id":"pages","label":"How many pages does each copy have?","type":"radio","options":["250+","100-250","50-100","25-50","10-25","5-10","Less than 5","Not Applicable"],"required":true,"hasOther":true},
    {"id":"copies","label":"How many copies will you need?","type":"radio","options":["1000+","750-1000","500-750","250-500","100-250","50-100","Less than 50","I''m not sure"],"required":true,"hasOther":true},
    {"id":"support_type","label":"Which of the following do you need support with?","type":"checkbox","options":["Advert Design","Advert production","Copywriting","Creative Production Services","Measuring Performance","Media Buying","None of the above"],"required":true,"hasOther":true},
    {"id":"budget","label":"What is your budget for this campaign?","type":"radio","options":["up to C$500","C$500-1k","C$1k - C$5k","C$5k-C$10k","Over C$10k","I''m not sure yet","I''m looking for guidance from the Pro"],"required":true,"hasOther":true},
    {"id":"timeline","label":"When are you looking to start this campaign?","type":"radio","options":["ASAP","In the next month","In the next 2-3 months","In the next 3-6 months"],"required":true,"hasOther":true}
  ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET questions = EXCLUDED.questions, name = EXCLUDED.name;

-- Update "Advertising and Media Buying" parent with exact questions from screenshots
UPDATE service_categories SET questions = '[
  {"id":"ad_type","label":"Which type(s) of advertising are you interested in?","type":"checkbox","options":["Broadcast (TV, radio)","I''m not sure","Online (PPC, Social media)","Outdoor (billboards, kiosks)","Print (newspaper, magazines, flyers)","Public service","I''m looking for guidance from the Pro"],"required":true,"hasOther":true},
  {"id":"support_type","label":"Which of the following do you need support with?","type":"checkbox","options":["Advert Design","Advert production","Copywriting","Creative Production Services","Measuring Performance","Media Buying","None of the above"],"required":true,"hasOther":true},
  {"id":"budget","label":"What is your budget for this campaign?","type":"radio","options":["up to C$500","C$500-1k","C$1k - C$5k","C$5k-C$10k","Over C$10k","I''m not sure yet","I''m looking for guidance from the Pro"],"required":true,"hasOther":true},
  {"id":"timeline","label":"When are you looking to start this campaign?","type":"radio","options":["ASAP","In the next month","In the next 2-3 months","In the next 3-6 months"],"required":true,"hasOther":true}
]'::jsonb WHERE slug = 'advertising-and-media-buying';

-- Update "Advertising" leaf with exact questions
UPDATE service_categories SET questions = '[
  {"id":"ad_type","label":"Which type(s) of advertising are you interested in?","type":"checkbox","options":["Broadcast (TV, radio)","I''m not sure","Online (PPC, Social media)","Outdoor (billboards, kiosks)","Print (newspaper, magazines, flyers)","Public service","I''m looking for guidance from the Pro"],"required":true,"hasOther":true},
  {"id":"support_type","label":"Which of the following do you need support with?","type":"checkbox","options":["Advert Design","Advert production","Copywriting","Creative Production Services","Measuring Performance","Media Buying","None of the above"],"required":true,"hasOther":true},
  {"id":"budget","label":"What is your budget for this campaign?","type":"radio","options":["up to C$500","C$500-1k","C$1k - C$5k","C$5k-C$10k","Over C$10k","I''m not sure yet","I''m looking for guidance from the Pro"],"required":true,"hasOther":true},
  {"id":"timeline","label":"When are you looking to start this campaign?","type":"radio","options":["ASAP","In the next month","In the next 2-3 months","In the next 3-6 months"],"required":true,"hasOther":true}
]'::jsonb WHERE slug = 'advertising';

-- Update "Business Stationery Design" with exact questions from screenshots
UPDATE service_categories SET questions = '[
  {"id":"stationery_type","label":"What kind of stationery would you like?","type":"checkbox","options":["Booklets","Business Cards","Envelopes","Headed Paper","Pencils","Pens","I''m not sure"],"required":true,"hasOther":true},
  {"id":"paper_weight","label":"Desired Paper Weight","type":"radio","options":["350-400 GSM (Business Cards)","300 GSM","250 GSM (Lightweight Card)","200 GSM (Premium Paper)","170 GSM","130 GSM (Standard e.g. Takeaway menu)","100 GSM","Not Applicable","Not sure"],"required":true,"hasOther":true},
  {"id":"pages","label":"How many pages does each copy have?","type":"radio","options":["250+","100-250","50-100","25-50","10-25","5-10","Less than 5","Not Applicable"],"required":true,"hasOther":true},
  {"id":"copies","label":"How many copies will you need?","type":"radio","options":["1000+","750-1000","500-750","250-500","100-250","50-100","Less than 50","I''m not sure"],"required":true,"hasOther":true},
  {"id":"budget","label":"What is your budget for this campaign?","type":"radio","options":["up to C$500","C$500-1k","C$1k - C$5k","C$5k-C$10k","Over C$10k","I''m not sure yet","I''m looking for guidance from the Pro"],"required":true,"hasOther":true},
  {"id":"timeline","label":"When are you looking to start this campaign?","type":"radio","options":["ASAP","In the next month","In the next 2-3 months","In the next 3-6 months"],"required":true,"hasOther":true}
]'::jsonb WHERE slug = 'business-stationery-design';
