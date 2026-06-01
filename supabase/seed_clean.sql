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
