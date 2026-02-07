
-- Add video_urls column to provider_profiles for YouTube video links
ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS video_urls TEXT[];
