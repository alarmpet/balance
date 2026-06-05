-- 섬 궁합 = "관계 사용설명서"(island-type-identity-plan P1).
-- 256쌍을 손으로 쓰지 않고: 4축 상태(both_low/both_high/mixed) × 맥락(romance/friend/work)별
-- 관계 카피 36줄을 큐레이션 + 축 일치 기반 점수 자동 산출. 낙인 금지(도전 항로 톤).
-- 멱등.

CREATE TABLE IF NOT EXISTS public.island_compat_line (
  axis text NOT NULL,        -- social | curious | express | flow (각 축의 high극 이름)
  state text NOT NULL,       -- both_low | both_high | mixed
  context text NOT NULL,     -- romance | friend | work
  line text NOT NULL,
  PRIMARY KEY (axis, state, context)
);
ALTER TABLE public.island_compat_line ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS island_compat_line_read ON public.island_compat_line;
CREATE POLICY island_compat_line_read ON public.island_compat_line FOR SELECT USING (true);

INSERT INTO public.island_compat_line (axis, state, context, line) VALUES
-- social (혼자↔함께)
('social','both_low','romance','둘 다 혼자만의 시간이 필요한 걸 알아줘서 편안한 사이예요.'),
('social','both_low','friend','자주 안 봐도 어색하지 않은, 각자 충전하고 만나는 친구.'),
('social','both_low','work','각자 몰입해 일하고 필요할 때만 모이는 효율형 조합.'),
('social','both_high','romance','함께 있을 때 에너지가 차오르는, 늘 붙어 다니는 커플.'),
('social','both_high','friend','약속이 끊이지 않는, 같이 놀수록 신나는 친구.'),
('social','both_high','work','분위기를 같이 띄우는, 협업이 즐거운 조합.'),
('social','mixed','romance','한 명은 함께, 한 명은 혼자 충전 — 각자의 시간을 존중하면 오래 가요.'),
('social','mixed','friend','에너지 방향이 달라요. 만남 빈도만 맞추면 서로에게 쉼이 돼요.'),
('social','mixed','work','혼자/함께 선호가 달라요. 집중 시간과 회의 시간을 나누면 좋아요.'),
-- curious (익숙함↔새로움)
('curious','both_low','romance','검증된 데이트를 함께 즐기는, 안정적이고 편안한 사이.'),
('curious','both_low','friend','늘 가던 곳에서 편하게 노는, 익숙함이 좋은 친구.'),
('curious','both_low','work','검증된 방식으로 안정적으로 굴러가는 조합.'),
('curious','both_high','romance','늘 새로운 걸 같이 시도하는, 지루할 틈 없는 커플.'),
('curious','both_high','friend','새 맛집·새 취미를 같이 뚫는 탐험 메이트.'),
('curious','both_high','work','아이디어가 끊이지 않는, 실험이 즐거운 조합.'),
('curious','mixed','romance','한 명은 익숙함, 한 명은 새로움 — 번갈아 정하면 둘 다 만족해요.'),
('curious','mixed','friend','취향 폭이 달라서 서로의 세계를 넓혀주는 친구.'),
('curious','mixed','work','안정 vs 도전 선호가 달라요. 역할을 나누면 균형이 좋아요.'),
-- express (담담↔표현)
('express','both_low','romance','조용히 통하는 사이. 말 안 해도 아는 편안함이 있어요.'),
('express','both_low','friend','시끌벅적하지 않아도 깊게 통하는 친구.'),
('express','both_low','work','감정 동요 없이 차분히 굴러가는 조합.'),
('express','both_high','romance','감정을 솔직히 나눠 오해가 적은, 표현 풍부한 커플.'),
('express','both_high','friend','리액션이 잘 통하는, 같이 있으면 신나는 친구.'),
('express','both_high','work','피드백이 활발한, 소통이 빠른 조합.'),
('express','mixed','romance','한 명은 담담, 한 명은 표현형 — 먼저 말 꺼내주면 풀려요(싸울 때 바로 답 안 하면 더 불안해하는 쪽이 있어요).'),
('express','mixed','friend','표현 온도가 달라요. 담담한 쪽의 침묵을 오해하지 않으면 편해요.'),
('express','mixed','work','표현 방식이 달라요. 의견은 분명히, 톤은 부드럽게 맞추면 좋아요.'),
-- flow (계획↔즉흥)
('flow','both_low','romance','미리 짜둔 데이트로 척척, 어긋남이 적은 커플.'),
('flow','both_low','friend','약속이 칼 같은, 믿음직한 친구.'),
('flow','both_low','work','마감과 일정이 안정적인, 든든한 조합.'),
('flow','both_high','romance','그때그때 떠나는, 자유롭고 설레는 커플.'),
('flow','both_high','friend','갑자기 번개 쳐도 바로 나오는 친구.'),
('flow','both_high','work','변화에 빠르게 대응하는 유연한 조합(단, 마감 관리는 한 번 더 챙기기).'),
('flow','mixed','romance','한 명은 계획, 한 명은 즉흥 — 큰 틀은 계획, 디테일은 즉흥으로 나누면 좋아요.'),
('flow','mixed','friend','리듬이 달라요. 약속 시간만 합의하면 서로 보완돼요.'),
('flow','mixed','work','계획 vs 즉흥이 달라요. 한 명이 일정, 한 명이 임기응변을 맡으면 강해요.')
ON CONFLICT (axis, state, context) DO UPDATE SET line = EXCLUDED.line;

-- 두 섬의 4축 상태 + 맥락별 점수/카피를 jsonb로 산출.
CREATE OR REPLACE FUNCTION public.compute_island_compat(p_code_a text, p_code_b text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.island_types;
  b public.island_types;
  st_social text; st_curious text; st_express text; st_flow text;
  m_social boolean; m_curious boolean; m_express boolean; m_flow boolean;
  result jsonb;
BEGIN
  SELECT * INTO a FROM public.island_types WHERE code = p_code_a;
  SELECT * INTO b FROM public.island_types WHERE code = p_code_b;
  IF a.code IS NULL OR b.code IS NULL THEN RETURN NULL; END IF;

  m_social := (a.a1_social = b.a1_social);
  m_curious := (a.a2_curious = b.a2_curious);
  m_express := (a.a3_express = b.a3_express);
  m_flow := (a.a4_flow = b.a4_flow);
  st_social := CASE WHEN NOT m_social THEN 'mixed' WHEN a.a1_social THEN 'both_high' ELSE 'both_low' END;
  st_curious := CASE WHEN NOT m_curious THEN 'mixed' WHEN a.a2_curious THEN 'both_high' ELSE 'both_low' END;
  st_express := CASE WHEN NOT m_express THEN 'mixed' WHEN a.a3_express THEN 'both_high' ELSE 'both_low' END;
  st_flow := CASE WHEN NOT m_flow THEN 'mixed' WHEN a.a4_flow THEN 'both_high' ELSE 'both_low' END;

  WITH axes(axis, state, social_key, friend_key, work_key) AS (
    VALUES
      ('social', st_social, true,  true,  false),
      ('curious', st_curious, false, true,  true),
      ('express', st_express, true,  false, false),
      ('flow', st_flow, false, false, true)
  ),
  -- 맥락별 점수: 40 + 일치축 12점(키축이면 +6). 0~100.
  scores AS (
    SELECT
      40 + sum(CASE WHEN state <> 'mixed' THEN 12 + (CASE WHEN social_key THEN 6 ELSE 0 END) ELSE 0 END) AS romance,
      40 + sum(CASE WHEN state <> 'mixed' THEN 12 + (CASE WHEN friend_key THEN 6 ELSE 0 END) ELSE 0 END) AS friend,
      40 + sum(CASE WHEN state <> 'mixed' THEN 12 + (CASE WHEN work_key THEN 6 ELSE 0 END) ELSE 0 END) AS work
    FROM axes
  ),
  lines AS (
    SELECT ax.axis, ax.state, l.context, l.line, (ax.state <> 'mixed') AS harmony
    FROM axes ax
    JOIN public.island_compat_line l ON l.axis = ax.axis AND l.state = ax.state
  ),
  ctx AS (
    SELECT
      context,
      coalesce(array_agg(line) FILTER (WHERE harmony), ARRAY[]::text[]) AS harmony,
      coalesce(array_agg(line) FILTER (WHERE NOT harmony), ARRAY[]::text[]) AS challenge
    FROM lines GROUP BY context
  )
  SELECT jsonb_build_object(
    'a', jsonb_build_object('code', a.code, 'name', a.name, 'emoji', a.emoji),
    'b', jsonb_build_object('code', b.code, 'name', b.name, 'emoji', b.emoji),
    'romance', jsonb_build_object('score', (SELECT romance FROM scores),
       'harmony', (SELECT harmony FROM ctx WHERE context='romance'),
       'challenge', (SELECT challenge FROM ctx WHERE context='romance')),
    'friend', jsonb_build_object('score', (SELECT friend FROM scores),
       'harmony', (SELECT harmony FROM ctx WHERE context='friend'),
       'challenge', (SELECT challenge FROM ctx WHERE context='friend')),
    'work', jsonb_build_object('score', (SELECT work FROM scores),
       'harmony', (SELECT harmony FROM ctx WHERE context='work'),
       'challenge', (SELECT challenge FROM ctx WHERE context='work'))
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_island_compat(text, text) TO anon, authenticated;

-- 내 섬과 잘 맞는 섬 Top N(연애 점수 기준).
CREATE OR REPLACE FUNCTION public.island_best_matches(p_code text, p_limit integer DEFAULT 3)
RETURNS TABLE (code text, name text, emoji text, tagline text, romance_score integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.code, b.name, b.emoji, b.tagline,
    (40
      + (CASE WHEN a.a1_social = b.a1_social THEN 18 ELSE 0 END)
      + (CASE WHEN a.a3_express = b.a3_express THEN 18 ELSE 0 END)
      + (CASE WHEN a.a2_curious = b.a2_curious THEN 12 ELSE 0 END)
      + (CASE WHEN a.a4_flow = b.a4_flow THEN 12 ELSE 0 END))::int AS romance_score
  FROM public.island_types a
  JOIN public.island_types b ON b.code <> a.code
  WHERE a.code = p_code
  ORDER BY romance_score DESC, b.sort_order
  LIMIT LEAST(GREATEST(p_limit, 1), 15);
$$;

GRANT EXECUTE ON FUNCTION public.island_best_matches(text, integer) TO anon, authenticated;
