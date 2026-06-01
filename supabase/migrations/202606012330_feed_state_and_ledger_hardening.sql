CREATE OR REPLACE FUNCTION public.apply_shell_delta(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_source_type text,
  p_source_id uuid,
  p_idempotency_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_balance integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user id is required';
  END IF;

  IF p_amount = 0 THEN
    RAISE EXCEPTION 'amount must not be zero';
  END IF;

  IF p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'idempotency key is required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_idempotency_key));

  IF EXISTS (
    SELECT 1
    FROM public.shell_ledger
    WHERE idempotency_key = p_idempotency_key
  ) THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET
    shell_balance = shell_balance + p_amount,
    updated_at = now()
  WHERE id = p_user_id
    AND shell_balance + p_amount >= 0
  RETURNING shell_balance INTO next_balance;

  IF next_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient shell balance';
  END IF;

  INSERT INTO public.shell_ledger (
    user_id,
    amount,
    balance_after,
    reason,
    source_type,
    source_id,
    idempotency_key
  )
  VALUES (
    p_user_id,
    p_amount,
    next_balance,
    p_reason,
    p_source_type,
    p_source_id,
    p_idempotency_key
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_shell_delta(uuid, integer, text, text, uuid, text) FROM PUBLIC;

DROP FUNCTION IF EXISTS public.fetch_feed_questions(integer, timestamptz);
DROP FUNCTION IF EXISTS public.fetch_feed_questions(integer, timestamptz, text);

CREATE OR REPLACE FUNCTION public.fetch_feed_questions(
  p_limit integer DEFAULT 30,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_sort text DEFAULT 'popular'
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category_id uuid,
  category jsonb,
  tags text[],
  option_a_title text,
  option_a_description text,
  option_a_image_url text,
  option_b_title text,
  option_b_description text,
  option_b_image_url text,
  vote_count_a integer,
  vote_count_b integer,
  reaction_like_count integer,
  reaction_fun_count integer,
  reaction_hard_count integer,
  comment_count integer,
  user_vote text,
  user_reaction text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH viewer_votes AS (
    SELECT DISTINCT ON (v.question_id)
      v.question_id,
      v.selected_option
    FROM public.votes v
    WHERE auth.uid() IS NOT NULL
      AND v.user_id = auth.uid()
    ORDER BY v.question_id, v.created_at DESC
  ),
  viewer_reactions AS (
    SELECT DISTINCT ON (qr.question_id)
      qr.question_id,
      qr.reaction_type
    FROM public.question_reactions qr
    WHERE auth.uid() IS NOT NULL
      AND qr.user_id = auth.uid()
    ORDER BY qr.question_id, qr.created_at DESC
  )
  SELECT
    q.id,
    q.title,
    q.description,
    q.category_id,
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'slug', c.slug,
      'color', c.emoji
    ) AS category,
    q.tags,
    q.option_a_title,
    q.option_a_description,
    q.option_a_image_url,
    q.option_b_title,
    q.option_b_description,
    q.option_b_image_url,
    q.option_a_votes,
    q.option_b_votes,
    q.like_count,
    q.fun_count,
    q.hard_count,
    q.comment_count,
    vv.selected_option AS user_vote,
    vr.reaction_type AS user_reaction,
    q.created_at
  FROM public.questions q
  LEFT JOIN public.categories c ON c.id = q.category_id
  LEFT JOIN viewer_votes vv ON vv.question_id = q.id
  LEFT JOIN viewer_reactions vr ON vr.question_id = q.id
  WHERE q.status = 'approved'
    AND (p_cursor_created_at IS NULL OR q.created_at < p_cursor_created_at)
  ORDER BY
    (vv.selected_option IS NOT NULL) ASC,
    CASE WHEN p_sort = 'latest' THEN q.created_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'trending' THEN q.heat_score + q.reward_score + q.controversy_score END DESC NULLS LAST,
    CASE WHEN p_sort = 'popular' THEN q.total_votes END DESC NULLS LAST,
    q.heat_score DESC NULLS LAST,
    q.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;

GRANT EXECUTE ON FUNCTION public.fetch_feed_questions(integer, timestamptz, text) TO anon, authenticated;
