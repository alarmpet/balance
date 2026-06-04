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
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

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
    today_participation_count INTEGER DEFAULT 0 NOT NULL CHECK (today_participation_count >= 0),
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
SET search_path = public
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
('푸드', 'food', '🍜', '음식 취향, 야식, 카페, 친구와의 메뉴 선택 밸런스.', 10),
('라이프', 'life', '🌴', '일상 루틴, 휴식, 소비, 정리, 에너지 충전 방식.', 20),
('연애', 'romance', '💗', '연락, 표현, 데이트, 갈등 해결에서 드러나는 관계 성향.', 30),
('커리어', 'career', '🚀', '일하는 방식, 성장, 안정, 도전 사이의 선택.', 40),
('문화', 'culture', '🎬', '영화, 공연, 여행, 게임, 취미로 보는 취향 지도.', 50)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    emoji = EXCLUDED.emoji,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

WITH category_rows AS (
    SELECT id, slug FROM public.categories
),
seed(category_slug, name, slug, description, image_url, background_color, required_trait_key, min_trait_score, sort_order) AS (
    VALUES
    ('food', '맛탐험 해변', 'taste-island', '오늘의 한 입으로 취향 지도가 자라는 푸드 섬.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', '#FEF3C7', 'adventure', 3, 10),
    ('life', '루틴 라군', 'routine-island', '나만의 생활 리듬과 회복 방식이 쌓이는 평온한 섬.', 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94', '#DCFCE7', 'plan', 3, 20),
    ('romance', '하트 코브', 'heart-island', '마음의 속도와 표현 방식이 파도처럼 드러나는 섬.', 'https://images.unsplash.com/photo-1518199266791-5375a83190b7', '#FFE4E6', 'express', 3, 30),
    ('career', '성장 등대섬', 'growth-island', '도전과 안정 사이에서 나만의 방향을 밝히는 섬.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72', '#DBEAFE', 'safe', 3, 40),
    ('culture', '취향 페스티벌섬', 'culture-island', '좋아하는 이야기와 놀이가 반짝이는 문화 섬.', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66', '#EDE9FE', 'flow', 3, 50)
)
INSERT INTO public.islands (category_id, name, slug, description, image_url, background_color, required_trait_key, min_trait_score, sort_order)
SELECT category_rows.id, seed.name, seed.slug, seed.description, seed.image_url, seed.background_color, seed.required_trait_key, seed.min_trait_score, seed.sort_order
FROM seed
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
),
seed(island_slug, name, slug, description, image_url, rarity, unlock_trait_key, unlock_trait_score, sort_order) AS (
    VALUES
    ('taste-island', '포포', 'food-popo', '새 메뉴 앞에서 눈이 반짝이는 맛탐험 파트너.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', 'common', 'adventure', 2, 10),
    ('routine-island', '모모', 'life-momo', '작은 루틴과 포근한 휴식을 챙겨주는 섬 친구.', 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94', 'common', 'plan', 2, 20),
    ('heart-island', '라라', 'romance-lala', '마음의 파도와 표현 타이밍을 잘 읽는 항해사.', 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2', 'rare', 'express', 4, 30),
    ('growth-island', '노아', 'career-noa', '목표를 등대처럼 밝혀주는 성장형 길잡이.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', 'rare', 'safe', 4, 40),
    ('culture-island', '리리', 'culture-riri', '영화, 음악, 여행 기억을 모으는 취향 수집가.', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66', 'common', 'flow', 2, 50)
)
INSERT INTO public.characters (island_id, name, slug, description, image_url, rarity, unlock_trait_key, unlock_trait_score, sort_order)
SELECT island_rows.id, seed.name, seed.slug, seed.description, seed.image_url, seed.rarity, seed.unlock_trait_key, seed.unlock_trait_score, seed.sort_order
FROM seed
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

CREATE TEMP TABLE seed_balance_questions (
    seed_key TEXT PRIMARY KEY,
    question_id UUID DEFAULT gen_random_uuid(),
    category_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT[] NOT NULL,
    option_a_title TEXT NOT NULL,
    option_a_description TEXT,
    option_a_image_url TEXT NOT NULL,
    option_b_title TEXT NOT NULL,
    option_b_description TEXT,
    option_b_image_url TEXT NOT NULL,
    reward_score NUMERIC NOT NULL,
    a_trait_key TEXT NOT NULL,
    a_weight NUMERIC NOT NULL,
    b_trait_key TEXT NOT NULL,
    b_weight NUMERIC NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_balance_questions (
    seed_key, category_slug, title, description, tags,
    option_a_title, option_a_description, option_a_image_url,
    option_b_title, option_b_description, option_b_image_url,
    reward_score, a_trait_key, a_weight, b_trait_key, b_weight
) VALUES
('food-01','food','짜장면 vs 짬뽕, 오늘 딱 하나만 먹는다면?','오늘의 한 그릇으로 보는 안정파와 모험파의 선택.',ARRAY['푸드','중식','취향'],'A. 짜장면','달콤하고 진한 소스의 익숙한 행복.','https://images.unsplash.com/photo-1551183053-bf91a1d81141','B. 짬뽕','얼큰한 국물과 해산물의 시원한 한 방.','https://images.unsplash.com/photo-1612929633738-8fe44f7ec841',1.2,'safe',1.3,'adventure',1.5),
('food-02','food','야식 딱 하나만 허락된다면?','늦은 밤 마음을 달래줄 최종 메뉴를 고른다면.',ARRAY['푸드','야식','치킨'],'A. 바삭한 치킨','오늘의 피로를 한 입에 털어내는 든든함.','https://images.unsplash.com/photo-1562967914-608f82629710','B. 매콤한 떡볶이','입안이 뜨거워질수록 기분이 살아나는 맛.','https://images.unsplash.com/photo-1635363638580-c2809d049eee',1.1,'comfort',1.4,'express',1.4),
('food-03','food','카페에서 딱 한 잔만 주문한다면?','분위기보다 먼저 손이 가는 나의 기본값.',ARRAY['푸드','카페','음료'],'A. 아이스 아메리카노','깔끔하고 선명한 집중 모드.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085','B. 계절 한정 라떼','달콤하고 새로운 기분 전환.','https://images.unsplash.com/photo-1509042239860-f550ce710b93',1.0,'calm',1.4,'flow',1.4),
('food-04','food','친구들과 식당을 정해야 한다면?','모두의 만족과 새로운 발견 사이에서 고르기.',ARRAY['푸드','친구','외식'],'A. 검증된 맛집 예약','실패 확률을 줄이는 안정적인 선택.','https://images.unsplash.com/photo-1517248135467-4c7edcad34c4','B. 골목 안 새 식당 도전','아직 모르는 맛을 찾아가는 선택.','https://images.unsplash.com/photo-1555396273-367ea4eb4db5',1.2,'safe',1.4,'adventure',1.5),
('food-05','food','디저트로 내 기분을 고른다면?','밥 배와 디저트 배는 다른 세계니까.',ARRAY['푸드','디저트','기분'],'A. 꾸덕한 치즈케이크','차분하고 깊게 오래 남는 달콤함.','https://images.unsplash.com/photo-1533134242443-d4fd215305ad','B. 과일 듬뿍 빙수','밝고 시원하게 나눠 먹는 즐거움.','https://images.unsplash.com/photo-1563805042-7684c019e1cb',1.0,'calm',1.3,'social',1.4),
('food-06','food','마지막 한 입을 어떻게 먹는 편?','작은 습관에도 선택 성향은 숨어 있다.',ARRAY['푸드','습관','성향'],'A. 제일 맛있는 건 마지막에','기다릴 줄 아는 신중한 행복.','https://images.unsplash.com/photo-1621939514649-280e2ee25f60','B. 제일 맛있는 것부터 먼저','지금의 즐거움을 놓치지 않는 타입.','https://images.unsplash.com/photo-1606313564200-e75d5e30476c',1.0,'plan',1.4,'flow',1.4),
('life-01','life','완벽한 아침을 시작하는 방식은?','하루의 첫 장면에서 드러나는 생활 리듬.',ARRAY['라이프','아침','루틴'],'A. 일찍 일어나 스트레칭','몸과 마음을 정돈하는 계획형 시작.','https://images.unsplash.com/photo-1476480862126-209bfaa8edc8','B. 푹 자고 느긋한 브런치','회복을 먼저 챙기는 여유로운 시작.','https://images.unsplash.com/photo-1510626176961-4b57d4fbad03',1.1,'plan',1.5,'flow',1.4),
('life-02','life','월급날 가장 먼저 하는 일은?','내가 안심을 느끼는 방식은 어디에 가까울까.',ARRAY['라이프','소비','저축'],'A. 저축과 고정비 먼저 정리','미래의 안정감이 오늘의 보상.','https://images.unsplash.com/photo-1554224155-6726b3ff858f','B. 갖고 싶던 것 하나 결제','눈앞의 보상이 다음 달의 동력.','https://images.unsplash.com/photo-1512436991641-6745cdb1723f',1.2,'safe',1.5,'express',1.4),
('life-03','life','방 정리는 어떤 스타일?','공간을 다루는 방식도 성향을 보여준다.',ARRAY['라이프','정리','공간'],'A. 매일 10분씩 조금씩','작은 루틴으로 흐트러짐을 막는다.','https://images.unsplash.com/photo-1524758631624-e2822e304c36','B. 몰아서 한 번에 대청소','에너지 올 때 확실하게 끝낸다.','https://images.unsplash.com/photo-1581578731548-c64695cc6952',1.0,'plan',1.4,'flow',1.3),
('life-04','life','스트레스가 쌓인 날 회복법은?','나를 다시 충전시키는 가장 빠른 길.',ARRAY['라이프','휴식','회복'],'A. 혼자 조용히 산책','소음을 낮추고 생각을 정리한다.','https://images.unsplash.com/photo-1506126613408-eca07ce68773','B. 친구 만나 수다 떨기','말하면서 마음의 공기가 바뀐다.','https://images.unsplash.com/photo-1529156069898-49953e39b3ac',1.1,'solo',1.4,'social',1.4),
('life-05','life','새 취미를 시작한다면?','배움 앞에서 내가 먼저 찾는 방식.',ARRAY['라이프','취미','배움'],'A. 강의부터 차근차근','단계가 보여야 오래 간다.','https://images.unsplash.com/photo-1516321318423-f06f85e504b3','B. 도구부터 사고 직접 해보기','손으로 부딪히며 빨리 감을 잡는다.','https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',1.0,'plan',1.4,'adventure',1.4),
('life-06','life','금요일 밤, 더 끌리는 쪽은?','주말을 여는 에너지의 방향.',ARRAY['라이프','주말','충전'],'A. 집에서 좋아하는 것 몰아보기','익숙한 공간에서 깊게 충전한다.','https://images.unsplash.com/photo-1489599849927-2ee91cede3ba','B. 번개 약속 잡고 나가기','예상 밖의 만남에서 활력이 생긴다.','https://images.unsplash.com/photo-1527529482837-4698179dc6ce',1.1,'solo',1.4,'social',1.4),
('romance-01','romance','연락 스타일은 어느 쪽이 편해?','관계에서 따뜻함을 느끼는 속도.',ARRAY['연애','연락','관계'],'A. 짧게라도 자주 연락','일상의 작은 신호가 안정감을 만든다.','https://images.unsplash.com/photo-1512428559087-560fa5ceab42','B. 몰아서 깊게 통화','빈도보다 밀도 있는 대화가 좋다.','https://images.unsplash.com/photo-1516387938699-a93567ec168e',1.1,'express',1.4,'calm',1.5),
('romance-02','romance','기념일 선물로 더 설레는 건?','마음을 받는 방식에도 취향이 있다.',ARRAY['연애','선물','표현'],'A. 실용적인 고급템','매일 쓰면서 떠올릴 수 있는 배려.','https://images.unsplash.com/photo-1513201099705-a9746e1e201f','B. 직접 만든 추억 상자','시간과 마음이 담긴 하나뿐인 선물.','https://images.unsplash.com/photo-1519682337058-a94d519337bc',1.0,'safe',1.4,'express',1.5),
('romance-03','romance','갈등이 생겼을 때 첫 행동은?','서로 상한 마음을 푸는 나의 방식.',ARRAY['연애','갈등','대화'],'A. 바로 만나 솔직히 말하기','커지기 전에 정면으로 풀어낸다.','https://images.unsplash.com/photo-1516585427167-9f4af9627e6c','B. 하루 정도 생각 정리하기','감정이 가라앉은 뒤 조심스럽게 말한다.','https://images.unsplash.com/photo-1499209974431-9dddcece7f88',1.2,'express',1.5,'calm',1.4),
('romance-04','romance','썸의 속도는 어느 쪽이 좋아?','마음이 커지는 속도를 고른다면.',ARRAY['연애','썸','속도'],'A. 확신이 오면 빠르게 표현','좋으면 숨기지 않는 직진 에너지.','https://images.unsplash.com/photo-1529333166437-7750a6dd5a70','B. 천천히 오래 확인','시간 속에서 믿음을 쌓아간다.','https://images.unsplash.com/photo-1522673607200-164d1b6ce486',1.0,'express',1.5,'safe',1.4),
('romance-05','romance','커플 여행에서 중요한 건?','같이 떠나는 날의 행복 조건.',ARRAY['연애','여행','데이트'],'A. 예약까지 탄탄한 일정','덜 헤매야 더 많이 즐긴다.','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee','B. 느슨한 루트와 자유 시간','예상 밖 순간이 여행을 만든다.','https://images.unsplash.com/photo-1507525428034-b723cf961d3e',1.1,'plan',1.4,'flow',1.4),
('romance-06','romance','애정 표현은 어느 쪽이 자연스러워?','마음을 드러내는 나만의 온도.',ARRAY['연애','표현','애정'],'A. 둘만 있을 때 조용히','안전한 공간에서 더 깊어진다.','https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2','B. 밖에서도 장난스럽게','좋은 기분은 같이 나눌수록 커진다.','https://images.unsplash.com/photo-1529333166437-7750a6dd5a70',1.0,'calm',1.4,'express',1.4),
('career-01','career','일할 때 더 잘 맞는 환경은?','성과가 나는 순간의 기본 조건.',ARRAY['커리어','업무','집중'],'A. 혼자 깊게 몰입하는 시간','방해 없이 완성도를 끌어올린다.','https://images.unsplash.com/photo-1497366811353-6870744d04b2','B. 빠르게 맞춰보는 팀 작업','피드백 속에서 방향이 선명해진다.','https://images.unsplash.com/photo-1556761175-b413da4baf72',1.1,'solo',1.5,'social',1.4),
('career-02','career','새 프로젝트에서 맡고 싶은 역할은?','기회 앞에서 끌리는 책임의 모양.',ARRAY['커리어','프로젝트','역할'],'A. 목표가 명확한 실행 담당','범위가 분명할 때 힘을 낸다.','https://images.unsplash.com/photo-1553877522-43269d4ea984','B. 방향을 만드는 초기 리더','불확실함 속에서 길을 만든다.','https://images.unsplash.com/photo-1559136555-9303baea8ebd',1.2,'safe',1.4,'adventure',1.5),
('career-03','career','이번 달 자기계발 방식은?','성장을 쌓는 나만의 페이스.',ARRAY['커리어','성장','학습'],'A. 매일 30분씩 꾸준히','작아도 멈추지 않는 루틴.','https://images.unsplash.com/photo-1516321318423-f06f85e504b3','B. 주말 하루 몰입해서','한 번에 깊게 파고드는 집중.','https://images.unsplash.com/photo-1499750310107-5fef28a66643',1.0,'plan',1.4,'flow',1.4),
('career-04','career','피드백을 받을 때 더 좋은 방식은?','나를 성장시키는 말의 온도.',ARRAY['커리어','피드백','성장'],'A. 바로 고칠 수 있는 직설 피드백','구체적이어야 다음 행동이 보인다.','https://images.unsplash.com/photo-1551836022-d5d88e9218df','B. 장점부터 짚어주는 피드백','안전해야 변화할 힘이 난다.','https://images.unsplash.com/photo-1556761175-4b46a572b786',1.0,'adventure',1.5,'safe',1.3),
('career-05','career','5년 뒤 더 원하는 모습은?','커리어 방향을 한 단어로 고른다면.',ARRAY['커리어','미래','목표'],'A. 한 분야의 깊은 전문가','강한 전문성으로 인정받는다.','https://images.unsplash.com/photo-1507537297725-24a1c029d3ca','B. 여러 분야를 잇는 제너럴리스트','넓게 보고 새 연결을 만든다.','https://images.unsplash.com/photo-1497366754035-f200968a6e72',1.1,'plan',1.5,'flow',1.5),
('career-06','career','제안이 왔다면 더 고민되는 쪽은?','안정과 도전 사이의 진짜 마음.',ARRAY['커리어','이직','안정'],'A. 안정적인 팀과 검증된 길','예측 가능할 때 더 잘 해낸다.','https://images.unsplash.com/photo-1497366754035-f200968a6e72','B. 작지만 가능성이 큰 팀','위험 속에 더 큰 이야기가 있다.','https://images.unsplash.com/photo-1559136555-9303baea8ebd',1.2,'safe',1.5,'adventure',1.5),
('culture-01','culture','오늘 밤 영화 취향은?','내가 보고 싶은 이야기의 온도.',ARRAY['문화','영화','취향'],'A. 잔잔한 독립영화','오래 남는 감정과 생각을 좋아한다.','https://images.unsplash.com/photo-1489599849927-2ee91cede3ba','B. 시원한 블록버스터','큰 화면과 몰입감이 주는 즐거움.','https://images.unsplash.com/photo-1440404653325-ab127d49abc1',1.0,'calm',1.4,'express',1.4),
('culture-02','culture','콘서트를 간다면 더 좋은 자리는?','라이브에서 기대하는 순간.',ARRAY['문화','공연','음악'],'A. 무대 가까운 작은 공연장','가까운 숨결과 디테일이 좋다.','https://images.unsplash.com/photo-1506157786151-b8491531f063','B. 대형 공연장의 화려한 무대','조명과 함성이 만든 큰 파도.','https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',1.1,'solo',1.4,'social',1.4),
('culture-03','culture','서점에서 책을 고르는 기준은?','취향의 안테나는 어디를 향할까.',ARRAY['문화','책','독서'],'A. 베스트셀러 매대','많은 사람이 검증한 이야기가 끌린다.','https://images.unsplash.com/photo-1519682337058-a94d519337bc','B. 표지가 부르는 낯선 책','직감이 알려주는 숨은 문을 연다.','https://images.unsplash.com/photo-1512820790803-83ca734da794',1.0,'safe',1.3,'adventure',1.4),
('culture-04','culture','주말 문화생활로 더 끌리는 건?','쉬는 날을 채우는 에너지의 색.',ARRAY['문화','주말','취미'],'A. 미술관에서 조용히 감상','천천히 보고 생각을 넓힌다.','https://images.unsplash.com/photo-1531058020387-3be344556be6','B. 야외 페스티벌에서 신나게','사람과 음악 속에서 충전된다.','https://images.unsplash.com/photo-1492684223066-81342ee5ff30',1.1,'calm',1.4,'express',1.4),
('culture-05','culture','여행 기록은 어떻게 남기고 싶어?','좋았던 시간을 붙잡는 방식.',ARRAY['문화','여행','기록'],'A. 사진과 영상으로 꼼꼼히','다시 볼 수 있는 장면을 모은다.','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee','B. 짧은 메모와 감정으로','그 순간의 느낌을 놓치지 않는다.','https://images.unsplash.com/photo-1507525428034-b723cf961d3e',1.0,'plan',1.4,'flow',1.4),
('culture-06','culture','게임을 한다면 더 끌리는 쪽은?','플레이할 때 내가 원하는 재미.',ARRAY['문화','게임','취미'],'A. 스토리 깊은 솔로 게임','혼자 세계관에 깊게 빠져든다.','https://images.unsplash.com/photo-1511512578047-dfb367046420','B. 친구들과 경쟁하는 멀티','웃고 겨루는 순간이 재미다.','https://images.unsplash.com/photo-1542751371-adc38448a05e',1.1,'solo',1.4,'social',1.4);

INSERT INTO public.questions (
    id,
    title,
    description,
    category_id,
    tags,
    option_a_title,
    option_a_description,
    option_a_image_url,
    option_b_title,
    option_b_description,
    option_b_image_url,
    status,
    is_official,
    reward_score
)
SELECT
    seed_balance_questions.question_id,
    seed_balance_questions.title,
    seed_balance_questions.description,
    categories.id,
    seed_balance_questions.tags,
    seed_balance_questions.option_a_title,
    seed_balance_questions.option_a_description,
    seed_balance_questions.option_a_image_url,
    seed_balance_questions.option_b_title,
    seed_balance_questions.option_b_description,
    seed_balance_questions.option_b_image_url,
    'approved',
    TRUE,
    seed_balance_questions.reward_score
FROM seed_balance_questions
JOIN public.categories ON categories.slug = seed_balance_questions.category_slug;

INSERT INTO public.question_traits (question_id, option_side, trait_key, weight)
SELECT question_id, 'A', a_trait_key, a_weight
FROM seed_balance_questions
UNION ALL
SELECT question_id, 'B', b_trait_key, b_weight
FROM seed_balance_questions;

-- Local rebuild support for migrations after the seed snapshot.
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version text PRIMARY KEY,
  name text,
  applied_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.schema_migrations FROM anon;
REVOKE ALL ON public.schema_migrations FROM authenticated;

CREATE OR REPLACE FUNCTION public.submit_user_question(
  p_title text,
  p_option_a_title text,
  p_option_b_title text,
  p_category_slug text DEFAULT 'life',
  p_description text DEFAULT NULL,
  p_is_anonymous boolean DEFAULT false
)
RETURNS public.questions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  normalized_title text;
  normalized_option_a text;
  normalized_option_b text;
  normalized_description text;
  normalized_category_slug text;
  selected_category_id uuid;
  inserted_question public.questions;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  normalized_title := trim(coalesce(p_title, ''));
  normalized_option_a := trim(coalesce(p_option_a_title, ''));
  normalized_option_b := trim(coalesce(p_option_b_title, ''));
  normalized_description := nullif(trim(coalesce(p_description, '')), '');
  normalized_category_slug := lower(trim(coalesce(p_category_slug, 'life')));

  IF char_length(normalized_title) < 4 OR char_length(normalized_title) > 160 THEN
    RAISE EXCEPTION 'Question title must be between 4 and 160 characters';
  END IF;

  IF char_length(normalized_option_a) < 1 OR char_length(normalized_option_a) > 80 THEN
    RAISE EXCEPTION 'Option A must be between 1 and 80 characters';
  END IF;

  IF char_length(normalized_option_b) < 1 OR char_length(normalized_option_b) > 80 THEN
    RAISE EXCEPTION 'Option B must be between 1 and 80 characters';
  END IF;

  IF normalized_description IS NOT NULL AND char_length(normalized_description) > 240 THEN
    RAISE EXCEPTION 'Description must be 240 characters or shorter';
  END IF;

  SELECT id
  INTO selected_category_id
  FROM public.categories
  WHERE slug = normalized_category_slug;

  IF selected_category_id IS NULL THEN
    RAISE EXCEPTION 'Invalid category slug';
  END IF;

  INSERT INTO public.profiles (id, nickname)
  VALUES (current_user_id, 'islander_' || substr(current_user_id::text, 1, 6))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.questions (
    creator_id,
    title,
    description,
    category_id,
    tags,
    option_a_title,
    option_a_description,
    option_a_image_url,
    option_b_title,
    option_b_description,
    option_b_image_url,
    status,
    visibility,
    is_official,
    is_anonymous
  )
  VALUES (
    current_user_id,
    normalized_title,
    normalized_description,
    selected_category_id,
    ARRAY[normalized_category_slug, 'user-submitted'],
    normalized_option_a,
    NULL,
    'pending://question-image/a',
    normalized_option_b,
    NULL,
    'pending://question-image/b',
    'pending',
    'private',
    false,
    coalesce(p_is_anonymous, false)
  )
  RETURNING * INTO inserted_question;

  RETURN inserted_question;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_user_question(text, text, text, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_user_question(text, text, text, text, text, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_user_question(text, text, text, text, text, boolean) TO authenticated;

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookmarks_select_own" ON public.bookmarks;
CREATE POLICY "bookmarks_select_own"
ON public.bookmarks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_insert_own" ON public.bookmarks;
CREATE POLICY "bookmarks_insert_own"
ON public.bookmarks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_delete_own" ON public.bookmarks;
CREATE POLICY "bookmarks_delete_own"
ON public.bookmarks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "follows_select_related" ON public.follows;
CREATE POLICY "follows_select_related"
ON public.follows
FOR SELECT
TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = following_id);

DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
CREATE POLICY "follows_insert_own"
ON public.follows
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;
CREATE POLICY "follows_delete_own"
ON public.follows
FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "comment_reactions_select_own" ON public.comment_reactions;
CREATE POLICY "comment_reactions_select_own"
ON public.comment_reactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "comment_reactions_insert_own" ON public.comment_reactions;
CREATE POLICY "comment_reactions_insert_own"
ON public.comment_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comment_reactions_delete_own" ON public.comment_reactions;
CREATE POLICY "comment_reactions_delete_own"
ON public.comment_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

INSERT INTO public.schema_migrations (version, name) VALUES
  ('202606041900', 'question_submission_queue'),
  ('202606041930', 'security_advisory_rls_search_path')
ON CONFLICT (version) DO NOTHING;

