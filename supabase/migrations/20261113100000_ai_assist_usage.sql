-- Daily allowance for AI drafting. Written only by the ai-assist Edge Function (service role).
CREATE TABLE public.ai_assist_usage (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  uses integer NOT NULL DEFAULT 0 CHECK (uses >= 0),
  PRIMARY KEY (user_id, day)
);
ALTER TABLE public.ai_assist_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_assist_usage FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ai_assist_usage TO service_role;

-- Takes one use if the account is under today's limit. Returns false when the limit is reached.
CREATE FUNCTION public.consume_ai_assist(p_user_id uuid, p_daily_limit integer) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_day date := (now() AT TIME ZONE 'utc')::date; v_taken integer;
BEGIN
  IF p_user_id IS NULL OR p_daily_limit IS NULL OR p_daily_limit < 1 THEN RETURN false; END IF;
  INSERT INTO public.ai_assist_usage(user_id, day, uses) VALUES (p_user_id, v_day, 1)
  ON CONFLICT (user_id, day) DO UPDATE SET uses = public.ai_assist_usage.uses + 1
    WHERE public.ai_assist_usage.uses < p_daily_limit
  RETURNING uses INTO v_taken;
  RETURN v_taken IS NOT NULL;
END $$;

-- Gives the use back when the provider call fails, so a failure never costs the user.
CREATE FUNCTION public.refund_ai_assist(p_user_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.ai_assist_usage SET uses = uses - 1
  WHERE user_id = p_user_id AND day = (now() AT TIME ZONE 'utc')::date AND uses > 0
$$;
REVOKE ALL ON FUNCTION public.consume_ai_assist(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_ai_assist(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_assist(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_ai_assist(uuid) TO service_role;
