-- Balance Island new Supabase project bootstrap
-- Generated locally from supabase/schema.sql and supabase/migrations/202606011940_run_ready_security.sql

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
('Food', 'food', 'food', 'Taste, comfort food, sharing, and everyday meal choices.', 10),
('Life', 'life', 'life', 'Daily routines, rest, spending, and personal rhythm choices.', 20),
('Romance', 'romance', 'heart', 'Relationship style, affection, distance, and communication choices.', 30),
('Career', 'career', 'career', 'Work style, growth, stability, and ambition choices.', 40),
('Culture', 'culture', 'culture', 'Movies, concerts, hobbies, travel, and taste choices.', 50)
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
    ('food', 'Taste Island', 'taste-island', 'A sunny island for people who reveal themselves through food choices.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', '#FEF3C7', 'adventurous', 3, 10),
    ('life', 'Routine Island', 'routine-island', 'A calm island where daily rhythm and recharge styles grow.', 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94', '#DCFCE7', 'planner', 3, 20),
    ('romance', 'Heart Island', 'heart-island', 'A warm island for affection, honesty, and relationship tempo.', 'https://images.unsplash.com/photo-1518199266791-5375a83190b7', '#FFE4E6', 'expressive', 3, 30),
    ('career', 'Growth Island', 'growth-island', 'A bright island for work choices, challenge, and long-term goals.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72', '#DBEAFE', 'ambitious', 3, 40),
    ('culture', 'Culture Island', 'culture-island', 'A playful island where tastes, stories, and weekend energy gather.', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66', '#EDE9FE', 'curious', 3, 50)
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
    ('taste-island', 'Popo the Menu Scout', 'food-popo', 'A cheerful guide who shines near new menus and brave bites.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', 'common', 'adventurous', 2, 10),
    ('routine-island', 'Momo the Routine Keeper', 'life-momo', 'A gentle companion who protects small rituals and cozy recovery.', 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94', 'common', 'planner', 2, 20),
    ('heart-island', 'Lala the Heart Sailor', 'romance-lala', 'A sincere navigator who reads waves of affection and timing.', 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2', 'rare', 'expressive', 4, 30),
    ('growth-island', 'Noa the Compass Builder', 'career-noa', 'A focused builder who turns goals into steady direction.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', 'rare', 'ambitious', 4, 40),
    ('culture-island', 'Riri the Story Collector', 'culture-riri', 'A curious collector of films, music, memories, and lively weekends.', 'https://images.unsplash.com/photo-1517602302552-471fe67acf66', 'common', 'curious', 2, 50)
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
('food-01','food','One forever ramen bowl','If you could keep only one late-night comfort bowl, which one wins?',ARRAY['food','comfort','ramen'],'Deep beef broth ramen','Stable, rich, and reliable comfort.','https://images.unsplash.com/photo-1569718212165-3a8278d5f624','Spicy seafood ramen','Bright, bold, and full of surprise.','https://images.unsplash.com/photo-1612929633738-8fe44f7ec841',1.2,'stability',1.3,'adventurous',1.5),
('food-02','food','Lunch ending move','What feels like the best final bite after a busy day?',ARRAY['food','lunch','taste'],'Crispy gimbap combo','Clean, familiar, and easy to share.','https://images.unsplash.com/photo-1635363638580-c2809d049eee','Loaded sandwich plate','Hearty, fast, and satisfying.','https://images.unsplash.com/photo-1528736235302-52922df5c122',1.1,'practical',1.2,'indulgent',1.3),
('food-03','food','Cafe order showdown','At a sunny cafe, which cup matches you better?',ARRAY['food','cafe','drink'],'Iced americano','Sharp, simple, and focused.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085','Seasonal cream latte','Soft, sweet, and mood changing.','https://images.unsplash.com/photo-1509042239860-f550ce710b93',1.0,'minimalist',1.4,'sensory',1.4),
('food-04','food','Group dinner pick','Friends are hungry and waiting. What do you choose?',ARRAY['food','friends','choice'],'Reserved proven restaurant','Lower risk and guaranteed smiles.','https://images.unsplash.com/photo-1517248135467-4c7edcad34c4','Tiny alley discovery','A little risk for a memorable story.','https://images.unsplash.com/photo-1555396273-367ea4eb4db5',1.2,'reliability',1.4,'explorer',1.5),
('food-05','food','Dessert personality','Which dessert energy follows you around?',ARRAY['food','dessert','mood'],'Classic cheesecake','Smooth, calm, and trustworthy.','https://images.unsplash.com/photo-1533134242443-d4fd215305ad','Wild fruit shaved ice','Colorful, playful, and shareable.','https://images.unsplash.com/photo-1563805042-7684c019e1cb',1.0,'classic_taste',1.3,'playful',1.4),
('food-06','food','Snack stash rule','How do you treat your secret snack drawer?',ARRAY['food','snack','routine'],'Save the best for last','Patient joy and careful timing.','https://images.unsplash.com/photo-1621939514649-280e2ee25f60','Open the best first','Life is short and flavor is now.','https://images.unsplash.com/photo-1606313564200-e75d5e30476c',1.0,'patient',1.4,'spontaneous',1.4),
('life-01','life','Morning routine style','How should a perfect morning begin?',ARRAY['life','morning','routine'],'Wake early and stretch','A clean start with control.','https://images.unsplash.com/photo-1476480862126-209bfaa8edc8','Slow brunch after sleeping in','Recovery first, plans later.','https://images.unsplash.com/photo-1510626176961-4b57d4fbad03',1.1,'planner',1.5,'restful',1.4),
('life-02','life','Payday first move','Your paycheck lands. What happens first?',ARRAY['life','money','spending'],'Auto-save and invest','Future safety feels rewarding.','https://images.unsplash.com/photo-1554224155-6726b3ff858f','Buy one wanted treat','A visible reward keeps motivation alive.','https://images.unsplash.com/photo-1512436991641-6745cdb1723f',1.2,'future_focused',1.5,'reward_seeker',1.4),
('life-03','life','Room reset method','Which cleaning rhythm fits your brain?',ARRAY['life','home','cleaning'],'Ten minutes every day','Small loops keep chaos away.','https://images.unsplash.com/photo-1524758631624-e2822e304c36','One big reset session','Energy arrives in dramatic waves.','https://images.unsplash.com/photo-1581578731548-c64695cc6952',1.0,'consistent',1.4,'burst_energy',1.3),
('life-04','life','Stress recovery choice','After a draining day, what repairs you faster?',ARRAY['life','stress','recharge'],'Quiet solo walk','Space, silence, and lower noise.','https://images.unsplash.com/photo-1506126613408-eca07ce68773','Talk it out with friends','Connection turns pressure into air.','https://images.unsplash.com/photo-1529156069898-49953e39b3ac',1.1,'intro_reflective',1.4,'social_recharge',1.4),
('life-05','life','New hobby entry','How do you begin learning something new?',ARRAY['life','hobby','learning'],'Structured online course','Clear steps make progress visible.','https://images.unsplash.com/photo-1516321318423-f06f85e504b3','Buy supplies and experiment','Hands-on play teaches quickly.','https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',1.0,'methodical',1.4,'experimental',1.4),
('life-06','life','Friday night battery','What sounds like the better Friday reset?',ARRAY['life','weekend','rest'],'Favorite things at home','Familiar comfort and deep recharge.','https://images.unsplash.com/photo-1489599849927-2ee91cede3ba','Last-minute meetup','Fresh energy from unexpected plans.','https://images.unsplash.com/photo-1527529482837-4698179dc6ce',1.1,'comfort_seeker',1.4,'spontaneous',1.4),
('romance-01','romance','Message tempo','In a relationship, which contact style feels warmer?',ARRAY['romance','message','relationship'],'Small frequent updates','Everyday signals build closeness.','https://images.unsplash.com/photo-1512428559087-560fa5ceab42','Long focused calls','Depth matters more than frequency.','https://images.unsplash.com/photo-1516387938699-a93567ec168e',1.1,'consistent_affection',1.4,'deep_talker',1.5),
('romance-02','romance','Anniversary gift style','Which gift feels more like love?',ARRAY['romance','gift','affection'],'Useful premium item','Care that becomes part of daily life.','https://images.unsplash.com/photo-1513201099705-a9746e1e201f','Handmade memory box','Time and feeling wrapped together.','https://images.unsplash.com/photo-1519682337058-a94d519337bc',1.0,'practical_love',1.4,'sentimental',1.5),
('romance-03','romance','Conflict first move','A tense moment appears. What is the first move?',ARRAY['romance','conflict','communication'],'Talk honestly right away','Clear air before worry grows.','https://images.unsplash.com/photo-1516585427167-9f4af9627e6c','Take a day to cool down','Calm thoughts before careful words.','https://images.unsplash.com/photo-1499209974431-9dddcece7f88',1.2,'direct',1.5,'reflective',1.4),
('romance-04','romance','Ideal dating speed','Which pace sounds healthier?',ARRAY['romance','pace','dating'],'Decide and express quickly','When it feels right, say it clearly.','https://images.unsplash.com/photo-1529333166437-7750a6dd5a70','Let trust grow slowly','Time proves what excitement cannot.','https://images.unsplash.com/photo-1522673607200-164d1b6ce486',1.0,'expressive',1.5,'cautious',1.4),
('romance-05','romance','Couple trip vibe','What makes a trip together happier?',ARRAY['romance','travel','couple'],'Detailed plan with reservations','Less friction means more joy.','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee','Loose route and free time','Room for surprises keeps it alive.','https://images.unsplash.com/photo-1507525428034-b723cf961d3e',1.1,'planner',1.4,'free_spirit',1.4),
('romance-06','romance','Public affection line','Which expression feels natural?',ARRAY['romance','affection','style'],'Quiet private affection','Warmth belongs in safe spaces.','https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2','Visible playful affection','Joy gets brighter when shared.','https://images.unsplash.com/photo-1529333166437-7750a6dd5a70',1.0,'private_warmth',1.4,'playful',1.4),
('career-01','career','Best work mode','Which environment helps you produce better work?',ARRAY['career','work','focus'],'Deep solo focus block','Quiet concentration creates quality.','https://images.unsplash.com/photo-1497366811353-6870744d04b2','Fast team collaboration','Feedback and motion create momentum.','https://images.unsplash.com/photo-1556761175-b413da4baf72',1.1,'focused',1.5,'collaborative',1.4),
('career-02','career','New project role','A new project opens. Which role attracts you?',ARRAY['career','project','role'],'Clear execution owner','Defined scope and strong delivery.','https://images.unsplash.com/photo-1553877522-43269d4ea984','Ambiguous early leader','Find the path while building it.','https://images.unsplash.com/photo-1559136555-9303baea8ebd',1.2,'executor',1.4,'ambitious',1.5),
('career-03','career','Growth investment','How would you invest in yourself this month?',ARRAY['career','growth','learning'],'Daily 30-minute practice','Slow gains that never disappear.','https://images.unsplash.com/photo-1516321318423-f06f85e504b3','Weekend intensive sprint','Immersion that breaks old limits.','https://images.unsplash.com/photo-1499750310107-5fef28a66643',1.0,'consistent',1.4,'intense_growth',1.4),
('career-04','career','Feedback preference','Which feedback helps you grow faster?',ARRAY['career','feedback','work'],'Direct improvement notes','Specific truth turns into action.','https://images.unsplash.com/photo-1551836022-d5d88e9218df','Encouragement first','Safety opens the door to change.','https://images.unsplash.com/photo-1556761175-4b46a572b786',1.0,'growth_minded',1.5,'encouragement_seeker',1.3),
('career-05','career','Five-year shape','Which future career shape feels better?',ARRAY['career','future','goal'],'Deep specialist','Strong leverage in one field.','https://images.unsplash.com/photo-1507537297725-24a1c029d3ca','Wide generalist','Connect many fields into ideas.','https://images.unsplash.com/photo-1497366754035-f200968a6e72',1.1,'specialist',1.5,'generalist',1.5),
('career-06','career','Risk and stability','Which offer would you seriously consider?',ARRAY['career','risk','stability'],'Stable team and proven path','Predictability makes excellence easier.','https://images.unsplash.com/photo-1497366754035-f200968a6e72','Small team with big upside','Risk carries a bigger story.','https://images.unsplash.com/photo-1559136555-9303baea8ebd',1.2,'stability',1.5,'risk_taker',1.5),
('culture-01','culture','Movie night taste','What story should carry tonight?',ARRAY['culture','movie','taste'],'Quiet indie drama','Subtle feelings and lingering thoughts.','https://images.unsplash.com/photo-1489599849927-2ee91cede3ba','Big blockbuster','Scale, sound, and shared excitement.','https://images.unsplash.com/photo-1440404653325-ab127d49abc1',1.0,'reflective',1.4,'spectacle_seeker',1.4),
('culture-02','culture','Concert seat choice','Where would you rather be at a live show?',ARRAY['culture','concert','music'],'Small venue near the stage','Close energy and real detail.','https://images.unsplash.com/photo-1506157786151-b8491531f063','Large arena with full production','Lights, scale, and crowd waves.','https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',1.1,'intimate_experience',1.4,'high_energy',1.4),
('culture-03','culture','Book picking rule','What pulls your hand first in a bookstore?',ARRAY['culture','book','reading'],'Trusted bestseller shelf','Many readers already tested it.','https://images.unsplash.com/photo-1519682337058-a94d519337bc','Random cover that calls you','Instinct finds hidden doors.','https://images.unsplash.com/photo-1512820790803-83ca734da794',1.0,'reliability',1.3,'curious',1.4),
('culture-04','culture','Weekend culture plan','Which plan fills the weekend better?',ARRAY['culture','weekend','hobby'],'Quiet museum afternoon','Slow attention and clean inspiration.','https://images.unsplash.com/photo-1531058020387-3be344556be6','Outdoor festival evening','Music, people, and bright motion.','https://images.unsplash.com/photo-1492684223066-81342ee5ff30',1.1,'contemplative',1.4,'social_recharge',1.4),
('culture-05','culture','Travel memory style','How do you keep a good trip?',ARRAY['culture','travel','memory'],'Photos and short videos','A clear archive to revisit later.','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee','Tiny notes in the moment','Capture the feeling before it changes.','https://images.unsplash.com/photo-1507525428034-b723cf961d3e',1.0,'archiver',1.4,'present_focused',1.4),
('culture-06','culture','Game night direction','If tonight is game night, what do you pick?',ARRAY['culture','game','play'],'Story-driven solo adventure','Get lost in a crafted world.','https://images.unsplash.com/photo-1511512578047-dfb367046420','Competitive multiplayer','Pressure, laughter, and quick reads.','https://images.unsplash.com/photo-1542751371-adc38448a05e',1.1,'immersive',1.4,'competitive',1.4);

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



-- Run-ready security policies and RPCs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    nickname,
    shell_balance,
    streak_count,
    total_participation_count,
    today_participation_count
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'islander_' || substr(NEW.id::text, 1, 6)),
    0,
    0,
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_traits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "questions_public_read_approved" ON public.questions;
CREATE POLICY "questions_public_read_approved"
ON public.questions
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "question_traits_public_read" ON public.question_traits;
CREATE POLICY "question_traits_public_read"
ON public.question_traits
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "votes_select_own" ON public.votes;
CREATE POLICY "votes_select_own"
ON public.votes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "votes_insert_own" ON public.votes;
CREATE POLICY "votes_insert_own"
ON public.votes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "question_reactions_select_own" ON public.question_reactions;
CREATE POLICY "question_reactions_select_own"
ON public.question_reactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "question_reactions_insert_own" ON public.question_reactions;
CREATE POLICY "question_reactions_insert_own"
ON public.question_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_public_read" ON public.comments;
CREATE POLICY "comments_public_read"
ON public.comments
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
CREATE POLICY "comments_insert_own"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_traits_select_own" ON public.user_traits;
CREATE POLICY "user_traits_select_own"
ON public.user_traits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "islands_select_own" ON public.islands;
DROP POLICY IF EXISTS "islands_public_read" ON public.islands;
CREATE POLICY "islands_public_read"
ON public.islands
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "characters_select_own" ON public.characters;
DROP POLICY IF EXISTS "characters_public_read" ON public.characters;
CREATE POLICY "characters_public_read"
ON public.characters
FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.fetch_feed_questions(
  p_limit integer DEFAULT 30,
  p_cursor_created_at timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category_id uuid,
  category jsonb,
  tags text[],
  option_a_title text,
  option_a_description text,
  option_a_image_url text,
  option_b_title text,
  option_b_description text,
  option_b_image_url text,
  vote_count_a integer,
  vote_count_b integer,
  reaction_like_count integer,
  reaction_fun_count integer,
  reaction_hard_count integer,
  comment_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id,
    q.title,
    q.description,
    q.category_id,
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'slug', c.slug,
      'color', c.emoji
    ) AS category,
    q.tags,
    q.option_a_title,
    q.option_a_description,
    q.option_a_image_url,
    q.option_b_title,
    q.option_b_description,
    q.option_b_image_url,
    q.option_a_votes,
    q.option_b_votes,
    q.like_count,
    q.fun_count,
    q.hard_count,
    q.comment_count,
    q.created_at
  FROM public.questions q
  LEFT JOIN public.categories c ON c.id = q.category_id
  WHERE q.status = 'approved'
    AND (p_cursor_created_at IS NULL OR q.created_at < p_cursor_created_at)
    AND (
      auth.uid() IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM public.votes v
        WHERE v.question_id = q.id
          AND v.user_id = auth.uid()
      )
    )
  ORDER BY q.heat_score DESC NULLS LAST, q.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;

CREATE OR REPLACE FUNCTION public.submit_vote(
  p_question_id uuid,
  p_selected_option text,
  p_response_time_ms integer DEFAULT NULL
)
RETURNS public.votes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_vote public.votes;
  trait_record record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_selected_option NOT IN ('A', 'B') THEN
    RAISE EXCEPTION 'selected option must be A or B';
  END IF;

  INSERT INTO public.votes (
    user_id,
    question_id,
    selected_option,
    response_time_ms
  )
  VALUES (
    auth.uid(),
    p_question_id,
    p_selected_option,
    p_response_time_ms
  )
  RETURNING * INTO inserted_vote;

  UPDATE public.questions
  SET
    option_a_votes = option_a_votes + CASE WHEN p_selected_option = 'A' THEN 1 ELSE 0 END,
    option_b_votes = option_b_votes + CASE WHEN p_selected_option = 'B' THEN 1 ELSE 0 END,
    total_votes = total_votes + 1,
    updated_at = now()
  WHERE id = p_question_id;

  UPDATE public.profiles
  SET
    total_participation_count = total_participation_count + 1,
    today_participation_count = today_participation_count + 1,
    shell_balance = shell_balance + 1,
    updated_at = now()
  WHERE id = auth.uid();

  FOR trait_record IN
    SELECT trait_key, weight
    FROM public.question_traits
    WHERE question_id = p_question_id
      AND option_side = p_selected_option
  LOOP
    INSERT INTO public.user_traits (user_id, trait_key, score)
    VALUES (auth.uid(), trait_record.trait_key, trait_record.weight)
    ON CONFLICT (user_id, trait_key)
    DO UPDATE SET
      score = public.user_traits.score + EXCLUDED.score,
      updated_at = now();
  END LOOP;

  RETURN inserted_vote;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_reaction(
  p_question_id uuid,
  p_reaction_type text
)
RETURNS public.question_reactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_reaction public.question_reactions;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_reaction_type NOT IN ('like', 'fun', 'hard') THEN
    RAISE EXCEPTION 'reaction type must be like, fun, or hard';
  END IF;

  INSERT INTO public.question_reactions (
    user_id,
    question_id,
    reaction_type
  )
  VALUES (
    auth.uid(),
    p_question_id,
    p_reaction_type
  )
  RETURNING * INTO inserted_reaction;

  UPDATE public.questions
  SET
    like_count = like_count + CASE WHEN p_reaction_type = 'like' THEN 1 ELSE 0 END,
    fun_count = fun_count + CASE WHEN p_reaction_type = 'fun' THEN 1 ELSE 0 END,
    hard_count = hard_count + CASE WHEN p_reaction_type = 'hard' THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = p_question_id;

  RETURN inserted_reaction;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_feed_questions(integer, timestamptz) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_vote(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_reaction(uuid, text) TO authenticated;

