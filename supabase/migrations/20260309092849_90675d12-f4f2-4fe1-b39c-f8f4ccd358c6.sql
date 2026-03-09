
-- Add questionnaire questions to advertising-and-media-buying parent
UPDATE service_categories SET questions = '[
  {"id":"ad_type","label":"Which type(s) of advertising are you interested in?","type":"checkbox","options":["Broadcast (TV, radio)","I''m not sure","Online (PPC, Social media)","Outdoor (billboards, kiosks)","Print (newspaper, magazines, flyers)","Public service","I''m looking for guidance from the Pro"],"required":true,"hasOther":true},
  {"id":"budget","label":"What is your approximate budget?","type":"radio","options":["Under $500","$500 - $1,000","$1,000 - $5,000","$5,000 - $10,000","$10,000+","I''m not sure"],"required":true},
  {"id":"timeline","label":"When do you need this?","type":"radio","options":["As soon as possible","Within the next week","Within the next month","I''m flexible"],"required":true}
]'::jsonb WHERE slug = 'advertising-and-media-buying';

-- TV Media Buying
UPDATE service_categories SET questions = '[
  {"id":"tv_type","label":"What type of TV advertising do you need?","type":"checkbox","options":["National TV advertising","Regional TV advertising","Cable TV advertising","Streaming/Connected TV","I''m not sure"],"required":true,"hasOther":true},
  {"id":"budget","label":"What is your approximate budget?","type":"radio","options":["Under $5,000","$5,000 - $10,000","$10,000 - $50,000","$50,000+","I''m not sure"],"required":true},
  {"id":"timeline","label":"When do you need this?","type":"radio","options":["As soon as possible","Within the next week","Within the next month","I''m flexible"],"required":true}
]'::jsonb WHERE slug = 'tv-media-buying';

-- Online Media Buying
UPDATE service_categories SET questions = '[
  {"id":"online_type","label":"What type of online media buying do you need?","type":"checkbox","options":["PPC (Pay-per-click)","Social media advertising","Display advertising","Video advertising","Programmatic buying","I''m not sure"],"required":true,"hasOther":true},
  {"id":"platforms","label":"Which platforms are you interested in?","type":"checkbox","options":["Google Ads","Facebook/Instagram","LinkedIn","Twitter/X","TikTok","YouTube","Other"],"required":true},
  {"id":"budget","label":"What is your approximate monthly budget?","type":"radio","options":["Under $500","$500 - $2,000","$2,000 - $5,000","$5,000 - $10,000","$10,000+","I''m not sure"],"required":true},
  {"id":"timeline","label":"When do you need this?","type":"radio","options":["As soon as possible","Within the next week","Within the next month","I''m flexible"],"required":true}
]'::jsonb WHERE slug = 'online-media-buying';

-- Radio Airtime Purchasing
UPDATE service_categories SET questions = '[
  {"id":"radio_type","label":"What type of radio advertising do you need?","type":"checkbox","options":["Local radio","National radio","Internet radio/podcasts","I''m not sure"],"required":true,"hasOther":true},
  {"id":"budget","label":"What is your approximate budget?","type":"radio","options":["Under $1,000","$1,000 - $5,000","$5,000 - $10,000","$10,000+","I''m not sure"],"required":true},
  {"id":"timeline","label":"When do you need this?","type":"radio","options":["As soon as possible","Within the next week","Within the next month","I''m flexible"],"required":true}
]'::jsonb WHERE slug = 'radio-airtime-purchasing';

-- Print Media Purchasing
UPDATE service_categories SET questions = '[
  {"id":"print_type","label":"What type of print media do you need?","type":"checkbox","options":["Newspaper advertising","Magazine advertising","Flyers/leaflets","Brochures","Direct mail","I''m not sure"],"required":true,"hasOther":true},
  {"id":"budget","label":"What is your approximate budget?","type":"radio","options":["Under $500","$500 - $2,000","$2,000 - $5,000","$5,000+","I''m not sure"],"required":true},
  {"id":"timeline","label":"When do you need this?","type":"radio","options":["As soon as possible","Within the next week","Within the next month","I''m flexible"],"required":true}
]'::jsonb WHERE slug = 'print-media-purchasing';

-- Advertising Copywriting
UPDATE service_categories SET questions = '[
  {"id":"copy_type","label":"What type of advertising copy do you need?","type":"checkbox","options":["Print ad copy","Digital ad copy","Radio scripts","TV scripts","Social media copy","I''m not sure"],"required":true,"hasOther":true},
  {"id":"budget","label":"What is your approximate budget?","type":"radio","options":["Under $500","$500 - $1,000","$1,000 - $5,000","$5,000+","I''m not sure"],"required":true},
  {"id":"timeline","label":"When do you need this?","type":"radio","options":["As soon as possible","Within the next week","Within the next month","I''m flexible"],"required":true}
]'::jsonb WHERE slug = 'advertising-copywriting';

-- Broadlines and Slogans (Strapline and Slogan Writer)
UPDATE service_categories SET questions = '[
  {"id":"slogan_type","label":"What do you need?","type":"checkbox","options":["Brand slogan/tagline","Advertising strapline","Campaign catchphrase","Company motto","I''m not sure"],"required":true,"hasOther":true},
  {"id":"budget","label":"What is your approximate budget?","type":"radio","options":["Under $500","$500 - $1,000","$1,000 - $3,000","$3,000+","I''m not sure"],"required":true},
  {"id":"timeline","label":"When do you need this?","type":"radio","options":["As soon as possible","Within the next week","Within the next month","I''m flexible"],"required":true}
]'::jsonb WHERE slug = 'broadlines-and-slogans';

-- Advertising (parent under advertising-and-media-buying)
UPDATE service_categories SET questions = '[
  {"id":"ad_type","label":"What type of advertising do you need?","type":"checkbox","options":["Digital advertising","Print advertising","Outdoor advertising","Broadcast advertising","I''m not sure"],"required":true,"hasOther":true},
  {"id":"budget","label":"What is your approximate budget?","type":"radio","options":["Under $1,000","$1,000 - $5,000","$5,000 - $10,000","$10,000+","I''m not sure"],"required":true},
  {"id":"timeline","label":"When do you need this?","type":"radio","options":["As soon as possible","Within the next week","Within the next month","I''m flexible"],"required":true}
]'::jsonb WHERE slug = 'advertising';

-- Branding children: Logo Design
UPDATE service_categories SET questions = '[
  {"id":"logo_type","label":"What type of logo do you need?","type":"radio","options":["New logo design","Logo redesign/refresh","Logo variations","I''m not sure"],"required":true},
  {"id":"style","label":"What style are you looking for?","type":"checkbox","options":["Modern/Minimalist","Classic/Traditional","Playful/Fun","Bold/Strong","Elegant/Luxury","I''m not sure"],"required":true},
  {"id":"budget","label":"What is your approximate budget?","type":"radio","options":["Under $200","$200 - $500","$500 - $1,000","$1,000+","I''m not sure"],"required":true},
  {"id":"timeline","label":"When do you need this?","type":"radio","options":["As soon as possible","Within the next week","Within the next month","I''m flexible"],"required":true}
]'::jsonb WHERE slug = 'logo-design';

-- Flyer & Leaflet Design
UPDATE service_categories SET questions = '[
  {"id":"flyer_type","label":"What do you need designed?","type":"checkbox","options":["Flyers","Leaflets","Brochures","Posters","I''m not sure"],"required":true,"hasOther":true},
  {"id":"quantity","label":"How many designs do you need?","type":"radio","options":["1","2-5","5-10","10+"],"required":true},
  {"id":"budget","label":"What is your approximate budget?","type":"radio","options":["Under $200","$200 - $500","$500 - $1,000","$1,000+","I''m not sure"],"required":true},
  {"id":"timeline","label":"When do you need this?","type":"radio","options":["As soon as possible","Within the next week","Within the next month","I''m flexible"],"required":true}
]'::jsonb WHERE slug = 'flyer-leaflet-design';

-- Business Stationery Design
UPDATE service_categories SET questions = '[
  {"id":"stationery_type","label":"What stationery do you need designed?","type":"checkbox","options":["Business cards","Letterheads","Envelopes","Compliment slips","Full stationery set","I''m not sure"],"required":true,"hasOther":true},
  {"id":"budget","label":"What is your approximate budget?","type":"radio","options":["Under $200","$200 - $500","$500 - $1,000","$1,000+","I''m not sure"],"required":true},
  {"id":"timeline","label":"When do you need this?","type":"radio","options":["As soon as possible","Within the next week","Within the next month","I''m flexible"],"required":true}
]'::jsonb WHERE slug = 'business-stationery-design';

-- Email Template Design
UPDATE service_categories SET questions = '[
  {"id":"email_type","label":"What type of email template do you need?","type":"checkbox","options":["Newsletter template","Marketing email","Transactional email","Welcome email series","I''m not sure"],"required":true,"hasOther":true},
  {"id":"platform","label":"Which email platform do you use?","type":"radio","options":["Mailchimp","Constant Contact","HubSpot","Klaviyo","Other","I''m not sure"],"required":true},
  {"id":"budget","label":"What is your approximate budget?","type":"radio","options":["Under $200","$200 - $500","$500 - $1,000","$1,000+","I''m not sure"],"required":true},
  {"id":"timeline","label":"When do you need this?","type":"radio","options":["As soon as possible","Within the next week","Within the next month","I''m flexible"],"required":true}
]'::jsonb WHERE slug = 'email-template-design';

-- Also update the "Broadlines and Slogans" name to match screenshot: "Strapline and Slogan Writer"  
UPDATE service_categories SET name = 'Strapline and Slogan Writer' WHERE slug = 'broadlines-and-slogans';
