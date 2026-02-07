-- Add archived_at for clean archive history
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
