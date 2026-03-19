
-- Merchant business profiles table
CREATE TABLE public.merchant_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text,
  business_description text,
  cover_image_url text,
  logo_url text,
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  primary_category text,
  address text,
  city text,
  province text,
  postal_code text,
  phone text,
  website text,
  menu_url text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  specialties text,
  history text,
  business_status text DEFAULT 'open',
  verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Merchant categories
CREATE TABLE public.merchant_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  category_name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Merchant amenities/attributes
CREATE TABLE public.merchant_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  enabled boolean DEFAULT true,
  sort_order integer DEFAULT 0
);

-- Merchant business hours
CREATE TABLE public.merchant_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time,
  close_time time,
  is_closed boolean DEFAULT false,
  UNIQUE(merchant_id, day_of_week)
);

-- Merchant special hours
CREATE TABLE public.merchant_special_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  open_time time,
  close_time time,
  is_closed boolean DEFAULT false,
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Merchant photos/videos
CREATE TABLE public.merchant_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'photo',
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Merchant CTAs
CREATE TABLE public.merchant_ctas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  button_text text DEFAULT 'Learn More',
  button_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Merchant highlights
CREATE TABLE public.merchant_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  sort_order integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_special_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_ctas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_highlights ENABLE ROW LEVEL SECURITY;

-- RLS policies for merchant_profiles
CREATE POLICY "Anyone can view merchant profiles" ON public.merchant_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own merchant profile" ON public.merchant_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own merchant profile" ON public.merchant_profiles FOR UPDATE USING (user_id = auth.uid());

-- RLS for child tables (owner access via merchant_id)
CREATE OR REPLACE FUNCTION public.is_merchant_owner(p_merchant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.merchant_profiles
    WHERE id = p_merchant_id AND user_id = auth.uid()
  )
$$;

-- merchant_categories
CREATE POLICY "Anyone can view merchant categories" ON public.merchant_categories FOR SELECT USING (true);
CREATE POLICY "Owner can insert categories" ON public.merchant_categories FOR INSERT WITH CHECK (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can update categories" ON public.merchant_categories FOR UPDATE USING (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can delete categories" ON public.merchant_categories FOR DELETE USING (public.is_merchant_owner(merchant_id));

-- merchant_amenities
CREATE POLICY "Anyone can view merchant amenities" ON public.merchant_amenities FOR SELECT USING (true);
CREATE POLICY "Owner can insert amenities" ON public.merchant_amenities FOR INSERT WITH CHECK (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can update amenities" ON public.merchant_amenities FOR UPDATE USING (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can delete amenities" ON public.merchant_amenities FOR DELETE USING (public.is_merchant_owner(merchant_id));

-- merchant_hours
CREATE POLICY "Anyone can view merchant hours" ON public.merchant_hours FOR SELECT USING (true);
CREATE POLICY "Owner can insert hours" ON public.merchant_hours FOR INSERT WITH CHECK (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can update hours" ON public.merchant_hours FOR UPDATE USING (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can delete hours" ON public.merchant_hours FOR DELETE USING (public.is_merchant_owner(merchant_id));

-- merchant_special_hours
CREATE POLICY "Anyone can view merchant special hours" ON public.merchant_special_hours FOR SELECT USING (true);
CREATE POLICY "Owner can insert special hours" ON public.merchant_special_hours FOR INSERT WITH CHECK (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can update special hours" ON public.merchant_special_hours FOR UPDATE USING (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can delete special hours" ON public.merchant_special_hours FOR DELETE USING (public.is_merchant_owner(merchant_id));

-- merchant_media
CREATE POLICY "Anyone can view merchant media" ON public.merchant_media FOR SELECT USING (true);
CREATE POLICY "Owner can insert media" ON public.merchant_media FOR INSERT WITH CHECK (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can update media" ON public.merchant_media FOR UPDATE USING (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can delete media" ON public.merchant_media FOR DELETE USING (public.is_merchant_owner(merchant_id));

-- merchant_ctas
CREATE POLICY "Anyone can view merchant ctas" ON public.merchant_ctas FOR SELECT USING (true);
CREATE POLICY "Owner can insert ctas" ON public.merchant_ctas FOR INSERT WITH CHECK (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can update ctas" ON public.merchant_ctas FOR UPDATE USING (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can delete ctas" ON public.merchant_ctas FOR DELETE USING (public.is_merchant_owner(merchant_id));

-- merchant_highlights
CREATE POLICY "Anyone can view merchant highlights" ON public.merchant_highlights FOR SELECT USING (true);
CREATE POLICY "Owner can insert highlights" ON public.merchant_highlights FOR INSERT WITH CHECK (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can update highlights" ON public.merchant_highlights FOR UPDATE USING (public.is_merchant_owner(merchant_id));
CREATE POLICY "Owner can delete highlights" ON public.merchant_highlights FOR DELETE USING (public.is_merchant_owner(merchant_id));
