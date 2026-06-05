-- 밸런스 질문 카테고리 2차 추가: 여행/트렌드/취미/딜레마.
-- 기존 9종(sort 10~90) 뒤에 100~130으로 배치. 멱등.

INSERT INTO public.categories (name, slug, emoji, description, sort_order)
SELECT v.name, v.slug, v.emoji, v.description, v.sort_order
FROM (VALUES
  ('여행',   'travel',  '✈️', '여행 스타일·일정·동행', 100),
  ('트렌드', 'trend',   '📱', 'SNS·유행·디지털 취향', 110),
  ('취미',   'hobby',   '🐾', '반려·취미·여가', 120),
  ('딜레마', 'dilemma', '😆', '재미있는 가정·인생 딜레마', 130)
) AS v(name, slug, emoji, description, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.slug = v.slug
);
