-- Allow anyone to view provider profiles (public profile page)
CREATE POLICY "Anyone can view provider profiles"
ON public.provider_profiles FOR SELECT
USING (true);

-- Allow anyone to view provider services
CREATE POLICY "Anyone can view provider services"
ON public.provider_services FOR SELECT
USING (true);

-- Allow anyone to view provider photos
CREATE POLICY "Anyone can view provider photos"
ON public.provider_photos FOR SELECT
USING (true);

-- Allow anyone to view provider reviews
CREATE POLICY "Anyone can view provider reviews"
ON public.provider_reviews FOR SELECT
USING (true);

-- Allow anyone to view provider QAs
CREATE POLICY "Anyone can view provider QAs"
ON public.provider_qas FOR SELECT
USING (true);
