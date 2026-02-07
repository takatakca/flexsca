
-- Add personal name and personal photo columns for the messaging identity
ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS personal_name text,
  ADD COLUMN IF NOT EXISTS personal_photo_url text;
