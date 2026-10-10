-- TAKATAK/FLEXS external opportunity provenance.
-- Additive: existing native FLEXS leads remain unchanged.
BEGIN;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS source_application text,
  ADD COLUMN IF NOT EXISTS source_product text,
  ADD COLUMN IF NOT EXISTS external_lead_id text,
  ADD COLUMN IF NOT EXISTS external_reference text,
  ADD COLUMN IF NOT EXISTS external_payload_hash text,
  ADD COLUMN IF NOT EXISTS contact_disclosure_authorized boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS external_authorization_basis text;

CREATE UNIQUE INDEX IF NOT EXISTS leads_external_source_id_uniq
  ON public.leads(source_application, external_lead_id)
  WHERE source_application IS NOT NULL AND external_lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_source_product_idx
  ON public.leads(source_product)
  WHERE source_product IS NOT NULL;

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_external_payload_hash_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_external_payload_hash_check
  CHECK (external_payload_hash IS NULL OR external_payload_hash ~ '^[a-f0-9]{64}$');

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_external_distribution_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_external_distribution_check
  CHECK (
    source_application IS NULL
    OR (
      external_lead_id IS NOT NULL
      AND external_reference IS NOT NULL
      AND external_payload_hash IS NOT NULL
      AND contact_disclosure_authorized = true
      AND external_authorization_basis IS NOT NULL
    )
  );

COMMIT;
