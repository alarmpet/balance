-- Expand the first Balance Island pet asset batch.
-- Keeps asset:// as the stable content identifier; the app resolves these to bundled assets.

INSERT INTO public.pet_species (
  slug,
  display_name,
  description,
  base_rarity,
  common_asset_url,
  rare_asset_url,
  legendary_asset_url,
  sort_order
)
VALUES
  ('american-shorthair', '아메리칸 숏헤어', '안정적이고 균형 잡힌 성향 펫.', 'common', 'asset://alarmpetgo/svg/american shorthair.png', 'asset://alarmpetgo/rare/rare-american shorthair.png', 'asset://alarmpetgo/legend/unicorn.png', 10),
  ('bichon', '비숑', '밝고 사교적인 리액션 펫.', 'common', 'asset://alarmpetgo/svg/bichon.png', 'asset://alarmpetgo/rare/rare-bichon.png', 'asset://alarmpetgo/legend/phoenix.png', 20),
  ('chameleon', '카멜레온', '조용히 관찰하고 상황에 맞춰 변하는 펫.', 'common', 'asset://alarmpetgo/svg/chameleon.png', 'asset://alarmpetgo/rare/rare-chameleon.png', 'asset://alarmpetgo/legend/dragon.png', 30),
  ('chihuahua', '치와와', '작지만 강한 표현력으로 선택을 또렷하게 비추는 펫.', 'common', 'asset://alarmpetgo/svg/chihuahua.png', 'asset://alarmpetgo/rare/rare-chihuahua.png', NULL, 40),
  ('deer', '사슴', '섬세한 감각과 조용한 호기심을 따라 걷는 펫.', 'common', 'asset://alarmpetgo/svg/deer.png', 'asset://alarmpetgo/rare/rare-deer.png', NULL, 50),
  ('elephant', '코끼리', '느긋하지만 오래 기억하고 신중히 선택하는 펫.', 'common', 'asset://alarmpetgo/svg/elephant.png', 'asset://alarmpetgo/rare/rare-elephant.png', NULL, 60),
  ('frog', '개구리', '가볍게 뛰어오르며 새로운 선택지를 실험하는 펫.', 'common', 'asset://alarmpetgo/svg/frog.png', 'asset://alarmpetgo/rare/rare-frog.png', NULL, 70),
  ('giraffe', '기린', '멀리 보고 큰 그림 속에서 방향을 찾는 펫.', 'common', 'asset://alarmpetgo/svg/giraffe.png', 'asset://alarmpetgo/rare/rare-giraffe.png', NULL, 80),
  ('goldfish', '금붕어', '반짝이는 취향과 편안한 흐름을 좋아하는 펫.', 'common', 'asset://alarmpetgo/svg/goldfish.png', 'asset://alarmpetgo/rare/rare-goldfish.png', NULL, 90),
  ('hamster', '햄스터', '작은 루틴과 아늑한 보상을 차곡차곡 모으는 펫.', 'common', 'asset://alarmpetgo/svg/hamster.png', 'asset://alarmpetgo/rare/rare-hamster.png', NULL, 100)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  common_asset_url = EXCLUDED.common_asset_url,
  rare_asset_url = EXCLUDED.rare_asset_url,
  legendary_asset_url = EXCLUDED.legendary_asset_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

WITH trait_seed(slug, trait_key, affinity_score, source_label, source_url) AS (
  VALUES
    ('chihuahua', 'express', 1.5, 'Balance Island archetype', NULL),
    ('chihuahua', 'social', 1.2, 'Balance Island archetype', NULL),
    ('chihuahua', 'adventure', 1.1, 'Balance Island archetype', NULL),
    ('deer', 'calm', 1.5, 'Balance Island archetype', NULL),
    ('deer', 'aesthetic', 1.3, 'Balance Island archetype', NULL),
    ('deer', 'solo', 1.1, 'Balance Island archetype', NULL),
    ('elephant', 'safe', 1.5, 'Balance Island archetype', NULL),
    ('elephant', 'plan', 1.3, 'Balance Island archetype', NULL),
    ('elephant', 'comfort_seeker', 1.1, 'Balance Island archetype', NULL),
    ('frog', 'adventure', 1.5, 'Balance Island archetype', NULL),
    ('frog', 'flow', 1.3, 'Balance Island archetype', NULL),
    ('frog', 'curious', 1.2, 'Balance Island archetype', NULL),
    ('giraffe', 'planner', 1.5, 'Balance Island archetype', NULL),
    ('giraffe', 'curious', 1.3, 'Balance Island archetype', NULL),
    ('giraffe', 'plan', 1.2, 'Balance Island archetype', NULL),
    ('goldfish', 'aesthetic', 1.5, 'Balance Island archetype', NULL),
    ('goldfish', 'flow', 1.3, 'Balance Island archetype', NULL),
    ('goldfish', 'comfort_seeker', 1.2, 'Balance Island archetype', NULL),
    ('hamster', 'comfort_seeker', 1.5, 'Balance Island archetype', NULL),
    ('hamster', 'safe', 1.3, 'Balance Island archetype', NULL),
    ('hamster', 'planner', 1.1, 'Balance Island archetype', NULL)
)
INSERT INTO public.pet_species_traits (species_id, trait_key, affinity_score, source_label, source_url)
SELECT ps.id, ts.trait_key, ts.affinity_score, ts.source_label, ts.source_url
FROM trait_seed ts
JOIN public.pet_species ps ON ps.slug = ts.slug
ON CONFLICT (species_id, trait_key) DO UPDATE SET
  affinity_score = EXCLUDED.affinity_score,
  source_label = EXCLUDED.source_label,
  source_url = EXCLUDED.source_url;
