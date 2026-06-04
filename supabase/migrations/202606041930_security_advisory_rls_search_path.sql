-- Close remaining low-level Supabase security advisories.
-- These policies are intentionally narrow because bookmark/follow/comment-like
-- product surfaces are not fully launched yet.

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
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.match_questions_by_embedding(
  query_embedding vector(1536),
  match_threshold numeric DEFAULT 0.78,
  match_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  option_a_title text,
  option_b_title text,
  category_id uuid,
  similarity numeric
)
LANGUAGE sql
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
  LIMIT LEAST(GREATEST(match_count, 1), 20);
$$;
REVOKE ALL ON FUNCTION public.match_questions_by_embedding(vector(1536), numeric, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_questions_by_embedding(vector(1536), numeric, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_questions_by_embedding(vector(1536), numeric, integer) TO authenticated;
INSERT INTO public.schema_migrations (version, name)
VALUES ('202606041930', 'security_advisory_rls_search_path')
ON CONFLICT (version) DO NOTHING;
