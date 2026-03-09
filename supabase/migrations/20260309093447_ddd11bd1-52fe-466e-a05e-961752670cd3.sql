
-- Update Advertising Agency with full question set matching screenshots
UPDATE service_categories SET questions = '[
  {"id":"stationery_type","label":"What kind of stationery would you like?","type":"checkbox","options":["Booklets","Business Cards","Envelopes","Headed Paper","Pencils","Pens","I''m not sure"],"required":true,"hasOther":true},
  {"id":"color_printing","label":"Do you require color printing or black and white?","type":"radio","options":["Color Printing","Black and White","Not applicable","I''m not sure"],"required":true,"hasOther":true},
  {"id":"single_double","label":"Will this be single sided or double sided","type":"radio","options":["Double Sided","Single Sided","Not applicable","I''m not sure"],"required":true,"hasOther":true},
  {"id":"paper_weight","label":"Desired Paper Weight","type":"radio","options":["350-400 GSM (Business Cards)","300 GSM","250 GSM (Lightweight Card)","200 GSM (Premium Paper)","170 GSM","130 GSM (Standard e.g. Takeaway menu)","100 GSM","Not Applicable","Not sure"],"required":true,"hasOther":true},
  {"id":"pages","label":"How many pages does each copy have?","type":"radio","options":["250+","100-250","50-100","25-50","10-25","5-10","Less than 5","Not Applicable"],"required":true,"hasOther":true},
  {"id":"copies","label":"How many copies will you need?","type":"radio","options":["1000+","750-1000","500-750","250-500","100-250","50-100","Less than 50","I''m not sure"],"required":true,"hasOther":true},
  {"id":"design_status","label":"Do you already have a design?","type":"radio","options":["I''m looking for assistance from the Pro","I''ve got a design but I would like feedback from the Pro","I just want to use my design","I''m not sure"],"required":true,"hasOther":true},
  {"id":"deadline","label":"What is the deadline of this project?","type":"radio","options":["Less than 3 months","Less than 2 months","Less than 1 months","Less than 3 weeks","Less than 2 weeks","I''m not sure"],"required":true,"hasOther":true},
  {"id":"support_type","label":"Which of the following do you need support with?","type":"checkbox","options":["Advert Design","Advert production","Copywriting","Creative Production Services","Measuring Performance","Media Buying","None of the above"],"required":true,"hasOther":true},
  {"id":"budget","label":"What is your budget for this campaign?","type":"radio","options":["up to C$500","C$500-1k","C$1k - C$5k","C$5k-C$10k","Over C$10k","I''m not sure yet","I''m looking for guidance from the Pro"],"required":true,"hasOther":true},
  {"id":"timeline","label":"When are you looking to start this campaign?","type":"radio","options":["ASAP","In the next month","In the next 2-3 months","In the next 3-6 months"],"required":true,"hasOther":true}
]'::jsonb WHERE slug = 'advertising-agency';
