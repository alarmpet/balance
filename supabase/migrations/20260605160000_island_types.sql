-- 섬 타입 정체성 시스템 D1+D2 (island-type-identity-plan).
-- 4 정체성 축(solo/social · comfort/curious · calm/express · plan/flow) → 16 섬, 4 군도로 묶음.
-- 5번째 축(safe/adventure)은 "항해 스타일" 수식어(정박형/원정형).
-- compute_user_island_type: user_traits(집계 점수)에서 축별 우세극 → 16섬 매칭 + 신뢰도.
-- 멱등.

CREATE TABLE IF NOT EXISTS public.island_types (
  code text PRIMARY KEY,                 -- 내부 코드(E/I·N/S·X/C·P/J). 사용자엔 이름 노출.
  name text NOT NULL,
  emoji text NOT NULL,
  archipelago text NOT NULL,
  archipelago_emoji text NOT NULL,
  tagline text NOT NULL,                  -- 한 줄 정체성(공유 카드용)
  persona text,                           -- 짧은 페르소나
  a1_social boolean NOT NULL,             -- 함께(true)/혼자(false)
  a2_curious boolean NOT NULL,            -- 새로움(true)/익숙함(false)
  a3_express boolean NOT NULL,            -- 표현(true)/담담(false)
  a4_flow boolean NOT NULL,               -- 즉흥(true)/계획(false)
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT island_types_axes_unique UNIQUE (a1_social, a2_curious, a3_express, a4_flow)
);

ALTER TABLE public.island_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS island_types_public_read ON public.island_types;
CREATE POLICY island_types_public_read ON public.island_types FOR SELECT USING (true);

INSERT INTO public.island_types (code, name, emoji, archipelago, archipelago_emoji, tagline, persona, a1_social, a2_curious, a3_express, a4_flow, sort_order) VALUES
-- 🗼 등대 군도 (혼자·익숙함)
('ISCJ','등대의 섬','🗼','등대 군도','🗼','묵묵히 제자리를 지키는 변함없는 사람','조용하고 한결같이 곁을 지킨다.', false,false,false,false,11),
('ISCP','잔잔호수의 섬','🛶','등대 군도','🗼','혼자 유유히 흘러가는 사람','서두르지 않고 내 리듬대로 산다.', false,false,false,true,12),
('ISXJ','서재의 섬','🕯️','등대 군도','🗼','조용하지만 취향은 또렷한 사람','말수는 적어도 자기 세계가 분명하다.', false,false,true,false,13),
('ISXP','헤드폰의 섬','🎧','등대 군도','🗼','내 세계에 빠져 자유롭게 노는 사람','혼자만의 몰입을 가장 좋아한다.', false,false,true,true,14),
-- 🔭 탐구 군도 (혼자·새로움)
('INCJ','천문대의 섬','🔭','탐구 군도','🔭','혼자 끝까지 파고드는 분석가','새로운 걸 차분히 깊게 탐구한다.', false,true,false,false,21),
('INCP','표류자의 섬','🧭','탐구 군도','🔭','정처 없이 새것을 발견하는 사람','계획 없이 떠돌며 발견을 즐긴다.', false,true,false,true,22),
('INXJ','실험실의 섬','⚗️','탐구 군도','🔭','혼자 설계하고 결과로 말하는 사람','아이디어를 직접 실험해 증명한다.', false,true,true,false,23),
('INXP','아틀리에의 섬','🎨','탐구 군도','🔭','혼자 만들며 새 영감을 좇는 사람','자유롭게 창작하고 실험한다.', false,true,true,true,24),
-- 🏡 광장 군도 (함께·익숙함)
('ESCJ','마을회관의 섬','🏡','광장 군도','🏡','사람들을 차분히 챙기고 모으는 구심점','믿음직하게 무리를 돌본다.', true,false,false,false,31),
('ESCP','사랑방의 섬','☕','광장 군도','🏡','편하게 사람들과 어울리는 사람','익숙한 사람들과의 시간이 제일 편하다.', true,false,false,true,32),
('ESXJ','반장의 섬','📣','광장 군도','🏡','사람들을 이끌고 챙기는 든든한 리더','앞장서서 무리를 정리하고 이끈다.', true,false,true,false,33),
('ESXP','단골집의 섬','🍻','광장 군도','🏡','분위기를 띄우는 정 많은 사람','어디서든 분위기 메이커가 된다.', true,false,true,true,34),
-- 🎡 축제 군도 (함께·새로움)
('ENCJ','기획자의 섬','🎪','축제 군도','🎡','새 판을 차분히 설계해 사람을 모으는 사람','새로운 판을 기획하고 사람을 부른다.', true,true,false,false,41),
('ENCP','바람연의 섬','🪁','축제 군도','🎡','사람들과 새것을 가볍게 즐기는 사람','부담 없이 새로움을 함께 즐긴다.', true,true,false,true,42),
('ENXJ','개척단의 섬','🚀','축제 군도','🎡','사람들을 이끌고 새 도전에 뛰어드는 사람','무리를 이끌고 미지로 돌진한다.', true,true,true,false,43),
('ENXP','축제의 섬','🎡','축제 군도','🎡','처음 보는 사람과도 30분이면 친구','새로움과 사람을 동시에 사랑한다.', true,true,true,true,44)
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name, emoji=EXCLUDED.emoji, archipelago=EXCLUDED.archipelago, archipelago_emoji=EXCLUDED.archipelago_emoji,
  tagline=EXCLUDED.tagline, persona=EXCLUDED.persona, sort_order=EXCLUDED.sort_order;

-- 산출 RPC: user_traits 집계 점수에서 축별 우세극 → 16섬 + 항해 수식어 + 신뢰도.
CREATE OR REPLACE FUNCTION public.compute_user_island_type(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  code text, name text, emoji text, archipelago text, archipelago_emoji text,
  tagline text, persona text, voyage text,
  is_social boolean, is_curious boolean, is_express boolean, is_flow boolean,
  confidence numeric, answered_weight numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH sc AS (
    SELECT
      coalesce(max(score) FILTER (WHERE trait_key='social'), 0) AS social,
      coalesce(max(score) FILTER (WHERE trait_key='solo'), 0) AS solo,
      coalesce(max(score) FILTER (WHERE trait_key='curious'), 0) AS curious,
      coalesce(max(score) FILTER (WHERE trait_key='comfort'), 0) AS comfort,
      coalesce(max(score) FILTER (WHERE trait_key='express'), 0) AS express,
      coalesce(max(score) FILTER (WHERE trait_key='calm'), 0) AS calm,
      coalesce(max(score) FILTER (WHERE trait_key='flow'), 0) AS flow,
      coalesce(max(score) FILTER (WHERE trait_key='plan'), 0) AS plan,
      coalesce(max(score) FILTER (WHERE trait_key='adventure'), 0) AS adventure,
      coalesce(max(score) FILTER (WHERE trait_key='safe'), 0) AS safe
    FROM public.user_traits WHERE user_id = p_user_id
  ),
  pick AS (
    SELECT
      (social >= solo) AS is_social,
      (curious >= comfort) AS is_curious,
      (express >= calm) AS is_express,
      (flow >= plan) AS is_flow,
      (adventure > safe) AS is_adventurous,
      (social+solo+curious+comfort+express+calm+flow+plan+adventure+safe) AS total
    FROM sc
  )
  SELECT
    it.code, it.name, it.emoji, it.archipelago, it.archipelago_emoji,
    it.tagline, it.persona,
    CASE WHEN pick.is_adventurous THEN '원정형' ELSE '정박형' END AS voyage,
    pick.is_social, pick.is_curious, pick.is_express, pick.is_flow,
    LEAST(1.0, round((pick.total / 30.0)::numeric, 2)) AS confidence,
    round(pick.total::numeric, 1) AS answered_weight
  FROM pick
  JOIN public.island_types it
    ON it.a1_social = pick.is_social
   AND it.a2_curious = pick.is_curious
   AND it.a3_express = pick.is_express
   AND it.a4_flow = pick.is_flow;
$$;

GRANT EXECUTE ON FUNCTION public.compute_user_island_type(uuid) TO anon, authenticated;
