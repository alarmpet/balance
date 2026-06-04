-- Safe user-submitted question queue.
-- User submissions are text-only drafts and must stay pending until admin review.

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
INSERT INTO public.schema_migrations (version, name)
VALUES ('202606041900', 'question_submission_queue')
ON CONFLICT (version) DO NOTHING;
