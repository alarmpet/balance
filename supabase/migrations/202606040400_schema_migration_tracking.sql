-- Migration application tracking.
-- Apply after 202606030900_expand_pet_asset_batch.sql.
--
-- Purpose: until now there was no way to tell which migrations had been
-- applied to a live Supabase project (comprehensive-review C3). This adds a
-- durable ledger and backfills the known prior versions so the live DB has a
-- truthful baseline. The table is internal-only (no anon/authenticated access).
--
-- Convention for future migrations: end every new migration file with an
-- INSERT into public.schema_migrations using its own version (the filename
-- timestamp prefix), e.g.
--   INSERT INTO public.schema_migrations (version, name)
--   VALUES ('202606041200', 'my_new_migration')
--   ON CONFLICT (version) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version text PRIMARY KEY,
  name text,
  applied_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.schema_migrations FROM anon;
REVOKE ALL ON public.schema_migrations FROM authenticated;
-- Backfill known prior migrations. Idempotent: only inserts missing versions
-- and never overwrites an existing applied_at.
INSERT INTO public.schema_migrations (version, name) VALUES
  ('202606011940', 'run_ready_security'),
  ('202606012125', 'gamification_foundation'),
  ('202606012330', 'feed_state_and_ledger_hardening'),
  ('202606020200', 'personality_pet_theme_economy'),
  ('202606021500', 'personality_insight_map'),
  ('202606021900', 'auth_profile_metadata'),
  ('202606030530', 'ai_edge_rate_limits'),
  ('202606030900', 'expand_pet_asset_batch'),
  ('202606040400', 'schema_migration_tracking'),
  ('202606040500', 'trait_contradictions'),
  ('202606040600', 'harden_internal_function_execute'),
  ('202606041900', 'question_submission_queue'),
  ('202606041930', 'security_advisory_rls_search_path')
ON CONFLICT (version) DO NOTHING;
