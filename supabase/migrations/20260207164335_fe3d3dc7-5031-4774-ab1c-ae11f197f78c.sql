
-- Store customer reviews (from invites, link, or Facebook import)
CREATE TABLE public.provider_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  reviewer_name TEXT,
  reviewer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  source TEXT NOT NULL DEFAULT 'invite', -- 'invite', 'link', 'facebook'
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reviews"
  ON public.provider_reviews FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reviews"
  ON public.provider_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews"
  ON public.provider_reviews FOR DELETE
  USING (user_id = auth.uid());

-- Store review invitations sent by provider
CREATE TABLE public.review_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'completed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.review_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invitations"
  ON public.review_invitations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own invitations"
  ON public.review_invitations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own invitations"
  ON public.review_invitations FOR DELETE
  USING (user_id = auth.uid());
