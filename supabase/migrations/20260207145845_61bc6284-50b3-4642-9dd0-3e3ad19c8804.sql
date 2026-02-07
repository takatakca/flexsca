
-- Create responses table for quote/response flow
CREATE TABLE public.responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  price_min NUMERIC,
  price_max NUMERIC,
  availability TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_response_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('sent', 'accepted', 'declined', 'withdrawn') THEN
    RAISE EXCEPTION 'Invalid response status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_response_status_trigger
BEFORE INSERT OR UPDATE ON public.responses
FOR EACH ROW EXECUTE FUNCTION public.validate_response_status();

-- Add validation trigger for availability
CREATE OR REPLACE FUNCTION public.validate_response_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.availability IS NOT NULL AND NEW.availability NOT IN ('today', 'tomorrow', 'this_week', 'custom') THEN
    RAISE EXCEPTION 'Invalid availability: %', NEW.availability;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_response_availability_trigger
BEFORE INSERT OR UPDATE ON public.responses
FOR EACH ROW EXECUTE FUNCTION public.validate_response_availability();

-- Enable RLS
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Pros can view their own responses
CREATE POLICY "Users can view their own responses"
ON public.responses
FOR SELECT
USING (pro_id = auth.uid());

-- Pros can insert responses for leads assigned to them
CREATE POLICY "Users can insert responses for their leads"
ON public.responses
FOR INSERT
WITH CHECK (
  pro_id = auth.uid()
  AND public.is_lead_assigned_to_current_user(lead_id)
);

-- Pros can update their own responses (e.g. withdraw)
CREATE POLICY "Users can update their own responses"
ON public.responses
FOR UPDATE
USING (pro_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_responses_lead_id ON public.responses(lead_id);
CREATE INDEX idx_responses_pro_id ON public.responses(pro_id);

-- Enable realtime for responses
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
