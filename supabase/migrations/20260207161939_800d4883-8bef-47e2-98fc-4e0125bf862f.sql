
-- Create accreditations table for provider profiles
CREATE TABLE public.provider_accreditations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  issuer TEXT,
  year_obtained INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_accreditations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own accreditations"
  ON public.provider_accreditations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own accreditations"
  ON public.provider_accreditations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own accreditations"
  ON public.provider_accreditations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own accreditations"
  ON public.provider_accreditations FOR DELETE
  USING (user_id = auth.uid());
