-- A verified review establishes confirmed-email ownership plus an accepted quote.
-- It does not claim that FLEXS inspected or certified completed work.
ALTER TABLE public.provider_reviews ADD COLUMN lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX provider_reviews_one_per_request ON public.provider_reviews(lead_id) WHERE lead_id IS NOT NULL;
DROP POLICY "Users can delete their own reviews" ON public.provider_reviews;
CREATE POLICY "Users can delete imported reviews" ON public.provider_reviews FOR DELETE TO authenticated
  USING(user_id=auth.uid() AND NOT verified AND lead_id IS NULL);

CREATE FUNCTION public.customer_review_status(p_lead_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE provider uuid; result jsonb;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.leads l JOIN auth.users u ON u.id=l.customer_user_id
    WHERE l.id=p_lead_id AND l.customer_user_id=auth.uid() AND u.email_confirmed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  SELECT pro_id INTO provider FROM public.responses WHERE lead_id=p_lead_id AND status='accepted';
  IF provider IS NULL OR provider=auth.uid() THEN RETURN NULL; END IF;
  SELECT jsonb_build_object('providerId',provider,'companyName',COALESCE(p.company_name,'Your professional'),
    'review',(SELECT jsonb_build_object('id',r.id,'rating',r.rating,'text',r.review_text) FROM public.provider_reviews r WHERE r.lead_id=p_lead_id))
    INTO result FROM (SELECT 1) x LEFT JOIN public.provider_profiles p ON p.user_id=provider;
  RETURN result;
END $$;

CREATE FUNCTION public.submit_customer_review(p_lead_id uuid,p_rating integer,p_text text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE customer public.leads%ROWTYPE; provider uuid; review_id uuid;
BEGIN
  SELECT * INTO customer FROM public.leads WHERE id=p_lead_id AND customer_user_id=auth.uid() FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 OR p_text IS NULL OR length(btrim(p_text)) NOT BETWEEN 10 AND 2000 THEN
    RAISE EXCEPTION 'Invalid review';
  END IF;
  SELECT pro_id INTO provider FROM public.responses WHERE lead_id=p_lead_id AND status='accepted';
  IF provider IS NULL OR provider=auth.uid() THEN RAISE EXCEPTION 'Accept a professional quote before reviewing'; END IF;
  -- Serialize per request; repeated submission preserves the original review.
  SELECT id INTO review_id FROM public.provider_reviews WHERE lead_id=p_lead_id;
  IF review_id IS NOT NULL THEN RETURN review_id; END IF;
  INSERT INTO public.provider_reviews(user_id,reviewer_name,rating,review_text,source,verified,lead_id)
    VALUES(provider,left(split_part(btrim(customer.customer_name),' ',1),40),p_rating,btrim(p_text),'flexs',true,p_lead_id)
    RETURNING id INTO review_id;
  INSERT INTO public.notifications(user_id,lead_id,title) VALUES(provider,p_lead_id,'A verified customer published a review');
  RETURN review_id;
END $$;
REVOKE ALL ON FUNCTION public.customer_review_status(uuid),public.submit_customer_review(uuid,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.customer_review_status(uuid),public.submit_customer_review(uuid,integer,text) TO authenticated;
