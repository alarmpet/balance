-- "친구가 보는 내 섬" — 친구가 나를 어느 섬으로 보는지 4축 추측을 모은다(초대 루프 + 바넘효과 방어).
-- 추측은 로그인 사용자만(스팸/익명 남용 방지). 본인만 집계 결과 조회(프라이버시). 멱등.

CREATE TABLE IF NOT EXISTS public.island_friend_guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  guess_social boolean NOT NULL,
  guess_curious boolean NOT NULL,
  guess_express boolean NOT NULL,
  guess_flow boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT island_friend_guesses_unique UNIQUE (target_user_id, voter_id)
);

ALTER TABLE public.island_friend_guesses ENABLE ROW LEVEL SECURITY;
-- 직접 접근 차단(정의자 RPC로만).
REVOKE ALL ON public.island_friend_guesses FROM anon, authenticated;

-- 친구가 추측 제출(업서트). 본인 추측 금지.
CREATE OR REPLACE FUNCTION public.submit_island_friend_guess(
  p_target uuid,
  p_social boolean,
  p_curious boolean,
  p_express boolean,
  p_flow boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voter uuid := auth.uid();
BEGIN
  IF v_voter IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF v_voter = p_target THEN
    RAISE EXCEPTION 'cannot guess yourself';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target) THEN
    RAISE EXCEPTION 'target not found';
  END IF;

  INSERT INTO public.island_friend_guesses (target_user_id, voter_id, guess_social, guess_curious, guess_express, guess_flow)
  VALUES (p_target, v_voter, p_social, p_curious, p_express, p_flow)
  ON CONFLICT (target_user_id, voter_id) DO UPDATE SET
    guess_social = EXCLUDED.guess_social,
    guess_curious = EXCLUDED.guess_curious,
    guess_express = EXCLUDED.guess_express,
    guess_flow = EXCLUDED.guess_flow,
    created_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_island_friend_guess(uuid, boolean, boolean, boolean, boolean) TO authenticated;

-- 본인이 "친구가 본 나" 집계 조회(축별 비율 + 다수결 섬).
CREATE OR REPLACE FUNCTION public.get_friends_island_view(p_target uuid DEFAULT auth.uid())
RETURNS TABLE (
  responses integer,
  social_pct integer, curious_pct integer, express_pct integer, flow_pct integer,
  guessed_code text, guessed_name text, guessed_emoji text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH g AS (
    SELECT * FROM public.island_friend_guesses
    WHERE target_user_id = p_target
      AND p_target = auth.uid()  -- 본인만 조회(프라이버시)
  ),
  agg AS (
    SELECT
      count(*)::int AS n,
      round(100.0 * avg(CASE WHEN guess_social THEN 1 ELSE 0 END))::int AS social_pct,
      round(100.0 * avg(CASE WHEN guess_curious THEN 1 ELSE 0 END))::int AS curious_pct,
      round(100.0 * avg(CASE WHEN guess_express THEN 1 ELSE 0 END))::int AS express_pct,
      round(100.0 * avg(CASE WHEN guess_flow THEN 1 ELSE 0 END))::int AS flow_pct
    FROM g
  )
  SELECT
    agg.n, agg.social_pct, agg.curious_pct, agg.express_pct, agg.flow_pct,
    it.code, it.name, it.emoji
  FROM agg
  LEFT JOIN public.island_types it
    ON it.a1_social = (agg.social_pct >= 50)
   AND it.a2_curious = (agg.curious_pct >= 50)
   AND it.a3_express = (agg.express_pct >= 50)
   AND it.a4_flow = (agg.flow_pct >= 50)
  WHERE agg.n > 0;
$$;

GRANT EXECUTE ON FUNCTION public.get_friends_island_view(uuid) TO authenticated;
