-- 사용자 질문 제출 악용 방어 (L1 하드 중복거부 / L2 사용자별 제출 한도 / L3 반복 위반자 자동 쓰로틀).
-- 공개는 여전히 관리자 승인 게이트(status='pending'→approved). 여기서는 큐 스팸/반복 중복을 막는다.
-- 거부 기록은 RAISE(롤백) 대신 status='rejected' 행으로 남겨 추적 가능하게 한다(공개 안 됨).
-- 비용 0(trgm + 카운트). 멱등.

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
  v_recent_dup_rejections integer;
  v_hour_cap integer;
  v_day_cap integer;
  v_hour_count integer;
  v_day_count integer;
  v_status text;
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

  -- L3: 최근 7일 동안 '거의 동일' 하드 거부 누적 → 반복 위반자면 한도를 크게 줄인다.
  SELECT count(*) INTO v_recent_dup_rejections
  FROM public.questions q
  WHERE q.creator_id = current_user_id
    AND q.status = 'rejected'
    AND 'rejected-duplicate' = ANY(q.tags)
    AND q.created_at > now() - interval '7 days';

  IF v_recent_dup_rejections >= 3 THEN
    v_hour_cap := 2;  v_day_cap := 5;
  ELSE
    v_hour_cap := 10; v_day_cap := 30;
  END IF;

  -- L2: 사용자별 제출 한도(거부 행 포함 → 스팸이 스스로 한도에 걸리게).
  SELECT count(*) INTO v_hour_count
  FROM public.questions q
  WHERE q.creator_id = current_user_id AND q.created_at > now() - interval '1 hour';
  SELECT count(*) INTO v_day_count
  FROM public.questions q
  WHERE q.creator_id = current_user_id AND q.created_at > now() - interval '1 day';

  IF v_hour_count >= v_hour_cap THEN
    RAISE EXCEPTION 'rate-limit: too many submissions this hour';
  END IF;
  IF v_day_count >= v_day_cap THEN
    RAISE EXCEPTION 'rate-limit: too many submissions today';
  END IF;

  INSERT INTO public.profiles (id, nickname)
  VALUES (current_user_id, 'islander_' || substr(current_user_id::text, 1, 6))
  ON CONFLICT (id) DO NOTHING;

  -- 유사도(공개/검수중 질문 대상; 거부 행은 기준에서 제외).
  SELECT max(similarity(public.normalize_question_title(q.title), public.normalize_question_title(normalized_title)))
  INTO v_max_similarity
  FROM public.questions q
  WHERE q.status IN ('approved', 'pending');

  -- L1: 거의 동일(0.92+) → 공개 큐로 보내지 않고 'rejected'로 기록(추적·rate에 반영).
  IF coalesce(v_max_similarity, 0) >= 0.92 THEN
    v_status := 'rejected';
    v_tags := ARRAY[normalized_category_slug, 'user-submitted', 'rejected-duplicate'];
  ELSE
    v_status := 'pending';
    v_tags := ARRAY[normalized_category_slug, 'user-submitted'];
    IF coalesce(v_max_similarity, 0) >= 0.70 THEN
      v_tags := v_tags || 'possible-duplicate';  -- 소프트 플래그(관리자 검수)
    END IF;
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
    v_status, 'private', false, coalesce(p_is_anonymous, false)
  )
  RETURNING * INTO inserted_question;

  RETURN inserted_question;
END;
$function$;

-- 관리자용: 사용자별 제출/중복 남용 요약(서비스 롤 전용).
CREATE OR REPLACE FUNCTION public.get_submission_abuse_summary(
  p_since interval DEFAULT interval '30 days',
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  creator_id uuid,
  total integer,
  pending integer,
  dup_flagged integer,
  dup_rejected integer,
  last_submitted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.creator_id,
    count(*)::int AS total,
    count(*) FILTER (WHERE q.status = 'pending')::int AS pending,
    count(*) FILTER (WHERE 'possible-duplicate' = ANY(q.tags))::int AS dup_flagged,
    count(*) FILTER (WHERE 'rejected-duplicate' = ANY(q.tags))::int AS dup_rejected,
    max(q.created_at) AS last_submitted_at
  FROM public.questions q
  WHERE q.creator_id IS NOT NULL
    AND 'user-submitted' = ANY(q.tags)
    AND q.created_at > now() - p_since
  GROUP BY q.creator_id
  ORDER BY dup_rejected DESC, dup_flagged DESC, total DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 500);
$$;

REVOKE ALL ON FUNCTION public.get_submission_abuse_summary(interval, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_submission_abuse_summary(interval, integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_submission_abuse_summary(interval, integer) FROM authenticated;
-- service_role만 호출(관리자 대시보드/스크립트).
