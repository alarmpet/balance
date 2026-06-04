-- Add explicit labels for the fifth axis: comfort <-> curious.
-- The function body mirrors the previous implementation except for the
-- trait labels used in insight-map contradiction cards.

CREATE OR REPLACE FUNCTION public.compute_user_trait_contradictions(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
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
        WHEN 'comfort' THEN '익숙함'
        WHEN 'curious' THEN '호기심'
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
          '%s에서는 %s 성향이 강하게 나타나지만 %s에서는 덜 드러나요. 일관성이 없는 게 아니라, 상황에 맞게 다른 모습을 가진다는 뜻이에요.',
          high_category, trait_label, low_category
        )
      )
    ),
    '[]'::jsonb
  )
  FROM ranked
  WHERE rn <= 2;
$function$;
