-- 밸런스 질문 카테고리 4종 추가: 머니/관계/가치관/건강.
-- 기존 5종(food/life/romance/career/culture, sort 10~50) 뒤에 60~90으로 배치.
-- 멱등: 동일 slug가 있으면 건너뛴다.

INSERT INTO public.categories (name, slug, emoji, description, sort_order)
SELECT v.name, v.slug, v.emoji, v.description, v.sort_order
FROM (VALUES
  ('머니',   'money',        '💰', '저축·소비·투자 성향', 60),
  ('관계',   'relationship', '🤝', '친구·가족·사회 관계(연애 제외)', 70),
  ('가치관', 'values',       '⚖️', '인생 선택·딜레마·우선순위', 80),
  ('건강',   'health',       '💪', '운동·식습관·수면 루틴', 90)
) AS v(name, slug, emoji, description, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.slug = v.slug
);
