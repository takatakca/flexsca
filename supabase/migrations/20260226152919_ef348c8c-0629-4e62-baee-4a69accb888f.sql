
-- Service categories with dynamic questionnaire templates
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '🔧',
  base_credit_cost INTEGER NOT NULL DEFAULT 5,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public read access for categories (customers need to see them)
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON public.service_categories FOR SELECT
  USING (is_active = true);

-- Seed popular service categories with questionnaire templates
INSERT INTO public.service_categories (name, slug, icon, base_credit_cost, sort_order, questions) VALUES
(
  'House Cleaning', 'house-cleaning', '🧹', 6, 1,
  '[
    {"id":"property_type","label":"What type of property?","type":"select","options":["House","Apartment","Condo","Other"],"required":true},
    {"id":"bedrooms","label":"How many bedrooms?","type":"select","options":["1","2","3","4","5+"],"required":true},
    {"id":"clean_type","label":"What type of cleaning?","type":"select","options":["Regular clean","Deep clean","End of tenancy","One-off"],"required":true},
    {"id":"frequency","label":"How often do you need cleaning?","type":"select","options":["One-time","Weekly","Bi-weekly","Monthly"],"required":true},
    {"id":"timing","label":"When do you need this?","type":"select","options":["As soon as possible","Within a week","Within a month","Flexible"],"required":true}
  ]'::jsonb
),
(
  'Plumbing', 'plumbing', '🔧', 5, 2,
  '[
    {"id":"issue_type","label":"What plumbing issue do you have?","type":"select","options":["Leaking tap","Blocked drain","Boiler issue","Pipe repair","Installation","Other"],"required":true},
    {"id":"urgency","label":"How urgent is this?","type":"select","options":["Emergency (today)","Within 2 days","Within a week","Flexible"],"required":true},
    {"id":"property_type","label":"Is this residential or commercial?","type":"select","options":["Residential","Commercial"],"required":true}
  ]'::jsonb
),
(
  'Electrical Work', 'electrical-work', '⚡', 6, 3,
  '[
    {"id":"work_type","label":"What electrical work do you need?","type":"select","options":["Socket installation","Light fitting","Rewiring","Fuse box","Safety inspection","Other"],"required":true},
    {"id":"urgency","label":"When do you need this done?","type":"select","options":["Emergency","Within a week","Within a month","Flexible"],"required":true}
  ]'::jsonb
),
(
  'Painting & Decorating', 'painting-decorating', '🎨', 8, 4,
  '[
    {"id":"room_count","label":"How many rooms?","type":"select","options":["1","2","3","4","5+"],"required":true},
    {"id":"work_type","label":"What work is needed?","type":"select","options":["Interior painting","Exterior painting","Wallpapering","Full redecoration"],"required":true},
    {"id":"paint_supplied","label":"Have you already bought the paint?","type":"select","options":["Yes","No, I need the professional to supply it"],"required":true},
    {"id":"timing","label":"When do you need this?","type":"select","options":["As soon as possible","Within a week","Within a month","Flexible"],"required":true}
  ]'::jsonb
),
(
  'Garden Maintenance', 'garden-maintenance', '🌿', 7, 5,
  '[
    {"id":"service_type","label":"What garden work do you need?","type":"select","options":["Lawn mowing","Hedge trimming","Full garden tidy","Landscaping","Tree surgery","Other"],"required":true},
    {"id":"garden_size","label":"How big is your garden?","type":"select","options":["Small (up to 50m²)","Medium (50-150m²)","Large (150m²+)"],"required":true},
    {"id":"frequency","label":"How often?","type":"select","options":["One-time","Weekly","Monthly","Seasonal"],"required":true}
  ]'::jsonb
),
(
  'Removals', 'removals', '📦', 9, 6,
  '[
    {"id":"move_size","label":"What size is your move?","type":"select","options":["Studio/1 bed","2-3 bed","4+ bed","Office/Commercial"],"required":true},
    {"id":"distance","label":"How far is the move?","type":"select","options":["Same area (under 10 miles)","Within city","Long distance","International"],"required":true},
    {"id":"packing","label":"Do you need packing help?","type":"select","options":["Yes, full packing","Some help","No, just transport"],"required":true},
    {"id":"timing","label":"When is the move?","type":"select","options":["Within a week","Within a month","1-3 months","Flexible"],"required":true}
  ]'::jsonb
),
(
  'Dog Walking', 'dog-walking', '🐕', 5, 7,
  '[
    {"id":"dog_count","label":"How many dogs?","type":"select","options":["1","2","3+"],"required":true},
    {"id":"walk_type","label":"What type of walks?","type":"select","options":["30 minutes","1 hour","Extended (2+ hours)"],"required":true},
    {"id":"frequency","label":"How often?","type":"select","options":["Daily","Few times a week","Weekly","One-time"],"required":true},
    {"id":"timing","label":"When do you need this?","type":"select","options":["Starting this week","Starting next week","Flexible"],"required":true}
  ]'::jsonb
),
(
  'Personal Training', 'personal-training', '💪', 7, 8,
  '[
    {"id":"goal","label":"What is your fitness goal?","type":"select","options":["Weight loss","Muscle building","General fitness","Sports performance","Rehabilitation"],"required":true},
    {"id":"experience","label":"Your fitness level?","type":"select","options":["Beginner","Intermediate","Advanced"],"required":true},
    {"id":"location","label":"Where would you like to train?","type":"select","options":["At home","At a gym","Outdoors","Online"],"required":true},
    {"id":"frequency","label":"How many sessions per week?","type":"select","options":["1","2","3","4+"],"required":true}
  ]'::jsonb
),
(
  'Photography', 'photography', '📸', 10, 9,
  '[
    {"id":"event_type","label":"What type of photography?","type":"select","options":["Wedding","Portrait","Event","Product","Real estate","Other"],"required":true},
    {"id":"duration","label":"How long do you need the photographer?","type":"select","options":["1-2 hours","Half day","Full day","Multiple days"],"required":true},
    {"id":"timing","label":"When is the event/session?","type":"select","options":["Within a week","Within a month","1-3 months","Flexible"],"required":true}
  ]'::jsonb
),
(
  'Web Design', 'web-design', '💻', 12, 10,
  '[
    {"id":"project_type","label":"What do you need?","type":"select","options":["New website","Website redesign","Landing page","E-commerce store","Web app"],"required":true},
    {"id":"pages","label":"How many pages?","type":"select","options":["1-5","5-10","10-20","20+"],"required":true},
    {"id":"budget","label":"What is your budget?","type":"select","options":["Under $500","$500-$2,000","$2,000-$5,000","$5,000+"],"required":true},
    {"id":"timeline","label":"When do you need it?","type":"select","options":["ASAP","Within a month","1-3 months","No rush"],"required":true}
  ]'::jsonb
);

-- Add foreign key from leads.category to reference category name for consistency
-- (keeping text-based for backward compatibility with existing leads)
