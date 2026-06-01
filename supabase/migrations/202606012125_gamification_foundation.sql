CREATE TABLE IF NOT EXISTS public.shell_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL CHECK (amount <> 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  reason text NOT NULL,
  source_type text,
  source_id uuid,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_avatar_state (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  evolution_stage text DEFAULT 'egg' NOT NULL CHECK (evolution_stage IN ('egg', 'sprout', 'explorer', 'guardian', 'legendary')),
  level integer DEFAULT 1 NOT NULL CHECK (level BETWEEN 1 AND 99),
  experience integer DEFAULT 0 NOT NULL CHECK (experience >= 0),
  mood integer DEFAULT 80 NOT NULL CHECK (mood BETWEEN 0 AND 100),
  energy integer DEFAULT 80 NOT NULL CHECK (energy BETWEEN 0 AND 100),
  bond integer DEFAULT 0 NOT NULL CHECK (bond >= 0),
  hatch_progress integer DEFAULT 0 NOT NULL CHECK (hatch_progress BETWEEN 0 AND 10),
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_personality_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type_code varchar(4) NOT NULL,
  type_title text NOT NULL,
  solo_social_score numeric DEFAULT 0 NOT NULL,
  safe_adventure_score numeric DEFAULT 0 NOT NULL,
  plan_flow_score numeric DEFAULT 0 NOT NULL,
  calm_express_score numeric DEFAULT 0 NOT NULL,
  primary_trait_key text,
  secondary_trait_key text,
  computed_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shell_ledger_user_created ON public.shell_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_personality_snapshots_user_computed ON public.user_personality_snapshots(user_id, computed_at DESC);

ALTER TABLE public.shell_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatar_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personality_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shell_ledger_select_own" ON public.shell_ledger;
CREATE POLICY "shell_ledger_select_own"
ON public.shell_ledger
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_avatar_state_select_own" ON public.user_avatar_state;
CREATE POLICY "user_avatar_state_select_own"
ON public.user_avatar_state
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_personality_snapshots_select_own" ON public.user_personality_snapshots;
CREATE POLICY "user_personality_snapshots_select_own"
ON public.user_personality_snapshots
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.ensure_user_gamification_state(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_avatar_state (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_gamification_state(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.apply_shell_delta(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_source_type text,
  p_source_id uuid,
  p_idempotency_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_balance integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user id is required';
  END IF;

  IF p_amount = 0 THEN
    RAISE EXCEPTION 'amount must not be zero';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.shell_ledger
    WHERE idempotency_key = p_idempotency_key
  ) THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET
    shell_balance = shell_balance + p_amount,
    updated_at = now()
  WHERE id = p_user_id
    AND shell_balance + p_amount >= 0
  RETURNING shell_balance INTO next_balance;

  IF next_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient shell balance';
  END IF;

  INSERT INTO public.shell_ledger (
    user_id,
    amount,
    balance_after,
    reason,
    source_type,
    source_id,
    idempotency_key
  )
  VALUES (
    p_user_id,
    p_amount,
    next_balance,
    p_reason,
    p_source_type,
    p_source_id,
    p_idempotency_key
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_shell_delta(uuid, integer, text, text, uuid, text) FROM PUBLIC;

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

  PERFORM public.ensure_user_gamification_state(NEW.id);

  RETURN NEW;
END;
$$;

INSERT INTO public.user_avatar_state (user_id)
SELECT id
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

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
  next_total integer;
  next_stage text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_selected_option NOT IN ('A', 'B') THEN
    RAISE EXCEPTION 'selected option must be A or B';
  END IF;

  PERFORM 1
  FROM public.questions
  WHERE id = p_question_id
    AND status = 'approved'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question is not available for voting';
  END IF;

  PERFORM public.ensure_user_gamification_state(auth.uid());

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
    heat_score = heat_score + 1,
    updated_at = now()
  WHERE id = p_question_id;

  UPDATE public.profiles
  SET
    total_participation_count = total_participation_count + 1,
    today_participation_count = today_participation_count + 1,
    updated_at = now()
  WHERE id = auth.uid()
  RETURNING total_participation_count INTO next_total;

  PERFORM public.apply_shell_delta(
    auth.uid(),
    1,
    'vote',
    'question',
    p_question_id,
    'vote:' || auth.uid()::text || ':' || p_question_id::text
  );

  next_stage := CASE
    WHEN next_total >= 300 THEN 'legendary'
    WHEN next_total >= 100 THEN 'guardian'
    WHEN next_total >= 50 THEN 'explorer'
    WHEN next_total >= 10 THEN 'sprout'
    ELSE 'egg'
  END;

  UPDATE public.user_avatar_state
  SET
    evolution_stage = next_stage,
    level = CASE
      WHEN next_total >= 300 THEN 5
      WHEN next_total >= 100 THEN 4
      WHEN next_total >= 50 THEN 3
      WHEN next_total >= 10 THEN 2
      ELSE 1
    END,
    experience = experience + 5,
    hatch_progress = LEAST(10, hatch_progress + CASE WHEN evolution_stage = 'egg' THEN 1 ELSE 0 END),
    mood = LEAST(100, mood + 1),
    energy = LEAST(100, energy + 2),
    updated_at = now()
  WHERE user_id = auth.uid();

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

CREATE OR REPLACE FUNCTION public.claim_daily_checkin()
RETURNS public.shell_ledger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kst_date text := ((now() AT TIME ZONE 'Asia/Seoul')::date)::text;
  awarded boolean;
  ledger_row public.shell_ledger;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  PERFORM public.ensure_user_gamification_state(auth.uid());

  awarded := public.apply_shell_delta(
    auth.uid(),
    10,
    'daily_checkin',
    'daily_checkin',
    NULL,
    'daily_checkin:' || auth.uid()::text || ':' || kst_date
  );

  IF awarded THEN
    UPDATE public.user_avatar_state
    SET
      mood = LEAST(100, mood + 3),
      energy = LEAST(100, energy + 5),
      bond = bond + 1,
      updated_at = now()
    WHERE user_id = auth.uid();
  END IF;

  SELECT *
  INTO ledger_row
  FROM public.shell_ledger
  WHERE idempotency_key = 'daily_checkin:' || auth.uid()::text || ':' || kst_date;

  RETURN ledger_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.care_avatar(
  p_care_type text DEFAULT 'snack'
)
RETURNS public.user_avatar_state
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  care_cost integer;
  state_row public.user_avatar_state;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_care_type NOT IN ('snack', 'play', 'praise') THEN
    RAISE EXCEPTION 'care type must be snack, play, or praise';
  END IF;

  care_cost := CASE WHEN p_care_type = 'praise' THEN 0 ELSE 10 END;

  PERFORM public.ensure_user_gamification_state(auth.uid());

  IF care_cost > 0 THEN
    PERFORM public.apply_shell_delta(
      auth.uid(),
      -care_cost,
      'care_avatar_' || p_care_type,
      'avatar_care',
      NULL,
      'care:' || auth.uid()::text || ':' || p_care_type || ':' || gen_random_uuid()::text
    );
  END IF;

  UPDATE public.user_avatar_state
  SET
    mood = LEAST(100, mood + CASE WHEN p_care_type = 'snack' THEN 8 ELSE 4 END),
    energy = LEAST(100, energy + CASE WHEN p_care_type = 'play' THEN 8 ELSE 3 END),
    bond = bond + CASE WHEN p_care_type = 'praise' THEN 1 ELSE 2 END,
    updated_at = now()
  WHERE user_id = auth.uid()
  RETURNING * INTO state_row;

  RETURN state_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_daily_checkin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.care_avatar(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_vote(uuid, text, integer) TO authenticated;
