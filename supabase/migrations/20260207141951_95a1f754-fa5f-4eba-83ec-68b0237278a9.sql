
-- 1. Add INSERT policy for leads (so app/admin can create leads)
CREATE POLICY "Users can create leads assigned to them"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (assigned_to = auth.uid());

-- 2. Add archived + last_activity_at to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 3. Add read_at to lead_messages
ALTER TABLE public.lead_messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 4. Create lead_last_message view for efficient Responses page
CREATE OR REPLACE VIEW public.lead_last_message AS
SELECT DISTINCT ON (lm.lead_id)
  lm.lead_id,
  lm.message,
  lm.sender_type,
  lm.created_at
FROM public.lead_messages lm
ORDER BY lm.lead_id, lm.created_at DESC;

-- 5. Trigger to update last_activity_at when a message is inserted
CREATE OR REPLACE FUNCTION public.update_lead_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.leads SET last_activity_at = now() WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_lead_message_inserted
  AFTER INSERT ON public.lead_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_last_activity();
