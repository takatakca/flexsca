
-- Add company contact details columns to provider_profiles
ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS company_email text,
  ADD COLUMN IF NOT EXISTS company_phone text;
