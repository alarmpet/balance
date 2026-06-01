-- Personality pet + theme gacha foundation.
-- Apply after 202606012330_feed_state_and_ledger_hardening.sql.

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

REVOKE UPDATE ON public.profiles FROM anon;
REVOKE UPDATE ON public.profiles FROM authenticated;

CREATE OR REPLACE FUNCTION public.update_profile_display(
  p_nickname text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_age_range text DEFAULT NULL,
  p_home_island_id uuid DEFAULT NULL,
  p_selected_character_id uuid DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_row public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_nickname IS NOT NULL AND char_length(p_nickname) NOT BETWEEN 2 AND 24 THEN
    RAISE EXCEPTION 'nickname must be between 2 and 24 characters';
  END IF;

  IF p_gender IS NOT NULL AND p_gender NOT IN ('female', 'male', 'non_binary', 'prefer_not_to_say') THEN
    RAISE EXCEPTION 'invalid gender';
  END IF;

  IF p_age_range IS NOT NULL AND p_age_range NOT IN ('10s', '20s', '30s', '40s', '50s_plus') THEN
    RAISE EXCEPTION 'invalid age range';
  END IF;

  UPDATE public.profiles
  SET
    nickname = COALESCE(p_nickname, nickname),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    bio = COALESCE(p_bio, bio),
    gender = COALESCE(p_gender, gender),
    age_range = COALESCE(p_age_range, age_range),
    home_island_id = COALESCE(p_home_island_id, home_island_id),
    selected_character_id = COALESCE(p_selected_character_id, selected_character_id),
    updated_at = now()
  WHERE id = auth.uid()
  RETURNING * INTO profile_row;

  IF profile_row.id IS NULL THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  RETURN profile_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_profile_display(text, text, text, text, text, uuid, uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.pet_species (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  base_rarity text DEFAULT 'common' NOT NULL CHECK (base_rarity IN ('common', 'rare')),
  common_asset_url text NOT NULL,
  rare_asset_url text,
  legendary_asset_url text,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pet_species_traits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  species_id uuid REFERENCES public.pet_species(id) ON DELETE CASCADE NOT NULL,
  trait_key text NOT NULL,
  affinity_score numeric DEFAULT 1.0 NOT NULL CHECK (affinity_score > 0),
  source_label text,
  source_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_pet_species_trait UNIQUE (species_id, trait_key)
);

CREATE TABLE IF NOT EXISTS public.user_pet_state (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  species_id uuid REFERENCES public.pet_species(id) ON DELETE SET NULL,
  nickname text,
  level integer DEFAULT 1 NOT NULL CHECK (level BETWEEN 1 AND 99),
  experience integer DEFAULT 0 NOT NULL CHECK (experience >= 0),
  bond integer DEFAULT 0 NOT NULL CHECK (bond >= 0),
  mood integer DEFAULT 70 NOT NULL CHECK (mood BETWEEN 0 AND 100),
  energy integer DEFAULT 70 NOT NULL CHECK (energy BETWEEN 0 AND 100),
  assigned_trait_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.theme_skins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'legendary')),
  background_asset_url text NOT NULL,
  preview_asset_url text,
  effect_key text,
  series_key text DEFAULT 'base' NOT NULL,
  is_limited boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.theme_draw_pools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  cost_shells integer DEFAULT 0 NOT NULL CHECK (cost_shells >= 0),
  draw_count integer DEFAULT 1 NOT NULL CHECK (draw_count BETWEEN 1 AND 10),
  guarantee_rule jsonb DEFAULT '{}'::jsonb NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.theme_draw_pool_items (
  pool_id uuid REFERENCES public.theme_draw_pools(id) ON DELETE CASCADE NOT NULL,
  theme_skin_id uuid REFERENCES public.theme_skins(id) ON DELETE CASCADE NOT NULL,
  weight integer NOT NULL CHECK (weight > 0),
  is_guaranteed_candidate boolean DEFAULT true NOT NULL,
  PRIMARY KEY (pool_id, theme_skin_id)
);

CREATE TABLE IF NOT EXISTS public.user_theme_inventory (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  theme_skin_id uuid REFERENCES public.theme_skins(id) ON DELETE CASCADE NOT NULL,
  level integer DEFAULT 1 NOT NULL CHECK (level BETWEEN 1 AND 5),
  duplicate_count integer DEFAULT 0 NOT NULL CHECK (duplicate_count >= 0),
  is_equipped boolean DEFAULT false NOT NULL,
  first_acquired_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, theme_skin_id)
);

CREATE TABLE IF NOT EXISTS public.theme_draw_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pool_id uuid REFERENCES public.theme_draw_pools(id) ON DELETE SET NULL,
  theme_skin_id uuid REFERENCES public.theme_skins(id) ON DELETE SET NULL,
  rarity text NOT NULL,
  cost_shells integer DEFAULT 0 NOT NULL CHECK (cost_shells >= 0),
  idempotency_key text NOT NULL,
  request_id uuid NOT NULL,
  draw_index integer NOT NULL CHECK (draw_index BETWEEN 1 AND 10),
  was_duplicate boolean DEFAULT false NOT NULL,
  inventory_level_after integer DEFAULT 1 NOT NULL,
  pity_before integer DEFAULT 0 NOT NULL,
  pity_after integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_theme_draw_request_index UNIQUE (user_id, request_id, draw_index),
  CONSTRAINT unique_theme_draw_idempotency_index UNIQUE (user_id, idempotency_key, draw_index)
);

CREATE TABLE IF NOT EXISTS public.user_theme_pity (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pool_id uuid REFERENCES public.theme_draw_pools(id) ON DELETE CASCADE NOT NULL,
  legendary_miss_count integer DEFAULT 0 NOT NULL CHECK (legendary_miss_count >= 0),
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, pool_id)
);

CREATE TABLE IF NOT EXISTS public.theme_probability_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id uuid REFERENCES public.theme_draw_pools(id) ON DELETE CASCADE NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  weight_snapshot jsonb NOT NULL,
  guarantee_rule_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
  change_reason text NOT NULL,
  effective_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_theme_probability_version UNIQUE (pool_id, version)
);

ALTER TABLE public.pet_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_species_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pet_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_draw_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_draw_pool_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_theme_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_draw_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_theme_pity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_probability_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pet_species_public_read" ON public.pet_species;
CREATE POLICY "pet_species_public_read" ON public.pet_species FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "pet_species_traits_public_read" ON public.pet_species_traits;
CREATE POLICY "pet_species_traits_public_read" ON public.pet_species_traits FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_pet_state_select_own" ON public.user_pet_state;
CREATE POLICY "user_pet_state_select_own" ON public.user_pet_state FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "theme_skins_public_read" ON public.theme_skins;
CREATE POLICY "theme_skins_public_read" ON public.theme_skins FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "theme_draw_pools_public_read" ON public.theme_draw_pools;
CREATE POLICY "theme_draw_pools_public_read" ON public.theme_draw_pools FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "theme_draw_pool_items_public_read" ON public.theme_draw_pool_items;
CREATE POLICY "theme_draw_pool_items_public_read" ON public.theme_draw_pool_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_theme_inventory_select_own" ON public.user_theme_inventory;
CREATE POLICY "user_theme_inventory_select_own" ON public.user_theme_inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "theme_draw_history_select_own" ON public.theme_draw_history;
CREATE POLICY "theme_draw_history_select_own" ON public.theme_draw_history FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_theme_pity_select_own" ON public.user_theme_pity;
CREATE POLICY "user_theme_pity_select_own" ON public.user_theme_pity FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "theme_probability_versions_public_read" ON public.theme_probability_versions;
CREATE POLICY "theme_probability_versions_public_read" ON public.theme_probability_versions FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.assign_personality_pet()
RETURNS public.user_pet_state
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_state public.user_pet_state;
  selected_species_id uuid;
  trait_snapshot jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO existing_state
  FROM public.user_pet_state
  WHERE user_id = auth.uid();

  IF existing_state.user_id IS NOT NULL THEN
    RETURN existing_state;
  END IF;

  SELECT COALESCE(jsonb_object_agg(trait_key, score), '{}'::jsonb)
  INTO trait_snapshot
  FROM public.user_traits
  WHERE user_id = auth.uid();

  WITH user_trait_scores AS (
    SELECT trait_key, score
    FROM public.user_traits
    WHERE user_id = auth.uid()
  ),
  species_scores AS (
    SELECT
      ps.id,
      COALESCE(SUM(LEAST(uts.score, pst.affinity_score)), 0) AS match_score,
      ps.sort_order
    FROM public.pet_species ps
    LEFT JOIN public.pet_species_traits pst ON pst.species_id = ps.id
    LEFT JOIN user_trait_scores uts ON uts.trait_key = pst.trait_key
    WHERE ps.is_active = true
    GROUP BY ps.id, ps.sort_order
  )
  SELECT id INTO selected_species_id
  FROM species_scores
  ORDER BY match_score DESC, sort_order ASC
  LIMIT 1;

  IF selected_species_id IS NULL THEN
    RAISE EXCEPTION 'No active pet species available';
  END IF;

  INSERT INTO public.user_pet_state (user_id, species_id, assigned_trait_snapshot)
  VALUES (auth.uid(), selected_species_id, trait_snapshot)
  RETURNING * INTO existing_state;

  RETURN existing_state;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_theme_probability_disclosure(
  p_pool_slug text DEFAULT 'daily-theme'
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH pool AS (
    SELECT *
    FROM public.theme_draw_pools
    WHERE slug = p_pool_slug
      AND is_active = true
      AND (starts_at IS NULL OR starts_at <= now())
      AND (ends_at IS NULL OR ends_at > now())
    LIMIT 1
  ),
  weighted AS (
    SELECT
      p.id AS pool_id,
      p.slug AS pool_slug,
      p.display_name AS pool_name,
      p.guarantee_rule,
      ts.id AS theme_skin_id,
      ts.slug,
      ts.display_name,
      ts.rarity,
      tdpi.weight,
      SUM(tdpi.weight) OVER () AS total_weight
    FROM pool p
    JOIN public.theme_draw_pool_items tdpi ON tdpi.pool_id = p.id
    JOIN public.theme_skins ts ON ts.id = tdpi.theme_skin_id
    WHERE ts.is_active = true
  ),
  rarity_rows AS (
    SELECT
      rarity,
      SUM(weight) AS rarity_weight,
      MAX(total_weight) AS total_weight
    FROM weighted
    GROUP BY rarity
  ),
  latest_version AS (
    SELECT tpv.version, tpv.effective_at
    FROM pool p
    LEFT JOIN LATERAL (
      SELECT version, effective_at
      FROM public.theme_probability_versions
      WHERE pool_id = p.id
      ORDER BY version DESC
      LIMIT 1
    ) tpv ON true
  )
  SELECT jsonb_build_object(
    'pool', (
      SELECT jsonb_build_object(
        'slug', pool_slug,
        'name', pool_name,
        'guarantee_rule', guarantee_rule
      )
      FROM weighted
      LIMIT 1
    ),
    'version', (SELECT COALESCE(version, 1) FROM latest_version LIMIT 1),
    'effective_at', (SELECT effective_at FROM latest_version LIMIT 1),
    'rarities', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'rarity', rarity,
          'weight', rarity_weight,
          'probability', ROUND((rarity_weight::numeric / NULLIF(total_weight, 0)) * 100, 4)
        )
        ORDER BY CASE rarity WHEN 'common' THEN 1 WHEN 'rare' THEN 2 ELSE 3 END
      )
      FROM rarity_rows
    ), '[]'::jsonb),
    'items', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'theme_skin_id', theme_skin_id,
          'slug', slug,
          'name', display_name,
          'rarity', rarity,
          'weight', weight,
          'probability', ROUND((weight::numeric / NULLIF(total_weight, 0)) * 100, 4)
        )
        ORDER BY rarity, display_name
      )
      FROM weighted
    ), '[]'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION public.draw_theme_pack(
  p_pool_slug text DEFAULT 'daily-theme',
  p_draw_count integer DEFAULT 1,
  p_request_id uuid DEFAULT NULL
)
RETURNS TABLE (
  draw_index integer,
  theme_skin_id uuid,
  slug text,
  display_name text,
  rarity text,
  was_duplicate boolean,
  inventory_level_after integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pool_row public.theme_draw_pools;
  total_weight integer;
  selected_skin public.theme_skins;
  current_pity integer;
  next_pity integer;
  inventory_row public.user_theme_inventory;
  i integer;
  idempotency_key text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'request id is required';
  END IF;

  IF p_draw_count NOT BETWEEN 1 AND 10 THEN
    RAISE EXCEPTION 'draw count must be between 1 and 10';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.theme_draw_history h
    WHERE h.user_id = auth.uid()
      AND h.request_id = p_request_id
  ) THEN
    RETURN QUERY
    SELECT
      h.draw_index,
      ts.id,
      ts.slug,
      ts.display_name,
      ts.rarity,
      h.was_duplicate,
      h.inventory_level_after
    FROM public.theme_draw_history h
    JOIN public.theme_skins ts ON ts.id = h.theme_skin_id
    WHERE h.user_id = auth.uid()
      AND h.request_id = p_request_id
    ORDER BY h.draw_index;
    RETURN;
  END IF;

  SELECT * INTO pool_row
  FROM public.theme_draw_pools
  WHERE slug = p_pool_slug
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  LIMIT 1;

  IF pool_row.id IS NULL THEN
    RAISE EXCEPTION 'Draw pool not found or inactive';
  END IF;

  SELECT COALESCE(SUM(tdpi.weight), 0) INTO total_weight
  FROM public.theme_draw_pool_items tdpi
  JOIN public.theme_skins ts ON ts.id = tdpi.theme_skin_id
  WHERE tdpi.pool_id = pool_row.id
    AND ts.is_active = true;

  IF total_weight <= 0 THEN
    RAISE EXCEPTION 'Draw pool has no active items';
  END IF;

  INSERT INTO public.user_theme_pity (user_id, pool_id, legendary_miss_count)
  VALUES (auth.uid(), pool_row.id, 0)
  ON CONFLICT (user_id, pool_id) DO NOTHING;

  IF pool_row.cost_shells * p_draw_count > 0 THEN
    PERFORM public.apply_shell_delta(
      auth.uid(),
      -(pool_row.cost_shells * p_draw_count),
      'theme_draw',
      'theme_draw_pool',
      pool_row.id,
      'theme_draw_cost:' || auth.uid()::text || ':' || p_request_id::text
    );
  END IF;

  FOR i IN 1..p_draw_count LOOP
    SELECT legendary_miss_count INTO current_pity
    FROM public.user_theme_pity
    WHERE user_id = auth.uid()
      AND pool_id = pool_row.id
    FOR UPDATE;

    SELECT ts.* INTO selected_skin
    FROM public.theme_draw_pool_items tdpi
    JOIN public.theme_skins ts ON ts.id = tdpi.theme_skin_id
    WHERE tdpi.pool_id = pool_row.id
      AND ts.is_active = true
      AND (
        current_pity < 50
        OR EXISTS (
          SELECT 1
          FROM public.theme_draw_pool_items lpi
          JOIN public.theme_skins lts ON lts.id = lpi.theme_skin_id
          WHERE lpi.pool_id = pool_row.id
            AND lts.is_active = true
            AND lts.rarity = 'legendary'
        ) = false
        OR ts.rarity = 'legendary'
      )
      AND (
        p_draw_count < 10
        OR i < 10
        OR tdpi.is_guaranteed_candidate = true
        OR NOT EXISTS (
          SELECT 1
          FROM public.theme_draw_pool_items gpi
          WHERE gpi.pool_id = pool_row.id
            AND gpi.is_guaranteed_candidate = true
        )
      )
    ORDER BY -LN(GREATEST(random(), 0.000001)) / tdpi.weight
    LIMIT 1;

    IF selected_skin.id IS NULL THEN
      RAISE EXCEPTION 'No theme skin selected';
    END IF;

    INSERT INTO public.user_theme_inventory (
      user_id,
      theme_skin_id,
      level,
      duplicate_count,
      is_equipped
    )
    VALUES (
      auth.uid(),
      selected_skin.id,
      1,
      0,
      NOT EXISTS (
        SELECT 1
        FROM public.user_theme_inventory
        WHERE user_id = auth.uid()
      )
    )
    ON CONFLICT (user_id, theme_skin_id)
    DO UPDATE SET
      duplicate_count = public.user_theme_inventory.duplicate_count + 1,
      level = LEAST(5, public.user_theme_inventory.level + 1),
      updated_at = now()
    RETURNING * INTO inventory_row;

    next_pity := CASE WHEN selected_skin.rarity = 'legendary' THEN 0 ELSE current_pity + 1 END;

    UPDATE public.user_theme_pity
    SET
      legendary_miss_count = next_pity,
      updated_at = now()
    WHERE user_id = auth.uid()
      AND pool_id = pool_row.id;

    idempotency_key := 'theme_draw:' || auth.uid()::text || ':' || p_request_id::text;

    INSERT INTO public.theme_draw_history (
      user_id,
      pool_id,
      theme_skin_id,
      rarity,
      cost_shells,
      idempotency_key,
      request_id,
      draw_index,
      was_duplicate,
      inventory_level_after,
      pity_before,
      pity_after
    )
    VALUES (
      auth.uid(),
      pool_row.id,
      selected_skin.id,
      selected_skin.rarity,
      pool_row.cost_shells,
      idempotency_key,
      p_request_id,
      i,
      inventory_row.duplicate_count > 0,
      inventory_row.level,
      current_pity,
      next_pity
    );
  END LOOP;

  RETURN QUERY
  SELECT
    h.draw_index,
    ts.id,
    ts.slug,
    ts.display_name,
    ts.rarity,
    h.was_duplicate,
    h.inventory_level_after
  FROM public.theme_draw_history h
  JOIN public.theme_skins ts ON ts.id = h.theme_skin_id
  WHERE h.user_id = auth.uid()
    AND h.request_id = p_request_id
  ORDER BY h.draw_index;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_daily_theme_draw(
  p_request_id uuid DEFAULT NULL
)
RETURNS TABLE (
  draw_index integer,
  theme_skin_id uuid,
  slug text,
  display_name text,
  rarity text,
  was_duplicate boolean,
  inventory_level_after integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kst_date text;
  request_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  kst_date := to_char(timezone('Asia/Seoul', now())::date, 'YYYY-MM-DD');
  request_id := md5(auth.uid()::text || ':daily_theme:' || kst_date)::uuid;

  RETURN QUERY
  SELECT *
  FROM public.draw_theme_pack('daily-theme', 1, request_id);
END;
$$;

DROP FUNCTION IF EXISTS public.care_avatar(text);

CREATE OR REPLACE FUNCTION public.care_avatar(
  p_care_type text DEFAULT 'snack',
  p_request_id uuid DEFAULT NULL
)
RETURNS public.user_avatar_state
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  care_cost integer;
  state_row public.user_avatar_state;
  care_key text;
  ledger_applied boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_care_type NOT IN ('snack', 'play', 'praise') THEN
    RAISE EXCEPTION 'care type must be snack, play, or praise';
  END IF;

  care_cost := CASE WHEN p_care_type = 'praise' THEN 0 ELSE 10 END;

  IF care_cost > 0 AND p_request_id IS NULL THEN
    RAISE EXCEPTION 'request id is required for paid care actions';
  END IF;

  PERFORM public.ensure_user_gamification_state(auth.uid());

  IF care_cost > 0 THEN
    care_key := 'care:' || auth.uid()::text || ':' || p_care_type || ':' || p_request_id::text;

    ledger_applied := public.apply_shell_delta(
      auth.uid(),
      -care_cost,
      'care_avatar_' || p_care_type,
      'avatar_care',
      NULL,
      care_key
    );
  END IF;

  IF care_cost = 0 OR ledger_applied THEN
    UPDATE public.user_avatar_state
    SET
      mood = LEAST(100, mood + CASE WHEN p_care_type = 'snack' THEN 8 ELSE 4 END),
      energy = LEAST(100, energy + CASE WHEN p_care_type = 'play' THEN 8 ELSE 3 END),
      bond = bond + CASE WHEN p_care_type = 'praise' THEN 1 ELSE 2 END,
      updated_at = now()
    WHERE user_id = auth.uid()
    RETURNING * INTO state_row;
  ELSE
    SELECT * INTO state_row
    FROM public.user_avatar_state
    WHERE user_id = auth.uid();
  END IF;

  RETURN state_row;
END;
$$;

INSERT INTO public.pet_species (slug, display_name, description, base_rarity, common_asset_url, rare_asset_url, sort_order)
VALUES
  ('american-shorthair', '아메리칸 숏헤어', '안정적이고 균형 잡힌 성향 펫.', 'common', 'asset://alarmpetgo/svg/american shorthair.png', 'asset://alarmpetgo/rare/rare-american shorthair.png', 10),
  ('bichon', '비숑', '밝고 사교적인 리액션 펫.', 'common', 'asset://alarmpetgo/svg/bichon.png', 'asset://alarmpetgo/rare/rare-bichon.png', 20),
  ('chameleon', '카멜레온', '조용히 관찰하고 상황에 맞춰 변하는 펫.', 'common', 'asset://alarmpetgo/svg/chameleon.png', 'asset://alarmpetgo/rare/rare-chameleon.png', 30)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  common_asset_url = EXCLUDED.common_asset_url,
  rare_asset_url = EXCLUDED.rare_asset_url,
  updated_at = now();

WITH trait_seed(slug, trait_key, affinity_score, source_label, source_url) AS (
  VALUES
    ('american-shorthair', 'safe', 1.4, 'TICA American Shorthair', 'https://tica.org/breed/american-shorthair/'),
    ('american-shorthair', 'calm', 1.3, 'TICA American Shorthair', 'https://tica.org/breed/american-shorthair/'),
    ('american-shorthair', 'social', 1.1, 'TICA American Shorthair', 'https://tica.org/breed/american-shorthair/'),
    ('bichon', 'social', 1.5, 'AKC Bichon Frise', 'https://www.akc.org/expert-advice/dog-breeds/bichon-frise/'),
    ('bichon', 'express', 1.3, 'AKC Bichon Frise', 'https://www.akc.org/expert-advice/dog-breeds/bichon-frise/'),
    ('bichon', 'flow', 1.1, 'AKC Bichon Frise', 'https://www.akc.org/expert-advice/dog-breeds/bichon-frise/'),
    ('chameleon', 'solo', 1.5, 'Chameleon care notes', 'https://static1.squarespace.com/static/5c8fbfe87d0c914f25ad6fa4/t/64d58f7c7781440451ebc97f/1691717504034/chameleon%281%29.pdf'),
    ('chameleon', 'safe', 1.2, 'Chameleon care notes', 'https://static1.squarespace.com/static/5c8fbfe87d0c914f25ad6fa4/t/64d58f7c7781440451ebc97f/1691717504034/chameleon%281%29.pdf'),
    ('chameleon', 'calm', 1.3, 'Chameleon care notes', 'https://static1.squarespace.com/static/5c8fbfe87d0c914f25ad6fa4/t/64d58f7c7781440451ebc97f/1691717504034/chameleon%281%29.pdf')
)
INSERT INTO public.pet_species_traits (species_id, trait_key, affinity_score, source_label, source_url)
SELECT ps.id, ts.trait_key, ts.affinity_score, ts.source_label, ts.source_url
FROM trait_seed ts
JOIN public.pet_species ps ON ps.slug = ts.slug
ON CONFLICT (species_id, trait_key) DO UPDATE SET
  affinity_score = EXCLUDED.affinity_score,
  source_label = EXCLUDED.source_label,
  source_url = EXCLUDED.source_url;

INSERT INTO public.theme_skins (slug, display_name, rarity, background_asset_url, preview_asset_url, effect_key, sort_order)
VALUES
  ('sunny-beach', '맑은 해변', 'common', 'asset://themes/sunny-beach/background.png', 'asset://themes/sunny-beach/preview.png', NULL, 10),
  ('cozy-room', '아늑한 방', 'common', 'asset://themes/cozy-room/background.png', 'asset://themes/cozy-room/preview.png', NULL, 20),
  ('pink-lagoon', '핑크빛 라군', 'rare', 'asset://themes/pink-lagoon/background.png', 'asset://themes/pink-lagoon/preview.png', 'sparkle', 30),
  ('neon-cafe', '네온 카페', 'rare', 'asset://themes/neon-cafe/background.png', 'asset://themes/neon-cafe/preview.png', 'neon', 40),
  ('star-kingdom', '별빛 왕국', 'legendary', 'asset://themes/star-kingdom/background.png', 'asset://themes/star-kingdom/preview.png', 'legendary_aura', 50)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  rarity = EXCLUDED.rarity,
  background_asset_url = EXCLUDED.background_asset_url,
  preview_asset_url = EXCLUDED.preview_asset_url,
  effect_key = EXCLUDED.effect_key,
  updated_at = now();

INSERT INTO public.theme_draw_pools (slug, display_name, cost_shells, draw_count, guarantee_rule, is_active)
VALUES
  ('daily-theme', '오늘의 무료 테마', 0, 1, '{"type":"none"}'::jsonb, true),
  ('standard-theme', '기본 테마 뽑기', 30, 1, '{"ten_draw_last_slot":"rare_or_better","legendary_pity_after_misses":50}'::jsonb, true)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  cost_shells = EXCLUDED.cost_shells,
  draw_count = EXCLUDED.draw_count,
  guarantee_rule = EXCLUDED.guarantee_rule,
  is_active = EXCLUDED.is_active,
  updated_at = now();

WITH pool_items(pool_slug, theme_slug, weight, guaranteed) AS (
  VALUES
    ('daily-theme', 'sunny-beach', 9000, true),
    ('daily-theme', 'cozy-room', 9000, true),
    ('daily-theme', 'pink-lagoon', 900, true),
    ('daily-theme', 'neon-cafe', 900, true),
    ('daily-theme', 'star-kingdom', 100, true),
    ('standard-theme', 'sunny-beach', 9000, true),
    ('standard-theme', 'cozy-room', 9000, true),
    ('standard-theme', 'pink-lagoon', 900, true),
    ('standard-theme', 'neon-cafe', 900, true),
    ('standard-theme', 'star-kingdom', 100, true)
)
INSERT INTO public.theme_draw_pool_items (pool_id, theme_skin_id, weight, is_guaranteed_candidate)
SELECT tdp.id, ts.id, pi.weight, pi.guaranteed
FROM pool_items pi
JOIN public.theme_draw_pools tdp ON tdp.slug = pi.pool_slug
JOIN public.theme_skins ts ON ts.slug = pi.theme_slug
ON CONFLICT (pool_id, theme_skin_id) DO UPDATE SET
  weight = EXCLUDED.weight,
  is_guaranteed_candidate = EXCLUDED.is_guaranteed_candidate;

WITH snapshots AS (
  SELECT
    tdp.id AS pool_id,
    jsonb_agg(
      jsonb_build_object(
        'theme_slug', ts.slug,
        'rarity', ts.rarity,
        'weight', tdpi.weight
      )
      ORDER BY ts.rarity, ts.slug
    ) AS weight_snapshot,
    tdp.guarantee_rule
  FROM public.theme_draw_pools tdp
  JOIN public.theme_draw_pool_items tdpi ON tdpi.pool_id = tdp.id
  JOIN public.theme_skins ts ON ts.id = tdpi.theme_skin_id
  GROUP BY tdp.id, tdp.guarantee_rule
)
INSERT INTO public.theme_probability_versions (
  pool_id,
  version,
  weight_snapshot,
  guarantee_rule_snapshot,
  change_reason
)
SELECT pool_id, 1, weight_snapshot, guarantee_rule, 'initial theme probability seed'
FROM snapshots
ON CONFLICT (pool_id, version) DO UPDATE SET
  weight_snapshot = EXCLUDED.weight_snapshot,
  guarantee_rule_snapshot = EXCLUDED.guarantee_rule_snapshot;

GRANT EXECUTE ON FUNCTION public.assign_personality_pet() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_theme_probability_disclosure(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.draw_theme_pack(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_theme_draw(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.care_avatar(text, uuid) TO authenticated;
