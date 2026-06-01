-- DEV RESET ONLY.
-- Do not run this file against staging or production Supabase projects.
-- It intentionally drops public tables with CASCADE for local rebuilds.
-- Live projects must use files under supabase/migrations instead.

-- Balance Island MVP Complete Supabase Schema
-- Tables: 1 profiles, 2 categories, 3 islands, 4 characters, 5 user_characters,
-- 6 questions, 7 question_traits, 8 votes, 9 user_traits, 10 comments,
-- 11 question_reactions, 12 comment_reactions, 13 bookmarks, 14 follows,
-- 15 notifications, 16 daily_missions, 17 user_mission_progress.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS public.user_mission_progress CASCADE;
DROP TABLE IF EXISTS public.daily_missions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.comment_reactions CASCADE;
DROP TABLE IF EXISTS public.question_reactions CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.user_traits CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.question_traits CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.user_characters CASCADE;
DROP TABLE IF EXISTS public.characters CASCADE;
DROP TABLE IF EXISTS public.islands CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.handle_vote_effects_procedure();
DROP FUNCTION IF EXISTS public.set_updated_at();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Profiles Table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nickname TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 2 AND 24),
    avatar_url TEXT,
    gender TEXT CHECK (gender IN ('female', 'male', 'non_binary', 'prefer_not_to_say')),
    age_range TEXT CHECK (age_range IN ('10s', '20s', '30s', '40s', '50s_plus')),
    bio TEXT,
    home_island_id UUID,
    selected_character_id UUID,
    streak_count INTEGER DEFAULT 0 NOT NULL CHECK (streak_count >= 0),
    shell_balance INTEGER DEFAULT 0 NOT NULL CHECK (shell_balance >= 0),
    total_participation_count INTEGER DEFAULT 0 NOT NULL CHECK (total_participation_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Categories Table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    emoji TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Islands Table
CREATE TABLE public.islands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    background_color TEXT DEFAULT '#E0F2FE' NOT NULL,
    required_trait_key TEXT,
    min_trait_score NUMERIC DEFAULT 0 NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Characters Table
CREATE TABLE public.characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    island_id UUID REFERENCES public.islands(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    rarity TEXT DEFAULT 'common'::TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    unlock_trait_key TEXT,
    unlock_trait_score NUMERIC DEFAULT 0 NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. User Characters Table
CREATE TABLE public.user_characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL CHECK (level BETWEEN 1 AND 99),
    experience INTEGER DEFAULT 0 NOT NULL CHECK (experience >= 0),
    is_selected BOOLEAN DEFAULT FALSE NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_character UNIQUE (user_id, character_id)
);

-- 6. Questions Table
CREATE TABLE public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    option_a_title TEXT NOT NULL,
    option_a_description TEXT,
    option_a_image_url TEXT NOT NULL,
    option_b_title TEXT NOT NULL,
    option_b_description TEXT,
    option_b_image_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending'::TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
    visibility TEXT DEFAULT 'public'::TEXT NOT NULL CHECK (visibility IN ('public', 'followers', 'private')),
    is_official BOOLEAN DEFAULT FALSE NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
    embedding VECTOR(1536),
    total_votes INTEGER DEFAULT 0 NOT NULL CHECK (total_votes >= 0),
    option_a_votes INTEGER DEFAULT 0 NOT NULL CHECK (option_a_votes >= 0),
    option_b_votes INTEGER DEFAULT 0 NOT NULL CHECK (option_b_votes >= 0),
    like_count INTEGER DEFAULT 0 NOT NULL CHECK (like_count >= 0),
    fun_count INTEGER DEFAULT 0 NOT NULL CHECK (fun_count >= 0),
    hard_count INTEGER DEFAULT 0 NOT NULL CHECK (hard_count >= 0),
    comment_count INTEGER DEFAULT 0 NOT NULL CHECK (comment_count >= 0),
    report_count INTEGER DEFAULT 0 NOT NULL CHECK (report_count >= 0),
    heat_score NUMERIC DEFAULT 0.0 NOT NULL,
    controversy_score NUMERIC DEFAULT 0.0 NOT NULL,
    reward_score NUMERIC DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Question Traits Table
CREATE TABLE public.question_traits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    option_side TEXT NOT NULL CHECK (option_side IN ('A', 'B')),
    trait_key TEXT NOT NULL,
    weight NUMERIC DEFAULT 1.0 NOT NULL CHECK (weight > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_question_option_trait UNIQUE (question_id, option_side, trait_key)
);

-- 8. Votes Table
CREATE TABLE public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    selected_option TEXT NOT NULL CHECK (selected_option IN ('A', 'B')),
    response_time_ms INTEGER CHECK (response_time_ms IS NULL OR response_time_ms >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_question_vote UNIQUE (user_id, question_id)
);

-- 9. User Traits Table
CREATE TABLE public.user_traits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    trait_key TEXT NOT NULL,
    score NUMERIC DEFAULT 0.0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_trait UNIQUE (user_id, trait_key)
);

-- 10. Comments Table
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
    is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
    like_count INTEGER DEFAULT 0 NOT NULL CHECK (like_count >= 0),
    report_count INTEGER DEFAULT 0 NOT NULL CHECK (report_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 11. Question Reactions Table
CREATE TABLE public.question_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'fun', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_question_reaction UNIQUE (user_id, question_id, reaction_type)
);

-- 12. Comment Reactions Table
CREATE TABLE public.comment_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT DEFAULT 'like'::TEXT NOT NULL CHECK (reaction_type IN ('like')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_comment_reaction UNIQUE (user_id, comment_id, reaction_type)
);

-- 13. Bookmarks Table
CREATE TABLE public.bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_question_bookmark UNIQUE (user_id, question_id)
);

-- 14. Follows Table
CREATE TABLE public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT no_self_follow CHECK (follower_id <> following_id),
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- 15. Notifications Table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('vote_milestone', 'comment', 'reaction', 'follow', 'mission', 'system')),
    title TEXT NOT NULL,
    body TEXT,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 16. Daily Missions Table
CREATE TABLE public.daily_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mission_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    mission_type TEXT NOT NULL CHECK (mission_type IN ('vote', 'comment', 'reaction', 'streak', 'create_question')),
    target_count INTEGER DEFAULT 1 NOT NULL CHECK (target_count > 0),
    reward_shells INTEGER DEFAULT 0 NOT NULL CHECK (reward_shells >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_daily_mission_type UNIQUE (mission_date, mission_type)
);

-- 17. User Mission Progress Table
CREATE TABLE public.user_mission_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    mission_id UUID REFERENCES public.daily_missions(id) ON DELETE CASCADE NOT NULL,
    progress_count INTEGER DEFAULT 0 NOT NULL CHECK (progress_count >= 0),
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_mission UNIQUE (user_id, mission_id)
);

ALTER TABLE public.profiles
    ADD CONSTRAINT fk_profiles_home_island
    FOREIGN KEY (home_island_id) REFERENCES public.islands(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
    ADD CONSTRAINT fk_profiles_selected_character
    FOREIGN KEY (selected_character_id) REFERENCES public.characters(id) ON DELETE SET NULL;

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_islands_category_id ON public.islands(category_id);
CREATE INDEX idx_characters_island_id ON public.characters(island_id);
CREATE INDEX idx_user_characters_user_id ON public.user_characters(user_id);
CREATE INDEX idx_questions_category_status_created ON public.questions(category_id, status, created_at DESC);
CREATE INDEX idx_questions_creator_id ON public.questions(creator_id);
CREATE INDEX idx_questions_tags_gin ON public.questions USING GIN(tags);
CREATE INDEX idx_questions_title_trgm ON public.questions USING GIN(title gin_trgm_ops);
CREATE INDEX idx_question_traits_question_id ON public.question_traits(question_id);
CREATE INDEX idx_votes_question_id ON public.votes(question_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_user_traits_user_id ON public.user_traits(user_id);
CREATE INDEX idx_comments_question_created ON public.comments(question_id, created_at DESC);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_comment_id);
CREATE INDEX idx_question_reactions_question_id ON public.question_reactions(question_id);
CREATE INDEX idx_comment_reactions_comment_id ON public.comment_reactions(comment_id);
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_notifications_user_read_created ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_daily_missions_date ON public.daily_missions(mission_date);
CREATE INDEX idx_user_mission_progress_user_id ON public.user_mission_progress(user_id);

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_islands_updated_at BEFORE UPDATE ON public.islands FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_characters_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_user_characters_updated_at BEFORE UPDATE ON public.user_characters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_user_mission_progress_updated_at BEFORE UPDATE ON public.user_mission_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_vote_effects_procedure()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.selected_option = 'A' THEN
        UPDATE public.questions
        SET option_a_votes = option_a_votes + 1,
            total_votes = total_votes + 1,
            controversy_score = LEAST(option_a_votes + 1, option_b_votes)::NUMERIC / GREATEST(option_a_votes + option_b_votes + 1, 1),
            heat_score = heat_score + 1,
            updated_at = NOW()
        WHERE id = NEW.question_id;
    ELSE
        UPDATE public.questions
        SET option_b_votes = option_b_votes + 1,
            total_votes = total_votes + 1,
            controversy_score = LEAST(option_a_votes, option_b_votes + 1)::NUMERIC / GREATEST(option_a_votes + option_b_votes + 1, 1),
            heat_score = heat_score + 1,
            updated_at = NOW()
        WHERE id = NEW.question_id;
    END IF;

    UPDATE public.profiles
    SET total_participation_count = total_participation_count + 1,
        shell_balance = shell_balance + 1,
        updated_at = NOW()
    WHERE id = NEW.user_id;

    INSERT INTO public.user_traits (user_id, trait_key, score, updated_at)
    SELECT NEW.user_id, qt.trait_key, qt.weight, NOW()
    FROM public.question_traits qt
    WHERE qt.question_id = NEW.question_id
      AND qt.option_side = NEW.selected_option
    ON CONFLICT (user_id, trait_key)
    DO UPDATE SET score = public.user_traits.score + EXCLUDED.score,
                  updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vote_submitted
    AFTER INSERT ON public.votes
    FOR EACH ROW EXECUTE FUNCTION public.handle_vote_effects_procedure();

CREATE OR REPLACE FUNCTION public.match_questions_by_embedding(
    query_embedding VECTOR(1536),
    match_threshold NUMERIC DEFAULT 0.78,
    match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    option_a_title TEXT,
    option_b_title TEXT,
    category_id UUID,
    similarity NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        questions.id,
        questions.title,
        questions.option_a_title,
        questions.option_b_title,
        questions.category_id,
        1 - (questions.embedding <=> query_embedding) AS similarity
    FROM public.questions
    WHERE questions.embedding IS NOT NULL
      AND 1 - (questions.embedding <=> query_embedding) >= match_threshold
      AND questions.status IN ('pending', 'approved')
    ORDER BY questions.embedding <=> query_embedding
    LIMIT match_count;
$$;

INSERT INTO public.categories (name, slug, emoji, description, sort_order) VALUES
('푸드', 'food', '🍜', '취향과 루틴이 드러나는 음식 선택', 10),
('라이프', 'life', '🌿', '일상, 소비, 휴식, 관계의 생활 밸런스', 20),
('연애', 'romance', '💘', '연애관과 관계 감각을 보여주는 선택', 30),
('커리어', 'career', '💼', '일, 성장, 안정, 도전 사이의 선택', 40),
('문화', 'culture', '🎬', '콘텐츠, 여행, 취미, 취향의 선택', 50)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    emoji = EXCLUDED.emoji,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

WITH category_rows AS (
    SELECT id, slug FROM public.categories
)
INSERT INTO public.islands (category_id, name, slug, description, image_url, background_color, required_trait_key, min_trait_score, sort_order)
SELECT category_rows.id, seed.name, seed.slug, seed.description, seed.image_url, seed.background_color, seed.required_trait_key, seed.min_trait_score, seed.sort_order
FROM (VALUES
    ('food', '맛의 섬', 'taste-island', '즉흥적인 한입과 든든한 한끼가 공존하는 섬', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', '#FEF3C7', 'adventurous', 3, 10),
    ('life', '루틴 섬', 'routine-island', '나만의 생활 리듬과 회복 방식을 발견하는 섬', 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94', '#DCFCE7', 'planner', 3, 20),
    ('romance', '하트 섬', 'heart-island', '마음의 속도와 표현 방식을 탐험하는 섬', 'https://images.unsplash.com/photo-1518199266791-5375a83190b7', '#FFE4E6', 'expressive', 3, 30),
    ('career', '성장 섬', 'growth-island', '안정과 도전 사이에서 나의 일하는 방식을 찾는 섬', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72', '#DBEAFE', 'ambitious', 3, 40),
    ('culture', '취향 섬', 'taste-culture-island', '나를 설레게 하는 콘텐츠와 경험을 모으는 섬', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66', '#EDE9FE', 'curious', 3, 50)
) AS seed(category_slug, name, slug, description, image_url, background_color, required_trait_key, min_trait_score, sort_order)
JOIN category_rows ON category_rows.slug = seed.category_slug
ON CONFLICT (slug) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    background_color = EXCLUDED.background_color,
    required_trait_key = EXCLUDED.required_trait_key,
    min_trait_score = EXCLUDED.min_trait_score,
    sort_order = EXCLUDED.sort_order;

WITH island_rows AS (
    SELECT id, slug FROM public.islands
)
INSERT INTO public.characters (island_id, name, slug, description, image_url, rarity, unlock_trait_key, unlock_trait_score, sort_order)
SELECT island_rows.id, seed.name, seed.slug, seed.description, seed.image_url, seed.rarity, seed.unlock_trait_key, seed.unlock_trait_score, seed.sort_order
FROM (VALUES
    ('taste-island', '미식 탐험가 포포', 'food-popo', '새로운 메뉴 앞에서 눈이 반짝이는 밸런스 탐험가', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', 'common', 'adventurous', 2, 10),
    ('routine-island', '루틴 정원사 루미', 'life-rumi', '작은 습관을 차곡차곡 키우는 섬의 정원사', 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5', 'common', 'planner', 2, 20),
    ('heart-island', '하트 항해사 라라', 'romance-lala', '솔직한 마음으로 관계의 파도를 건너는 항해사', 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2', 'rare', 'expressive', 4, 30),
    ('growth-island', '커리어 조타수 노아', 'career-noa', '목표를 향해 균형 있게 방향을 잡는 조타수', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', 'rare', 'ambitious', 4, 40),
    ('taste-culture-island', '취향 큐레이터 모모', 'culture-momo', '좋아하는 장면과 사운드를 수집하는 큐레이터', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81', 'epic', 'curious', 5, 50)
) AS seed(island_slug, name, slug, description, image_url, rarity, unlock_trait_key, unlock_trait_score, sort_order)
JOIN island_rows ON island_rows.slug = seed.island_slug
ON CONFLICT (slug) DO UPDATE SET
    island_id = EXCLUDED.island_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    rarity = EXCLUDED.rarity,
    unlock_trait_key = EXCLUDED.unlock_trait_key,
    unlock_trait_score = EXCLUDED.unlock_trait_score,
    sort_order = EXCLUDED.sort_order;

DO $$
DECLARE
    food_id UUID;
    life_id UUID;
    romance_id UUID;
    career_id UUID;
    culture_id UUID;
    qid UUID;
BEGIN
    SELECT id INTO food_id FROM public.categories WHERE slug = 'food';
    SELECT id INTO life_id FROM public.categories WHERE slug = 'life';
    SELECT id INTO romance_id FROM public.categories WHERE slug = 'romance';
    SELECT id INTO career_id FROM public.categories WHERE slug = 'career';
    SELECT id INTO culture_id FROM public.categories WHERE slug = 'culture';

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '평생 하나만 먹는다면?', '질리지 않는 한끼와 강렬한 한입 중 더 오래 버틸 선택은?', food_id, ARRAY['푸드','평생메뉴','취향'], '따뜻한 국밥 한 그릇', '든든하고 안정적인 국물 한끼', 'https://images.unsplash.com/photo-1547592166-23ac45744acd', '매일 바뀌는 셰프의 파스타', '새롭고 화려한 맛의 변주', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141', 'approved', TRUE, 1.2);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','comfort_seeker',1.4),(qid,'B','adventurous',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '야식으로 더 끌리는 조합은?', '오늘 하루를 닫는 마지막 맛을 고른다면?', food_id, ARRAY['야식','간식','취향'], '매콤한 떡볶이와 튀김', '자극적이고 에너지 있는 야식', 'https://images.unsplash.com/photo-1635363638580-c2809d049eee', '담백한 샌드위치와 수프', '부담 없이 편안한 마무리', 'https://images.unsplash.com/photo-1528736235302-52922df5c122', 'approved', TRUE, 1.1);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','stimulus_seeker',1.3),(qid,'B','balanced',1.2);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '카페에서 딱 하나만 주문한다면?', '분위기보다 맛, 맛보다 루틴일 때의 선택은?', food_id, ARRAY['카페','음료','디저트'], '진한 아이스 아메리카노', '깔끔하고 확실한 기본값', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085', '계절 한정 크림 라떼', '새로운 달콤함과 기분 전환', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93', 'approved', TRUE, 1.0);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','minimalist',1.2),(qid,'B','novelty_seeker',1.3);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '친구들과 외식 장소를 정한다면?', '모두의 만족과 나만의 발견 사이에서 고르기', food_id, ARRAY['외식','친구','선택'], '검증된 맛집 예약', '실패 확률을 줄이는 안정적 선택', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', '골목의 새 식당 도전', '아직 모르는 맛을 찾아가는 선택', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', 'approved', TRUE, 1.2);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','reliability',1.4),(qid,'B','adventurous',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '디저트는 어느 쪽?', '마지막 한입에서 더 행복한 쪽은?', food_id, ARRAY['디저트','달달함','카페'], '꾸덕한 초콜릿 케이크', '깊고 진한 만족감', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587', '상큼한 과일 타르트', '가볍고 산뜻한 기분 전환', 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13', 'approved', TRUE, 1.0);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','indulgent',1.3),(qid,'B','freshness_seeker',1.3);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '여행지에서 첫 식사는?', '도착하자마자 어떤 맛으로 여행을 시작할까?', food_id, ARRAY['여행','로컬','맛집'], '현지인이 추천한 로컬 음식', '낯선 도시를 맛으로 이해하기', 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0', '숙소 근처 익숙한 프랜차이즈', '피곤할 때 실패 없는 편안함', 'https://images.unsplash.com/photo-1550547660-d9450f859349', 'approved', TRUE, 1.2);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','curious',1.5),(qid,'B','comfort_seeker',1.2);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '휴일 아침 루틴은?', '아무 약속 없는 아침을 어떻게 쓰고 싶은가?', life_id, ARRAY['라이프','휴일','루틴'], '일찍 일어나 산책', '몸과 마음을 깨우는 시작', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8', '늦잠 자고 천천히 브런치', '회복을 최우선으로 둔 시작', 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03', 'approved', TRUE, 1.1);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','disciplined',1.3),(qid,'B','rest_oriented',1.3);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '월급날 가장 먼저 하는 일은?', '돈을 대하는 나의 기본값은 어디에 가까울까?', life_id, ARRAY['소비','저축','월급'], '저축과 투자 자동이체', '미래 안정감을 먼저 확보', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f', '위시리스트 하나 결제', '나를 위한 즉각적인 보상', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f', 'approved', TRUE, 1.2);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','future_oriented',1.5),(qid,'B','present_focused',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '집 정리 스타일은?', '내 공간을 다루는 방식에서 드러나는 성향은?', life_id, ARRAY['집','정리','생활'], '매일 10분씩 꾸준히 정리', '루틴으로 공간을 유지', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36', '한 번에 몰아서 대청소', '에너지가 올 때 확실히 해결', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952', 'approved', TRUE, 1.0);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','planner',1.4),(qid,'B','burst_energy',1.2);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '스트레스 해소법은?', '쌓인 감정을 풀 때 더 잘 맞는 방식은?', life_id, ARRAY['스트레스','회복','일상'], '혼자 조용히 쉬기', '자극을 줄이고 에너지 회복', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773', '친구 만나 수다 떨기', '관계 속에서 감정 풀기', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac', 'approved', TRUE, 1.1);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','introverted_recharge',1.5),(qid,'B','social_recharge',1.5);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '새로운 취미를 시작한다면?', '배움의 방식에서 더 끌리는 선택은?', life_id, ARRAY['취미','배움','루틴'], '클래스 등록하고 체계적으로', '가이드와 커리큘럼으로 배우기', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3', '장비부터 사고 독학으로', '스스로 부딪히며 익히기', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40', 'approved', TRUE, 1.0);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','structured_learning',1.4),(qid,'B','self_directed',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '약속 없는 금요일 밤은?', '주말을 여는 에너지를 어디에 쓰고 싶을까?', life_id, ARRAY['금요일','휴식','친구'], '집에서 좋아하는 것 몰아보기', '나만의 속도로 깊게 쉬기', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba', '즉흥 번개 모임 나가기', '예상 밖의 재미를 만나기', 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce', 'approved', TRUE, 1.1);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','cozy',1.3),(qid,'B','spontaneous',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '첫 데이트 장소는?', '어색함을 풀기에 더 좋은 선택은?', romance_id, ARRAY['연애','데이트','첫만남'], '조용한 와인바', '대화에 집중하는 분위기', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3', '활기찬 전시나 팝업', '같이 구경하며 자연스럽게 가까워지기', 'https://images.unsplash.com/photo-1531058020387-3be344556be6', 'approved', TRUE, 1.2);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','deep_connection',1.4),(qid,'B','playful',1.3);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '연락 스타일은?', '관계에서 더 편안한 템포는?', romance_id, ARRAY['연락','연애관','관계'], '짧아도 자주 주고받기', '일상을 자주 공유하며 연결감 유지', 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42', '몰아서 길게 통화하기', '시간을 내어 깊게 대화하기', 'https://images.unsplash.com/photo-1516387938699-a93567ec168e', 'approved', TRUE, 1.1);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','frequent_connection',1.4),(qid,'B','deep_connection',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '기념일 선물은?', '마음을 전하는 방식에서 더 나다운 것은?', romance_id, ARRAY['선물','기념일','표현'], '실용적인 고급 아이템', '오래 쓰며 생각나는 선물', 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f', '직접 만든 추억 앨범', '시간과 마음을 담은 선물', 'https://images.unsplash.com/photo-1519682337058-a94d519337bc', 'approved', TRUE, 1.0);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','practical',1.3),(qid,'B','sentimental',1.5);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '갈등이 생겼을 때?', '서로 상한 마음을 풀기 위한 첫 행동은?', romance_id, ARRAY['갈등','대화','연애'], '바로 만나서 이야기하기', '감정이 남아 있을 때 솔직하게 풀기', 'https://images.unsplash.com/photo-1516585427167-9f4af9627e6c', '하루 시간을 두고 정리하기', '생각을 가라앉힌 뒤 차분히 말하기', 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88', 'approved', TRUE, 1.2);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','direct',1.4),(qid,'B','reflective',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '이상적인 연애 속도는?', '마음이 움직일 때 더 자연스러운 흐름은?', romance_id, ARRAY['썸','속도','연애관'], '빠르게 확신하고 표현', '좋으면 숨기지 않는 직진형', 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70', '천천히 알아가며 확신', '시간 속에서 신뢰를 쌓는 신중형', 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486', 'approved', TRUE, 1.0);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','expressive',1.5),(qid,'B','cautious',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '커플 여행 스타일은?', '함께 떠날 때 더 행복한 여행은?', romance_id, ARRAY['커플여행','계획','즉흥'], '일정표 꽉 찬 여행', '둘이 놓치지 않고 알차게 즐기기', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', '숙소와 동네만 정한 여행', '여유롭게 흘러가는 시간을 즐기기', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', 'approved', TRUE, 1.1);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','planner',1.4),(qid,'B','spontaneous',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '직장을 고를 때 더 중요한 것은?', '오래 일할 곳을 선택하는 기준은?', career_id, ARRAY['커리어','회사','선택'], '안정적인 연봉과 복지', '예측 가능한 기반과 생활 안정', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85', '빠른 성장과 큰 권한', '높은 몰입과 도전 기회', 'https://images.unsplash.com/photo-1552664730-d307ca884978', 'approved', TRUE, 1.2);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','stability',1.5),(qid,'B','ambitious',1.5);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '일하는 방식은?', '성과가 잘 나는 환경은 어디에 가까운가?', career_id, ARRAY['업무방식','협업','집중'], '혼자 깊게 몰입하는 시간', '방해 없이 완성도를 올리기', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2', '팀과 자주 맞추는 협업', '빠른 피드백으로 방향을 맞추기', 'https://images.unsplash.com/photo-1556761175-b413da4baf72', 'approved', TRUE, 1.1);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','independent',1.4),(qid,'B','collaborative',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '새 프로젝트를 맡는다면?', '기회 앞에서 더 끌리는 역할은?', career_id, ARRAY['프로젝트','역할','성장'], '명확한 목표의 핵심 담당자', '책임 범위가 분명한 실행 역할', 'https://images.unsplash.com/photo-1553877522-43269d4ea984', '불확실한 신사업 리더', '길을 만들며 성장하는 역할', 'https://images.unsplash.com/photo-1559136555-9303baea8ebd', 'approved', TRUE, 1.2);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','execution_focused',1.4),(qid,'B','risk_taker',1.5);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '퇴근 후 자기계발은?', '성장을 위해 더 지속 가능한 방식은?', career_id, ARRAY['자기계발','퇴근','성장'], '30분씩 매일 꾸준히', '작지만 끊기지 않는 루틴', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3', '주말 하루 몰입해서', '긴 호흡으로 깊게 파고들기', 'https://images.unsplash.com/photo-1499750310107-5fef28a66643', 'approved', TRUE, 1.0);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','disciplined',1.4),(qid,'B','deep_work',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '피드백을 받는다면?', '나를 더 잘 성장시키는 피드백 방식은?', career_id, ARRAY['피드백','성장','업무'], '구체적인 개선점 바로 듣기', '빠르게 수정할 수 있는 직설적 피드백', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df', '장점부터 듣고 방향 잡기', '동기와 신뢰를 지키는 피드백', 'https://images.unsplash.com/photo-1556761175-4b46a572b786', 'approved', TRUE, 1.0);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','growth_minded',1.5),(qid,'B','encouragement_seeker',1.3);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '5년 뒤 더 원하는 모습은?', '커리어의 방향성을 한 단어로 고른다면?', career_id, ARRAY['목표','미래','커리어'], '전문성 깊은 스페셜리스트', '한 분야에서 강한 신뢰를 얻기', 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca', '여러 영역을 잇는 제너럴리스트', '문제를 넓게 보고 연결하기', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72', 'approved', TRUE, 1.1);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','specialist',1.5),(qid,'B','generalist',1.5);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '영화 취향은?', '오늘 밤 몰입하고 싶은 이야기는?', culture_id, ARRAY['영화','문화','취향'], '잔잔한 독립영화', '여운과 해석이 남는 이야기', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba', '스케일 큰 블록버스터', '시원한 몰입감과 볼거리', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1', 'approved', TRUE, 1.0);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','reflective',1.4),(qid,'B','spectacle_seeker',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '콘서트를 간다면?', '라이브에서 더 기대되는 순간은?', culture_id, ARRAY['공연','음악','콘서트'], '작은 클럽의 가까운 라이브', '아티스트와 숨결이 닿는 거리감', 'https://images.unsplash.com/photo-1506157786151-b8491531f063', '대형 공연장의 압도적 무대', '조명과 함성으로 꽉 찬 경험', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3', 'approved', TRUE, 1.1);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','intimate_experience',1.4),(qid,'B','high_energy',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '책을 고르는 기준은?', '서점에서 손이 먼저 가는 쪽은?', culture_id, ARRAY['책','독서','취향'], '평점 높은 베스트셀러', '많은 사람이 검증한 이야기', 'https://images.unsplash.com/photo-1519682337058-a94d519337bc', '표지가 끌리는 낯선 책', '직감으로 발견하는 나만의 책', 'https://images.unsplash.com/photo-1512820790803-83ca734da794', 'approved', TRUE, 1.0);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','reliability',1.3),(qid,'B','curious',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '주말 문화생활은?', '쉬는 날 나를 채우는 방식은?', culture_id, ARRAY['주말','문화생활','취미'], '미술관에서 조용히 감상', '천천히 보고 생각하는 시간', 'https://images.unsplash.com/photo-1531058020387-3be344556be6', '페스티벌에서 신나게 즐기기', '사람과 음악 속에서 에너지 충전', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30', 'approved', TRUE, 1.1);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','contemplative',1.4),(qid,'B','social_recharge',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '여행 기록 방식은?', '좋았던 순간을 남기는 나만의 방식은?', culture_id, ARRAY['여행','기록','사진'], '사진과 영상으로 촘촘히 남기기', '다시 볼 수 있는 장면을 모으기', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', '눈으로 보고 마음에 저장하기', '현재의 감각에 더 집중하기', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', 'approved', TRUE, 1.0);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','archiver',1.4),(qid,'B','present_focused',1.4);

    qid := gen_random_uuid();
    INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
    VALUES (qid, '게임을 한다면?', '플레이할 때 더 재미있는 방향은?', culture_id, ARRAY['게임','취미','몰입'], '스토리 탄탄한 싱글 플레이', '혼자 세계관에 깊게 빠지기', 'https://images.unsplash.com/photo-1511512578047-dfb367046420', '친구들과 경쟁하는 멀티 플레이', '순간 판단과 승부의 재미', 'https://images.unsplash.com/photo-1542751371-adc38448a05e', 'approved', TRUE, 1.1);
    INSERT INTO public.question_traits (question_id, option_side, trait_key, weight) VALUES (qid,'A','immersive',1.4),(qid,'B','competitive',1.4);
END $$;
