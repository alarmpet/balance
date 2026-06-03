# 08. Templates

다른 프로젝트에 바로 복사해서 수정할 수 있는 템플릿입니다.

## START_HERE.md

```markdown
# Start Here

<PROJECT_NAME> has two working layers:

1. App code: `<APP_PATHS>`.
2. AI 업무 위키: `AI-Sessions/`, `AGENTS.md`, `CLAUDE.md`, `index.md`, `log.md`, `prompts/`.

Before work:

1. Read `AGENTS.md` if you are Codex or another non-Claude agent.
2. Read `CLAUDE.md` if you are Claude Code or Antigravity.
3. Read `index.md` to find relevant wiki pages.
4. Read `log.md` to understand recent context.
5. If the user says `save`, `ingest`, `query`, `reference`, or `lint`, follow the corresponding prompt in `prompts/`.

Do not store secrets in wiki pages, raw notes, screenshots, logs, or chat.

Use `npm.cmd run validate:wiki` before claiming the wiki structure is healthy.
```

## Wiki Document

```markdown
---
type: source | concept | decision | error | project | design | dev-task | handoff
date: YYYY-MM-DD
status: draft | active | superseded
source: optional
---

# Title

## Summary

## Context

## Details

## Links
```

## Decision

```markdown
---
type: decision
date: YYYY-MM-DD
status: active
source: <source-file-or-context>
---

# Decision Title

## Decision

## Why

## Alternatives Considered

## Consequences

## Review Date

## Links
```

## Error / Lesson

```markdown
---
type: error
date: YYYY-MM-DD
status: active
source: <source-file-or-context>
---

# Error Or Risk Title

## Symptom

## Root Cause

## What Did Not Work

## Fix Or Prevention

## Links
```

## log.md Line

```text
YYYY-MM-DD HH:mm | command | summary | linked files
```

Example:

```text
2026-06-03 19:20 | lint | wiki hardening gaps and prevention rules recorded | [[AI-Sessions/wiki/errors/wiki-hardening-gaps]]
```

## Prompt: reference.md

````markdown
# Reference Prompt

```text
옵시디언을 참조해서 이전 작업 맥락을 복원해줘.

먼저 CLAUDE.md 또는 AGENTS.md의 규칙을 확인해줘.

그 다음 index.md와 log.md를 읽고, 관련 AI-Sessions/wiki 문서를 찾아서 아래 형식으로 요약해줘.

1. 현재 프로젝트 맥락
2. 이미 결정된 사항
3. 최근 완료된 작업
4. 남은 작업
5. 지금 작업자가 가장 먼저 확인해야 할 파일

새 정보를 저장하지 말고, 읽은 근거 파일을 함께 적어줘.
```
````

## .gitignore

```gitignore
# Obsidian local workspace cache
.obsidian/workspace
.obsidian/workspace-mobile
.obsidian/workspace.json
.obsidian/workspace-mobile.json

# Local secrets
.env
.env.local
.env.*.local
.supabase-access-token
.supabase-access-token.txt
client_secret_*.json
```

## package.json Script

```json
{
  "scripts": {
    "validate:wiki": "node scripts/validate-wiki.mjs"
  }
}
```
