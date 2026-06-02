-- Personality insight map foundation.
-- Apply after 202606020200_personality_pet_theme_economy.sql.

CREATE TABLE IF NOT EXISTS public.user_insight_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  insight_key text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  primary_trait_key text,
  secondary_trait_key text,
  category_slug text,
  confidence numeric DEFAULT 0 NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_insight UNIQUE (user_id, insight_key)
);

ALTER TABLE public.user_insight_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_insight_cards_select_own" ON public.user_insight_cards;
CREATE POLICY "user_insight_cards_select_own"
ON public.user_insight_cards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_user_insight_cards_updated_at ON public.user_insight_cards;
CREATE TRIGGER set_user_insight_cards_updated_at
BEFORE UPDATE ON public.user_insight_cards
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_user_insight_cards_user_id
ON public.user_insight_cards(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_votes_user_created_at
ON public.votes(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_traits_question_option_trait
ON public.question_traits(question_id, option_side, trait_key);

CREATE INDEX IF NOT EXISTS idx_user_traits_user_trait
ON public.user_traits(user_id, trait_key);

CREATE OR REPLACE FUNCTION public.mark_insight_card_read(p_insight_id uuid)
RETURNS public.user_insight_cards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_card public.user_insight_cards;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.user_insight_cards
  SET is_read = true, updated_at = now()
  WHERE id = p_insight_id
    AND user_id = auth.uid()
  RETURNING * INTO updated_card;

  IF updated_card.id IS NULL THEN
    RAISE EXCEPTION 'insight card not found';
  END IF;

  RETURN updated_card;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_user_insight_cards()
RETURNS SETOF public.user_insight_cards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  primary_trait text;
  secondary_trait text;
  primary_score numeric;
  secondary_score numeric;
  top_category_slug text;
  top_category_name text;
  evidence_payload jsonb;
  insight_title text;
  insight_body text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT trait_key, score
  INTO primary_trait, primary_score
  FROM public.user_traits
  WHERE user_id = auth.uid()
  ORDER BY score DESC, trait_key ASC
  LIMIT 1;

  SELECT trait_key, score
  INTO secondary_trait, secondary_score
  FROM public.user_traits
  WHERE user_id = auth.uid()
    AND trait_key <> COALESCE(primary_trait, '')
  ORDER BY score DESC, trait_key ASC
  LIMIT 1;

  SELECT c.slug, c.name
  INTO top_category_slug, top_category_name
  FROM public.votes v
  JOIN public.questions q ON q.id = v.question_id
  LEFT JOIN public.categories c ON c.id = q.category_id
  WHERE v.user_id = auth.uid()
    AND v.created_at >= now() - interval '30 days'
  GROUP BY c.slug, c.name
  ORDER BY count(*) DESC, c.name ASC NULLS LAST
  LIMIT 1;

  SELECT jsonb_build_object(
    'recent_question_ids',
    COALESCE(jsonb_agg(question_id ORDER BY created_at DESC), '[]'::jsonb),
    'primary_score',
    COALESCE(primary_score, 0),
    'secondary_score',
    COALESCE(secondary_score, 0)
  )
  INTO evidence_payload
  FROM (
    SELECT v.question_id, v.created_at
    FROM public.votes v
    WHERE v.user_id = auth.uid()
    ORDER BY v.created_at DESC
    LIMIT 3
  ) recent_votes;

  insight_title := CASE
    WHEN primary_trait IS NULL THEN '아직 성향 지도가 새싹 단계예요'
    WHEN secondary_trait IS NULL THEN primary_trait || ' 성향이 먼저 반짝이고 있어요'
    ELSE primary_trait || '와 ' || secondary_trait || ' 성향이 함께 자라고 있어요'
  END;

  insight_body := CASE
    WHEN primary_trait IS NULL THEN '밸런스 질문을 몇 개만 더 풀면 선택의 가지가 섬 지도처럼 이어지기 시작해요.'
    WHEN top_category_name IS NULL THEN '최근 선택에서 ' || primary_trait || ' 흐름이 또렷하게 보이고 있어요.'
    ELSE '최근 ' || top_category_name || ' 선택에서 ' || primary_trait || ' 흐름이 또렷하게 보이고 있어요.'
  END;

  INSERT INTO public.user_insight_cards (
    user_id,
    insight_key,
    title,
    body,
    primary_trait_key,
    secondary_trait_key,
    category_slug,
    confidence,
    evidence,
    is_read
  )
  VALUES (
    auth.uid(),
    'daily_trait_summary:' || to_char((now() AT TIME ZONE 'Asia/Seoul')::date, 'YYYYMMDD'),
    insight_title,
    insight_body,
    primary_trait,
    secondary_trait,
    top_category_slug,
    CASE WHEN primary_trait IS NULL THEN 0.2 ELSE 0.72 END,
    evidence_payload,
    false
  )
  ON CONFLICT (user_id, insight_key)
  DO UPDATE SET
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    primary_trait_key = EXCLUDED.primary_trait_key,
    secondary_trait_key = EXCLUDED.secondary_trait_key,
    category_slug = EXCLUDED.category_slug,
    confidence = EXCLUDED.confidence,
    evidence = EXCLUDED.evidence,
    updated_at = now();

  RETURN QUERY
  SELECT *
  FROM public.user_insight_cards
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 10;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_personality_insight_graph(
  p_focus_node_id text DEFAULT NULL,
  p_depth integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  graph_payload jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  WITH params AS (
    SELECT
      auth.uid() AS user_id,
      LEAST(GREATEST(COALESCE(p_depth, 1), 1), 2) AS depth,
      NULLIF(btrim(COALESCE(p_focus_node_id, '')), '') AS focus_node_id
  ),
  top_traits AS (
    SELECT
      ut.trait_key,
      ut.score,
      max(ut.score) OVER () AS max_score,
      row_number() OVER (ORDER BY ut.score DESC, ut.trait_key ASC) AS rank
    FROM public.user_traits ut
    JOIN params p ON p.user_id = ut.user_id
    ORDER BY ut.score DESC, ut.trait_key ASC
    LIMIT 10
  ),
  recent_votes AS (
    SELECT
      v.question_id,
      v.selected_option,
      v.created_at,
      q.title,
      q.category_id,
      c.slug AS category_slug,
      c.name AS category_name
    FROM public.votes v
    JOIN params p ON p.user_id = v.user_id
    JOIN public.questions q ON q.id = v.question_id
    LEFT JOIN public.categories c ON c.id = q.category_id
    WHERE v.created_at >= now() - interval '30 days'
    ORDER BY v.created_at DESC
    LIMIT 200
  ),
  category_counts AS (
    SELECT
      COALESCE(category_slug, 'uncategorized') AS category_slug,
      COALESCE(category_name, '미분류') AS category_name,
      count(*)::numeric AS vote_count,
      (max(count(*)) OVER ())::numeric AS max_vote_count
    FROM recent_votes
    GROUP BY category_slug, category_name
    ORDER BY count(*) DESC, category_name ASC
    LIMIT 8
  ),
  representative_questions AS (
    SELECT DISTINCT ON (rv.question_id)
      rv.question_id,
      rv.title,
      COALESCE(rv.category_slug, 'uncategorized') AS category_slug,
      rv.created_at
    FROM recent_votes rv
    ORDER BY rv.question_id, rv.created_at DESC
    LIMIT 3
  ),
  pet_row AS (
    SELECT ps.display_name
    FROM public.user_pet_state ups
    JOIN public.pet_species ps ON ps.id = ups.species_id
    JOIN params p ON p.user_id = ups.user_id
    LIMIT 1
  ),
  nodes AS (
    SELECT jsonb_build_object(
      'id', 'pet:self',
      'kind', 'pet',
      'label', COALESCE((SELECT display_name FROM pet_row), '성향 펫'),
      'size', 44,
      'color', '#38bdf8',
      'score', 1,
      'meta', '{}'::jsonb
    ) AS node, 0 AS sort_order
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'trait:' || trait_key,
      'kind', 'trait',
      'label', trait_key,
      'size', 18 + LEAST(28, ROUND((score / NULLIF(max_score, 0)) * 28)),
      'color', '#0ea5e9',
      'score', score,
      'meta', jsonb_build_object('rank', rank)
    ), 10 + rank
    FROM top_traits
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'category:' || category_slug,
      'kind', 'category',
      'label', category_name,
      'size', 18 + LEAST(22, ROUND((vote_count / NULLIF(max_vote_count, 0)) * 22)),
      'color', '#f59e0b',
      'score', vote_count,
      'meta', jsonb_build_object('slug', category_slug)
    ), 40 + row_number() OVER (ORDER BY vote_count DESC, category_name ASC)
    FROM category_counts
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'question:' || question_id::text,
      'kind', 'question',
      'label', title,
      'size', 18,
      'color', '#a78bfa',
      'score', 1,
      'meta', jsonb_build_object('category_slug', category_slug)
    ), 70 + row_number() OVER (ORDER BY created_at DESC)
    FROM representative_questions
  ),
  limited_nodes AS (
    SELECT node
    FROM nodes
    ORDER BY sort_order
    LIMIT 40
  ),
  edges AS (
    SELECT jsonb_build_object(
      'id', 'edge:pet:self->trait:' || trait_key,
      'source', 'pet:self',
      'target', 'trait:' || trait_key,
      'kind', 'trait_score',
      'weight', COALESCE(score / NULLIF(max_score, 0), 0),
      'label', '성향 점수'
    ) AS edge
    FROM top_traits
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'edge:pet:self->category:' || category_slug,
      'source', 'pet:self',
      'target', 'category:' || category_slug,
      'kind', 'category_affinity',
      'weight', COALESCE(vote_count / NULLIF(max_vote_count, 0), 0),
      'label', '최근 선택'
    )
    FROM category_counts
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'edge:category:' || category_slug || '->question:' || question_id::text,
      'source', 'category:' || category_slug,
      'target', 'question:' || question_id::text,
      'kind', 'question_evidence',
      'weight', 0.65,
      'label', '근거 질문'
    )
    FROM representative_questions
  ),
  summary AS (
    SELECT jsonb_build_object(
      'title',
      CASE
        WHEN (SELECT count(*) FROM top_traits) = 0 THEN '아직 선택 지도가 새싹 단계예요'
        ELSE (SELECT trait_key FROM top_traits ORDER BY rank LIMIT 1) || ' 성향이 가장 크게 자라고 있어요'
      END,
      'body',
      CASE
        WHEN (SELECT count(*) FROM recent_votes) = 0 THEN '질문을 풀수록 선택이 성향과 카테고리 가지로 연결됩니다.'
        ELSE '최근 30일의 선택을 바탕으로 상위 성향과 관심 카테고리를 연결했어요.'
      END,
      'completion',
      LEAST(1, ((SELECT count(*) FROM recent_votes)::numeric / 30))
    ) AS summary_json
  )
  SELECT jsonb_build_object(
    'nodes', COALESCE((SELECT jsonb_agg(node) FROM limited_nodes), '[]'::jsonb),
    'edges', COALESCE((SELECT jsonb_agg(edge) FROM edges), '[]'::jsonb),
    'summary', (SELECT summary_json FROM summary),
    'meta', jsonb_build_object(
      'focus_node_id', (SELECT focus_node_id FROM params),
      'depth', (SELECT depth FROM params),
      'node_limit', 40,
      'window_days', 30
    )
  )
  INTO graph_payload;

  RETURN graph_payload;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_insight_card_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_user_insight_cards() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_personality_insight_graph(text, integer) TO authenticated;
