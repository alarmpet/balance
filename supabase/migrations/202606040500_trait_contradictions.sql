-- 모순 발견(상황별 다른 나): 카테고리별로 같은 성향 축이 다르게 나타나는 경우를 계산한다.
-- Apply after 202606040400_schema_migration_tracking.sql.
--
-- ⚠️ 라이브 적용 전 검토 권장: 이 함수는 로컬에서 라이브 DB 대조 없이 작성되었습니다.
-- 적용 후 실제 데이터로 결과(퍼센트/표본/문구)를 한 번 검증하세요.
--
-- 결과 JSON 배열은 클라이언트 InsightContradiction 타입과 1:1로 맞춥니다:
--   { id, trait_label, high_category, high_percent, low_category, low_percent, message }
--
-- 연결 방법(둘 중 하나):
--   (A) get_personality_insight_graph 반환 jsonb에 키 추가:
--         ... || jsonb_build_object('contradictions',
--                public.compute_user_trait_contradictions(v_user_id))
--   (B) 클라이언트에서 별도 RPC로 호출 후 snapshot.contradictions에 주입.

CREATE OR REPLACE FUNCTION public.compute_user_trait_contradictions(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH answered AS (
    SELECT
      q.id AS question_id,
      c.name AS category_name,
      qt.trait_key,
      qt.option_side,
      qt.weight,
      v.selected_option
    FROM public.votes v
    JOIN public.questions q ON q.id = v.question_id
    JOIN public.categories c ON c.id = q.category_id
    JOIN public.question_traits qt ON qt.question_id = q.id
    WHERE v.user_id = p_user_id
  ),
  cat_trait AS (
    SELECT
      category_name,
      trait_key,
      count(DISTINCT question_id) AS sample,
      sum(weight) AS total_weight,
      sum(CASE WHEN option_side = selected_option THEN weight ELSE 0 END) AS aligned_weight
    FROM answered
    GROUP BY category_name, trait_key
  ),
  pct AS (
    SELECT
      category_name,
      trait_key,
      round(100.0 * aligned_weight / NULLIF(total_weight, 0))::int AS percent,
      sample
    FROM cat_trait
    -- 표본이 충분한 경우만(카테고리당 최소 3문항) 비교한다.
    WHERE total_weight > 0 AND sample >= 3
  ),
  pairs AS (
    SELECT
      hi.trait_key,
      hi.category_name AS high_category,
      hi.percent AS high_percent,
      lo.category_name AS low_category,
      lo.percent AS low_percent,
      (hi.percent - lo.percent) AS gap
    FROM pct hi
    JOIN pct lo
      ON lo.trait_key = hi.trait_key
     AND lo.category_name <> hi.category_name
    -- 의미 있는 격차(35p 이상)만 모순으로 본다.
    WHERE hi.percent - lo.percent >= 35
  ),
  ranked AS (
    SELECT *,
      CASE trait_key
        WHEN 'express' THEN '표현'
        WHEN 'calm' THEN '차분'
        WHEN 'safe' THEN '안정'
        WHEN 'adventure' THEN '모험'
        WHEN 'plan' THEN '계획'
        WHEN 'flow' THEN '즉흥'
        WHEN 'solo' THEN '혼자'
        WHEN 'social' THEN '함께'
        WHEN 'comfort' THEN '취향'
        ELSE initcap(trait_key)
      END AS trait_label,
      row_number() OVER (ORDER BY gap DESC) AS rn
    FROM pairs
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', 'contradiction:' || trait_key || ':' || high_category || ':' || low_category,
        'trait_label', trait_label,
        'high_category', high_category,
        'high_percent', high_percent,
        'low_category', low_category,
        'low_percent', low_percent,
        'message', format(
          '%s에서는 %s 성향이 강하게 나타나지만 %s에서는 덜 드러나요. 일관성이 없는 게 아니라, 상황에 맞게 다른 모습을 가진 풍부한 당신이에요.',
          high_category, trait_label, low_category
        )
      )
    ),
    '[]'::jsonb
  )
  FROM ranked
  WHERE rn <= 2;
$$;

REVOKE ALL ON FUNCTION public.compute_user_trait_contradictions(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.compute_user_trait_contradictions(uuid) TO authenticated;

INSERT INTO public.schema_migrations (version, name)
VALUES ('202606040500', 'trait_contradictions')
ON CONFLICT (version) DO NOTHING;
