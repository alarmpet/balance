-- Balance question bank monitoring report.
-- Run in Supabase SQL editor or via Supabase CLI.
-- Purpose: watch category coverage, trait balance, axis balance, and pool size.

-- 1) Approved question count by category.
SELECT '1_category_counts' AS report, c.slug AS k, count(*)::text AS v
FROM public.questions q
JOIN public.categories c ON c.id = q.category_id
WHERE q.status = 'approved'
GROUP BY c.slug

UNION ALL

-- 2) Trait option count. Use this to find over/under-covered traits.
SELECT '2_trait_counts', qt.trait_key, count(*)::text
FROM public.question_traits qt
JOIN public.questions q ON q.id = qt.question_id
WHERE q.status = 'approved'
GROUP BY qt.trait_key

UNION ALL

-- 3) Five-axis totals.
SELECT '3_axis_totals', axis, total::text
FROM (
  SELECT
    CASE qt.trait_key
      WHEN 'safe' THEN 'safe_adventure'
      WHEN 'adventure' THEN 'safe_adventure'
      WHEN 'plan' THEN 'plan_flow'
      WHEN 'flow' THEN 'plan_flow'
      WHEN 'solo' THEN 'solo_social'
      WHEN 'social' THEN 'solo_social'
      WHEN 'calm' THEN 'calm_express'
      WHEN 'express' THEN 'calm_express'
      WHEN 'comfort' THEN 'comfort_curious'
      WHEN 'curious' THEN 'comfort_curious'
      ELSE 'other'
    END AS axis,
    count(*) AS total
  FROM public.question_traits qt
  JOIN public.questions q ON q.id = qt.question_id
  WHERE q.status = 'approved'
  GROUP BY 1
) ax

UNION ALL

-- 4) Total approved pool size.
SELECT '4_totals', 'approved_questions', count(*)::text
FROM public.questions
WHERE status = 'approved'

ORDER BY report, v DESC;

-- 5) Optional exhaustion monitor.
-- Use this when p_exclude_answered=true starts emptying the feed for heavy users.
--
-- SELECT
--   v.user_id,
--   count(*) AS answered,
--   (SELECT count(*) FROM public.questions WHERE status='approved') AS pool,
--   round(100.0 * count(*) / NULLIF((SELECT count(*) FROM public.questions WHERE status='approved'), 0), 1) AS pct
-- FROM public.votes v
-- GROUP BY v.user_id
-- ORDER BY answered DESC
-- LIMIT 20;
