# Start Here

Balance Island has two working layers:

1. App code: `src/`, `supabase/`, `assets/`, `package.json`.
2. AI 업무 위키: `AI-Sessions/`, `CLAUDE.md`, `AGENTS.md`, `index.md`, `log.md`, `prompts/`.

Before work:

1. Read `AGENTS.md` if you are Codex or another non-Claude agent.
2. Read `CLAUDE.md` if you are Claude Code or Antigravity.
3. Read `index.md` to find relevant wiki pages.
4. Read `log.md` to understand recent context.
5. If the user says `save`, `ingest`, `query`, `reference`, or `lint`, follow the corresponding prompt in `prompts/`.

Do not store secrets in wiki pages, raw notes, screenshots, logs, or chat.

Use `npm.cmd run validate:wiki` before claiming the wiki structure is healthy.
