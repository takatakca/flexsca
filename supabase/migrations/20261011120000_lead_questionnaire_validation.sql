-- Enforce the published questionnaire even when a caller bypasses the UI.
CREATE FUNCTION public.validate_lead_questionnaire() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_questions jsonb; v_question jsonb; v_answer jsonb; v_item jsonb;
  v_key text; v_type text; v_text text; v_required boolean;
BEGIN
  SELECT questions INTO v_questions FROM public.service_categories
    WHERE name = NEW.category AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Service unavailable'; END IF;
  IF jsonb_typeof(v_questions) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Questionnaire unavailable';
  END IF;
  IF jsonb_typeof(NEW.answers) IS DISTINCT FROM 'object'
    OR octet_length(NEW.answers::text) > 16000 THEN
    RAISE EXCEPTION 'Invalid questionnaire answers';
  END IF;
  FOR v_key IN SELECT jsonb_object_keys(NEW.answers) LOOP
    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_questions) q WHERE q->>'id' = v_key) THEN
      RAISE EXCEPTION 'Unknown questionnaire answer';
    END IF;
  END LOOP;
  FOR v_question IN SELECT value FROM jsonb_array_elements(v_questions) LOOP
    v_key := v_question->>'id'; v_type := v_question->>'type';
    IF COALESCE(v_key,'') = '' OR v_type IS NULL
      OR v_type NOT IN ('radio','select','checkbox','textarea','location') THEN
      RAISE EXCEPTION 'Questionnaire unavailable';
    END IF;
    v_required := COALESCE((v_question->>'required')::boolean,false);
    v_answer := NEW.answers->v_key;
    IF v_answer IS NULL THEN
      IF v_required THEN RAISE EXCEPTION 'Required questionnaire answer missing'; END IF;
      CONTINUE;
    END IF;
    IF v_type = 'checkbox' THEN
      IF jsonb_typeof(v_answer) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Invalid checkbox answer';
      END IF;
      IF jsonb_array_length(v_answer) > 50 OR (v_required AND jsonb_array_length(v_answer) = 0)
        OR (SELECT count(*) <> count(DISTINCT value) FROM jsonb_array_elements(v_answer)) THEN
        RAISE EXCEPTION 'Invalid checkbox selections';
      END IF;
    ELSE
      IF jsonb_typeof(v_answer) IS DISTINCT FROM 'string' THEN
        RAISE EXCEPTION 'Invalid questionnaire answer type';
      END IF;
      v_text := v_answer #>> '{}';
      IF length(v_text) > (CASE WHEN v_type='textarea' THEN 2000 WHEN v_type='location' THEN 200 ELSE 500 END)
        OR (v_required AND length(trim(v_text)) = 0) THEN
        RAISE EXCEPTION 'Invalid questionnaire answer length';
      END IF;
      IF NOT v_required AND length(trim(v_text)) = 0 THEN CONTINUE; END IF;
    END IF;
    IF v_type IN ('radio','select','checkbox') THEN
      IF jsonb_typeof(v_question->'options') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Questionnaire unavailable';
      END IF;
      FOR v_item IN SELECT value FROM jsonb_array_elements(
        CASE WHEN v_type='checkbox' THEN v_answer ELSE jsonb_build_array(v_answer) END
      ) LOOP
        IF jsonb_typeof(v_item) IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'Invalid selection'; END IF;
        v_text := v_item #>> '{}';
        IF length(trim(v_text)) = 0 OR length(v_text) > 500 THEN RAISE EXCEPTION 'Invalid selection'; END IF;
        IF NOT (v_question->'options' @> jsonb_build_array(v_text)) AND NOT (
          COALESCE((v_question->>'hasOther')::boolean,false)
          AND left(v_text,7) = 'Other: ' AND length(trim(substr(v_text,8))) > 0
        ) THEN RAISE EXCEPTION 'Invalid questionnaire option'; END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_lead_questionnaire() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER lead_questionnaire_validation
BEFORE INSERT OR UPDATE OF answers,category ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.validate_lead_questionnaire();
