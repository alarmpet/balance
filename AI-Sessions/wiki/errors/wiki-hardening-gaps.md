---
type: error
date: 2026-06-03
status: active
source: Obsidian AI wiki hardening audit
---

# Wiki Hardening Gaps

## Summary

The initial Obsidian AI 업무 위키 setup was structurally present but incomplete as a durable multi-agent workflow.

## Confirmed Gaps

- Template root files were missing before hardening.
- `reference` command alias was missing.
- Wiki lint existed as a prompt but not as an executable check.
- Some source pages lacked YAML frontmatter.
- Several wiki files were local-only and untracked.
- `.obsidian/workspace.json` is a local workspace cache and should stay ignored.
- Secret lint needed path-aware false-positive guards for policy documents and prompts.
- `log.md` and `timeline.md` needed a clearer role split for agents.

## Prevention

- Run `npm.cmd run validate:wiki` before claiming the wiki is healthy.
- Keep raw source material in `AI-Sessions/raw/`.
- Keep processed reusable knowledge in `AI-Sessions/wiki/`.
- Update `index.md` and `log.md` after every important save or ingest.
