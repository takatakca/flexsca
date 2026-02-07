
-- Provider profiles: company identity, location, about
CREATE TABLE public.provider_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  company_description TEXT,
  company_size TEXT DEFAULT 'solo',
  years_in_business INTEGER DEFAULT 0,
  city TEXT,
  province TEXT,
  location_private BOOLEAN DEFAULT true,
  profile_photo_url TEXT,
  covid_safety TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own provider profile"
  ON public.provider_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own provider profile"
  ON public.provider_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own provider profile"
  ON public.provider_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Provider services
CREATE TABLE public.provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own services"
  ON public.provider_services FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own services"
  ON public.provider_services FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own services"
  ON public.provider_services FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own services"
  ON public.provider_services FOR DELETE
  USING (user_id = auth.uid());

-- Provider photos (portfolio)
CREATE TABLE public.provider_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own photos"
  ON public.provider_photos FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own photos"
  ON public.provider_photos FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own photos"
  ON public.provider_photos FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own photos"
  ON public.provider_photos FOR DELETE
  USING (user_id = auth.uid());

-- Provider Q&A
CREATE TABLE public.provider_qas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_qas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own QAs"
  ON public.provider_qas FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own QAs"
  ON public.provider_qas FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own QAs"
  ON public.provider_qas FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own QAs"
  ON public.provider_qas FOR DELETE
  USING (user_id = auth.uid());

-- Storage bucket for provider media
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-media', 'provider-media', true);

-- Storage policies for provider media
CREATE POLICY "Users can upload their own provider media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'provider-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own provider media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'provider-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own provider media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'provider-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Provider media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'provider-media');

-- Trigger for updated_at on provider_profiles
CREATE TRIGGER update_provider_profiles_updated_at
  BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
