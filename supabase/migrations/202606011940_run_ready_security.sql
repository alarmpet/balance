CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    nickname,
    shell_balance,
    streak_count,
    total_participation_count,
    today_participation_count
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'islander_' || substr(NEW.id::text, 1, 6)),
    0,
    0,
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_traits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "questions_public_read_approved" ON public.questions;
CREATE POLICY "questions_public_read_approved"
ON public.questions
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "question_traits_public_read" ON public.question_traits;
CREATE POLICY "question_traits_public_read"
ON public.question_traits
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "votes_select_own" ON public.votes;
CREATE POLICY "votes_select_own"
ON public.votes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "votes_insert_own" ON public.votes;
CREATE POLICY "votes_insert_own"
ON public.votes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "question_reactions_select_own" ON public.question_reactions;
CREATE POLICY "question_reactions_select_own"
ON public.question_reactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "question_reactions_insert_own" ON public.question_reactions;
CREATE POLICY "question_reactions_insert_own"
ON public.question_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_public_read" ON public.comments;
CREATE POLICY "comments_public_read"
ON public.comments
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
CREATE POLICY "comments_insert_own"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_traits_select_own" ON public.user_traits;
CREATE POLICY "user_traits_select_own"
ON public.user_traits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "islands_select_own" ON public.islands;
CREATE POLICY "islands_select_own"
ON public.islands
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "characters_select_own" ON public.characters;
CREATE POLICY "characters_select_own"
ON public.characters
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.fetch_feed_questions(
  p_limit integer DEFAULT 30,
  p_cursor_created_at timestamptz DEFAULT NULL
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
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id,
    q.title,
    q.description,
    q.category_id,
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'slug', c.slug,
      'color', c.color
    ) AS category,
    q.tags,
    q.option_a_title,
    q.option_a_description,
    q.option_a_image_url,
    q.option_b_title,
    q.option_b_description,
    q.option_b_image_url,
    q.vote_count_a,
    q.vote_count_b,
    q.reaction_like_count,
    q.reaction_fun_count,
    q.reaction_hard_count,
    q.comment_count,
    q.created_at
  FROM public.questions q
  LEFT JOIN public.categories c ON c.id = q.category_id
  WHERE q.status = 'approved'
    AND (p_cursor_created_at IS NULL OR q.created_at < p_cursor_created_at)
    AND (
      auth.uid() IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM public.votes v
        WHERE v.question_id = q.id
          AND v.user_id = auth.uid()
      )
    )
  ORDER BY q.heat_score DESC NULLS LAST, q.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;

CREATE OR REPLACE FUNCTION public.submit_vote(
  p_question_id uuid,
  p_selected_option text,
  p_response_time_ms integer DEFAULT NULL
)
RETURNS public.votes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_vote public.votes;
  trait_record record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_selected_option NOT IN ('A', 'B') THEN
    RAISE EXCEPTION 'selected option must be A or B';
  END IF;

  INSERT INTO public.votes (
    user_id,
    question_id,
    selected_option,
    response_time_ms
  )
  VALUES (
    auth.uid(),
    p_question_id,
    p_selected_option,
    p_response_time_ms
  )
  RETURNING * INTO inserted_vote;

  UPDATE public.questions
  SET
    vote_count_a = vote_count_a + CASE WHEN p_selected_option = 'A' THEN 1 ELSE 0 END,
    vote_count_b = vote_count_b + CASE WHEN p_selected_option = 'B' THEN 1 ELSE 0 END,
    total_votes = total_votes + 1,
    updated_at = now()
  WHERE id = p_question_id;

  UPDATE public.profiles
  SET
    total_participation_count = total_participation_count + 1,
    today_participation_count = today_participation_count + 1,
    shell_balance = shell_balance + 1,
    updated_at = now()
  WHERE id = auth.uid();

  FOR trait_record IN
    SELECT trait_key, weight
    FROM public.question_traits
    WHERE question_id = p_question_id
      AND option_side = p_selected_option
  LOOP
    INSERT INTO public.user_traits (user_id, trait_key, score)
    VALUES (auth.uid(), trait_record.trait_key, trait_record.weight)
    ON CONFLICT (user_id, trait_key)
    DO UPDATE SET
      score = public.user_traits.score + EXCLUDED.score,
      updated_at = now();
  END LOOP;

  RETURN inserted_vote;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_reaction(
  p_question_id uuid,
  p_reaction_type text
)
RETURNS public.question_reactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_reaction public.question_reactions;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_reaction_type NOT IN ('like', 'fun', 'hard') THEN
    RAISE EXCEPTION 'reaction type must be like, fun, or hard';
  END IF;

  INSERT INTO public.question_reactions (
    user_id,
    question_id,
    reaction_type
  )
  VALUES (
    auth.uid(),
    p_question_id,
    p_reaction_type
  )
  RETURNING * INTO inserted_reaction;

  UPDATE public.questions
  SET
    reaction_like_count = reaction_like_count + CASE WHEN p_reaction_type = 'like' THEN 1 ELSE 0 END,
    reaction_fun_count = reaction_fun_count + CASE WHEN p_reaction_type = 'fun' THEN 1 ELSE 0 END,
    reaction_hard_count = reaction_hard_count + CASE WHEN p_reaction_type = 'hard' THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = p_question_id;

  RETURN inserted_reaction;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_feed_questions(integer, timestamptz) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_vote(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_reaction(uuid, text) TO authenticated;
