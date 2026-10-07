BEGIN;
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.provider_profiles;
CREATE VIEW public.provider_profiles_public WITH (security_invoker=false) AS
SELECT user_id,company_name,company_description,company_size,years_in_business,
  CASE WHEN location_private THEN NULL ELSE city END AS city,
  CASE WHEN location_private THEN NULL ELSE province END AS province,
  profile_photo_url,personal_name,company_email,company_phone,website_links
FROM public.provider_profiles;
REVOKE ALL ON public.provider_profiles_public FROM PUBLIC;
GRANT SELECT ON public.provider_profiles_public TO anon,authenticated;
COMMIT;
