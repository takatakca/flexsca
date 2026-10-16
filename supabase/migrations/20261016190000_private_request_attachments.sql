-- FLEXS private request attachments. No public URLs or shared bucket.
-- Storage API owns file bytes; the metadata table is linked to uploaded objects.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('request-attachments','request-attachments',false,8388608,
        ARRAY['application/pdf','image/jpeg','image/png'])
ON CONFLICT (id) DO NOTHING;

DO $bucket$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id='request-attachments' AND public IS FALSE
      AND file_size_limit IS NOT NULL AND file_size_limit <= 8388608
      AND allowed_mime_types IS NOT NULL
      AND allowed_mime_types <@ ARRAY['application/pdf','image/jpeg','image/png']::text[]
  ) THEN
    RAISE EXCEPTION 'request-attachments bucket requires private access and safe size/type limits';
  END IF;
END $bucket$;

-- Paths are lead UUID / random UUID with approved extension only.
-- Never accept original filenames as Storage object keys.
CREATE POLICY "request attachments owner upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id='request-attachments'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(pdf|jpg|png)$'
    AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id::text=split_part(name,'/',1) AND l.customer_user_id=auth.uid()
    )
  );
CREATE POLICY "request attachments entitled download" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id='request-attachments'
    AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id::text=split_part(name,'/',1)
      AND (l.customer_user_id=auth.uid() OR EXISTS (
        SELECT 1 FROM public.lead_agent_state s
        WHERE s.lead_id=l.id AND s.agent_id=auth.uid() AND s.contacted
      ))
    )
  );
CREATE POLICY "request attachments owner delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id='request-attachments'
    AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id::text=split_part(name,'/',1) AND l.customer_user_id=auth.uid()
    )
  );

CREATE TABLE public.request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  path text NOT NULL UNIQUE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id),
  original_name text NOT NULL CHECK (char_length(btrim(original_name)) BETWEEN 1 AND 140),
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf','image/jpeg','image/png')),
  size_bytes integer NOT NULL CHECK (size_bytes BETWEEN 1 AND 8388608),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT request_attachment_path CHECK (
    path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(pdf|jpg|png)$'
    AND split_part(path,'/',1)=lead_id::text
    AND (mime_type='application/pdf' AND right(path,4)='.pdf'
      OR mime_type='image/jpeg' AND right(path,4)='.jpg'
      OR mime_type='image/png' AND right(path,4)='.png')
  )
);
CREATE INDEX request_attachments_lead_recent ON public.request_attachments(lead_id,created_at DESC);
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,DELETE ON public.request_attachments TO authenticated;
REVOKE ALL ON public.request_attachments FROM anon;
CREATE POLICY "request attachments entitled metadata" ON public.request_attachments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.leads l WHERE l.id=lead_id
      AND (l.customer_user_id=auth.uid() OR EXISTS (
        SELECT 1 FROM public.lead_agent_state s
        WHERE s.lead_id=l.id AND s.agent_id=auth.uid() AND s.contacted
      ))
    )
  );
CREATE POLICY "request attachments owner register" ON public.request_attachments
  FOR INSERT TO authenticated WITH CHECK (
    uploaded_by=auth.uid()
    AND EXISTS (SELECT 1 FROM public.leads l
      WHERE l.id=lead_id AND l.customer_user_id=auth.uid())
    AND EXISTS (SELECT 1 FROM storage.objects o
      WHERE o.bucket_id='request-attachments' AND o.name=path)
  );
CREATE POLICY "request attachments owner unregister" ON public.request_attachments
  FOR DELETE TO authenticated USING (
    uploaded_by=auth.uid() AND EXISTS (SELECT 1 FROM public.leads l
      WHERE l.id=lead_id AND l.customer_user_id=auth.uid())
  );
-- No UPDATE privilege or policy: the path/owner/provenance are immutable.
