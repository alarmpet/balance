-- pet_species_traits의 비표준 trait 키를 canonical(question_traits 기준)로 정규화.
-- ✅ 2026-06-04 라이브(ztcexgnelqtdzinfgoja)에 Supabase MCP로 적용·검증 완료.
--
-- 배경: assign_personality_pet은 pet_species_traits로 펫을 매칭하는데, 펫은 comfort_seeker/planner를,
-- user_traits/question_traits는 comfort/plan을 써서 그 두 축의 매칭이 조용히 실패했음(버그).
-- canonical 9키: safe, adventure, plan, flow, solo, social, calm, express, comfort.
-- (aesthetic, curious는 질문으로 획득 불가한 펫 전용 축 — 유지할지 흡수할지는 별도 제품 결정)
-- 멱등하게 작성.

-- 1) comfort_seeker → comfort
UPDATE public.pet_species_traits SET trait_key = 'comfort' WHERE trait_key = 'comfort_seeker';

-- 2) planner → plan : 같은 종이 이미 plan을 가지면 더 높은 affinity로 병합 후 planner 삭제
UPDATE public.pet_species_traits p
SET affinity_score = GREATEST(p.affinity_score, pl.affinity_score)
FROM public.pet_species_traits pl
WHERE p.species_id = pl.species_id
  AND p.trait_key = 'plan'
  AND pl.trait_key = 'planner';

DELETE FROM public.pet_species_traits pl
WHERE pl.trait_key = 'planner'
  AND EXISTS (
    SELECT 1 FROM public.pet_species_traits p
    WHERE p.species_id = pl.species_id AND p.trait_key = 'plan'
  );

UPDATE public.pet_species_traits SET trait_key = 'plan' WHERE trait_key = 'planner';
