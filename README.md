# Balance Island AI Agent Wiki

This repository is both the Balance Island app workspace and an Obsidian-compatible AI 업무 위키.

The wiki is designed for human + AI collaboration:

- Humans read Korean project context, decisions, and guides.
- Agents use English command keywords: `save`, `ingest`, `query`, `reference`, `lint`.
- Raw source material stays in `AI-Sessions/raw/` and is not modified by agents.
- Processed, reusable knowledge goes in `AI-Sessions/wiki/`.
- Session handoff material goes in `AI-Sessions/conversations/`.

Start with:

1. `START_HERE.md`
2. `CLAUDE.md` or `AGENTS.md`
3. `index.md`
4. `log.md`

Validation:

```powershell
npm.cmd run validate:wiki
```

App verification remains separate:

```powershell
npm.cmd run validate:pet-assets
npm.cmd run typecheck
```
