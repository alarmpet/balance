-- Durable per-user rate limits for AI Edge Functions.
-- Apply after 202606021900_auth_profile_metadata.sql.

CREATE TABLE IF NOT EXISTS public.ai_edge_rate_limit_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  function_name text NOT NULL CHECK (function_name IN ('embed-question', 'refine-question')),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_edge_rate_limit_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ai_edge_rate_limit_events FROM anon;
REVOKE ALL ON public.ai_edge_rate_limit_events FROM authenticated;

CREATE INDEX IF NOT EXISTS idx_ai_edge_rate_limit_events_user_function_created
ON public.ai_edge_rate_limit_events(user_id, function_name, created_at DESC);

CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  p_function_name text,
  p_window_seconds integer,
  p_max_requests integer
)
RETURNS TABLE(allowed boolean, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  window_start timestamptz;
  recent_count integer;
  oldest_in_window timestamptz;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_function_name NOT IN ('embed-question', 'refine-question') THEN
    RAISE EXCEPTION 'invalid function name';
  END IF;

  IF p_window_seconds < 1 OR p_window_seconds > 3600 THEN
    RAISE EXCEPTION 'invalid rate limit window';
  END IF;

  IF p_max_requests < 1 OR p_max_requests > 600 THEN
    RAISE EXCEPTION 'invalid max requests';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(current_user_id::text || ':' || p_function_name)::bigint);

  DELETE FROM public.ai_edge_rate_limit_events
  WHERE created_at < now() - interval '1 day';

  window_start := now() - make_interval(secs => p_window_seconds);

  SELECT count(*), min(created_at)
  INTO recent_count, oldest_in_window
  FROM public.ai_edge_rate_limit_events
  WHERE user_id = current_user_id
    AND function_name = p_function_name
    AND created_at >= window_start;

  IF recent_count >= p_max_requests THEN
    allowed := false;
    retry_after_seconds := GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM (oldest_in_window + make_interval(secs => p_window_seconds) - now())))::integer
    );
    RETURN NEXT;
    RETURN;
  END IF;

  INSERT INTO public.ai_edge_rate_limit_events (user_id, function_name)
  VALUES (current_user_id, p_function_name);

  allowed := true;
  retry_after_seconds := 0;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.check_ai_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_ai_rate_limit(text, integer, integer) TO authenticated;
