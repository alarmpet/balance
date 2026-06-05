-- 질문 중복 검증(무료, pg_trgm 트라이그램 유사도).
-- 1) 제목 정규화(공백·구두점 제거, 소문자) 헬퍼
-- 2) find_similar_questions: 기존 approved/pending 중 유사 질문 검색(제출 화면 경고용)
-- 3) submit_user_question: 유사도 높으면 하드 차단 대신 'possible-duplicate' 태그(관리자 검수)
-- OpenAI 불필요. 멱등.

-- pg_trgm은 이미 설치됨(public). 정규화 헬퍼(IMMUTABLE → 표현식 인덱스 가능)
CREATE OR REPLACE FUNCTION public.normalize_question_title(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(lower(coalesce(p, '')), '[[:space:][:punct:]]', '', 'g');
$$;

-- 스케일 대비 트라이그램 GIN 인덱스(현재 460행에선 없어도 무방하나 미리)
CREATE INDEX IF NOT EXISTS idx_questions_title_trgm
  ON public.questions
  USING gin (public.normalize_question_title(title) gin_trgm_ops);

-- 제출 화면에서 "비슷한 질문이 이미 있어요" 경고용. 0~1 유사도.
CREATE OR REPLACE FUNCTION public.find_similar_questions(
  p_title text,
  p_threshold numeric DEFAULT 0.5,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (id uuid, title text, status text, similarity real)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id,
    q.title,
    q.status,
    similarity(public.normalize_question_title(q.title), public.normalize_question_title(p_title)) AS similarity
  FROM public.questions q
  WHERE q.status IN ('approved', 'pending')
    AND public.normalize_question_title(p_title) <> ''
    AND similarity(public.normalize_question_title(q.title), public.normalize_question_title(p_title)) >= GREATEST(p_threshold, 0.1)
  ORDER BY similarity DESC, q.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 20);
$$;

REVOKE ALL ON FUNCTION public.find_similar_questions(text, numeric, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_similar_questions(text, numeric, integer) TO anon, authenticated;

-- submit_user_question: 기존과 동일 + 제출 직전 유사도 검사로 possible-duplicate 소프트 태그.
CREATE OR REPLACE FUNCTION public.submit_user_question(
  p_title text,
  p_option_a_title text,
  p_option_b_title text,
  p_category_slug text DEFAULT 'life',
  p_description text DEFAULT NULL,
  p_is_anonymous boolean DEFAULT false
)
RETURNS public.questions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_user_id uuid;
  normalized_title text;
  normalized_option_a text;
  normalized_option_b text;
  normalized_description text;
  normalized_category_slug text;
  selected_category_id uuid;
  v_max_similarity real;
  v_tags text[];
  inserted_question public.questions;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  normalized_title := trim(coalesce(p_title, ''));
  normalized_option_a := trim(coalesce(p_option_a_title, ''));
  normalized_option_b := trim(coalesce(p_option_b_title, ''));
  normalized_description := nullif(trim(coalesce(p_description, '')), '');
  normalized_category_slug := lower(trim(coalesce(p_category_slug, 'life')));

  IF char_length(normalized_title) < 4 OR char_length(normalized_title) > 160 THEN
    RAISE EXCEPTION 'Question title must be between 4 and 160 characters';
  END IF;
  IF char_length(normalized_option_a) < 1 OR char_length(normalized_option_a) > 80 THEN
    RAISE EXCEPTION 'Option A must be between 1 and 80 characters';
  END IF;
  IF char_length(normalized_option_b) < 1 OR char_length(normalized_option_b) > 80 THEN
    RAISE EXCEPTION 'Option B must be between 1 and 80 characters';
  END IF;
  IF normalized_description IS NOT NULL AND char_length(normalized_description) > 240 THEN
    RAISE EXCEPTION 'Description must be 240 characters or shorter';
  END IF;

  SELECT id INTO selected_category_id
  FROM public.categories WHERE slug = normalized_category_slug;
  IF selected_category_id IS NULL THEN
    RAISE EXCEPTION 'Invalid category slug';
  END IF;

  INSERT INTO public.profiles (id, nickname)
  VALUES (current_user_id, 'islander_' || substr(current_user_id::text, 1, 6))
  ON CONFLICT (id) DO NOTHING;

  -- 중복 검사(무료 trgm): 기존 approved/pending 중 최고 유사도.
  SELECT max(similarity(public.normalize_question_title(q.title), public.normalize_question_title(normalized_title)))
  INTO v_max_similarity
  FROM public.questions q
  WHERE q.status IN ('approved', 'pending');

  -- 0.70 이상이면 하드 차단 대신 'possible-duplicate' 태그(관리자 검수에서 판단).
  v_tags := ARRAY[normalized_category_slug, 'user-submitted'];
  IF coalesce(v_max_similarity, 0) >= 0.70 THEN
    v_tags := v_tags || 'possible-duplicate';
  END IF;

  INSERT INTO public.questions (
    creator_id, title, description, category_id, tags,
    option_a_title, option_a_description, option_a_image_url,
    option_b_title, option_b_description, option_b_image_url,
    status, visibility, is_official, is_anonymous
  )
  VALUES (
    current_user_id, normalized_title, normalized_description, selected_category_id, v_tags,
    normalized_option_a, NULL, 'pending://question-image/a',
    normalized_option_b, NULL, 'pending://question-image/b',
    'pending', 'private', false, coalesce(p_is_anonymous, false)
  )
  RETURNING * INTO inserted_question;

  RETURN inserted_question;
END;
$function$;
