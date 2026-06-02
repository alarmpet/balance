-- Harden auth profile creation for social providers and magic-link users.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_nickname text;
  profile_avatar_url text;
BEGIN
  profile_nickname := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'name'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'user_name'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'preferred_username'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data #>> '{response,nickname}'), ''),
    'islander_' || substr(NEW.id::text, 1, 6)
  );

  profile_avatar_url := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'avatar_url'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'picture'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data #>> '{response,profile_image}'), '')
  );

  INSERT INTO public.profiles (
    id,
    nickname,
    avatar_url,
    shell_balance,
    streak_count,
    total_participation_count,
    today_participation_count
  )
  VALUES (
    NEW.id,
    left(profile_nickname, 24),
    profile_avatar_url,
    0,
    0,
    0,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname = COALESCE(public.profiles.nickname, EXCLUDED.nickname),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = now();

  PERFORM public.ensure_user_gamification_state(NEW.id);

  RETURN NEW;
END;
$$;
