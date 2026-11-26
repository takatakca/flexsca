-- Errors that happen in visitors' browsers, kept for the owner's dashboard.
-- No personal data: a message, a code location, the page path (no query string) and the browser name.
CREATE TABLE IF NOT EXISTS public.client_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL,
  message text NOT NULL,
  stack text,
  path text,
  agent text,
  signed_in boolean NOT NULL DEFAULT false,
  occurrences integer NOT NULL DEFAULT 1,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  day date NOT NULL DEFAULT current_date,
  UNIQUE (fingerprint, day)
);
CREATE INDEX IF NOT EXISTS client_errors_last_seen_idx ON public.client_errors (last_seen DESC);
ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_errors FROM PUBLIC, anon, authenticated;

-- Anyone's browser may report; the function bounds what is stored and how much.
CREATE OR REPLACE FUNCTION public.report_client_error(p_message text, p_stack text DEFAULT NULL, p_path text DEFAULT NULL, p_agent text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  clean_message text := left(btrim(COALESCE(p_message, '')), 300);
  clean_path text := left(split_part(split_part(COALESCE(p_path, ''), '?', 1), '#', 1), 200);
BEGIN
  IF clean_message = '' THEN RETURN; END IF;
  -- At most 200 distinct errors a day: a broken release is visible, a flood is not stored.
  IF (SELECT count(*) FROM public.client_errors WHERE day = current_date) >= 200
     AND NOT EXISTS (SELECT 1 FROM public.client_errors WHERE day = current_date AND fingerprint = md5(clean_message || '|' || clean_path)) THEN RETURN; END IF;
  INSERT INTO public.client_errors AS e (fingerprint, message, stack, path, agent, signed_in)
  VALUES (md5(clean_message || '|' || clean_path), clean_message, left(p_stack, 2000), NULLIF(clean_path, ''), left(p_agent, 200), auth.uid() IS NOT NULL)
  ON CONFLICT (fingerprint, day) DO UPDATE SET occurrences = LEAST(e.occurrences + 1, 1000000), last_seen = now();
  DELETE FROM public.client_errors WHERE day < current_date - 30;
END;
$$;
REVOKE ALL ON FUNCTION public.report_client_error(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.report_client_error(text, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_client_errors()
RETURNS TABLE (message text, path text, agent text, occurrences bigint, first_seen timestamptz, last_seen timestamptz, stack text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT e.message, e.path, max(e.agent), sum(e.occurrences)::bigint, min(e.first_seen), max(e.last_seen), max(e.stack)
  FROM public.client_errors e WHERE e.day >= current_date - 7
  GROUP BY e.message, e.path ORDER BY max(e.last_seen) DESC LIMIT 50;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_client_errors() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_client_errors() TO authenticated;
