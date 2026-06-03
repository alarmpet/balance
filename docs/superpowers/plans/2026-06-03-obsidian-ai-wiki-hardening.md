# Obsidian AI Wiki Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the local Obsidian AI 업무 위키 setup into alignment with the AI-Agent-Wiki-Template, the attached screenshot requirements, and the current Balance Island repo state.

**Architecture:** Keep the existing repo root as the Obsidian vault and preserve existing project docs. Add the missing template artifacts, add the `reference` alias, add an executable wiki validator, standardize source frontmatter, and commit only the safe wiki system files while leaving secrets and local screenshots untracked.

**Tech Stack:** Markdown, Obsidian wikilinks, Node.js validation script, npm scripts, Git.

---

## Current Findings

- Implemented locally but not committed: `.obsidian/`, `AGENTS.md`, `CLAUDE.md`, `AI-Sessions/`, `index.md`, `log.md`, `prompts/`.
- Implemented: raw/wiki/conversations folder separation exists.
- Implemented: `save`, `ingest`, `query`, `lint` prompt files exist.
- Implemented: Korean human guidelines and English command keywords mostly exist.
- Missing: `reference` alias in `CLAUDE.md`, `AGENTS.md`, `prompts/reference.md`, and `index.md`.
- Missing: template root artifacts `README.md`, `START_HERE.md`, `TEMPLATE_MANIFEST.md`, `VERSION`, `LICENSE.md`.
- Missing: executable wiki lint/validation script. Template has `scripts/validate-template.sh`, but current repo only has `scripts/validate-pet-assets.mjs`.
- Partial: `AI-Sessions/wiki/sources/*` pages exist but do not consistently use YAML frontmatter.
- Risk: `/docs` and `AI-Sessions/raw` duplicate similar materials. For now, do not delete `/docs`; document canonical lookup rules and let lint detect duplicated source-like content.
- Risk: most wiki files are untracked. A future agent will not see them after clone unless they are committed.

## File Structure

### Create

- `README.md`: repo/vault overview for humans and agents.
- `START_HERE.md`: first-read guide for any agent entering the vault.
- `TEMPLATE_MANIFEST.md`: explicit file/dir manifest and adapted template version.
- `VERSION`: adapted wiki template version string.
- `LICENSE.md`: template/license note.
- `prompts/reference.md`: alias prompt for `query`.
- `scripts/validate-wiki.mjs`: cross-platform validator for wiki structure, command rules, frontmatter, index/log coverage, and secret-like text.

### Modify

- `CLAUDE.md`: add `reference` alias and explicit lint enforcement rule.
- `AGENTS.md`: add `reference` alias and explicit lint enforcement rule.
- `index.md`: add missing root artifacts and `prompts/reference`.
- `log.md`: append a hardening implementation entry.
- `package.json`: add `validate:wiki`.
- `AI-Sessions/wiki/sources/2026-06-03-comprehensive-review.md`: add YAML frontmatter.
- `AI-Sessions/wiki/sources/2026-06-03-pet-island-liveops-upgrade-review.md`: add YAML frontmatter.

### Do Not Modify

- `AI-Sessions/raw/**`: read-only source material.
- `.supabase-access-token.txt`: local ignored secret.
- `login-smoke.png`, `supabase-url-config-smoke.png`: local smoke evidence, leave untracked unless the user explicitly asks to preserve them.
- `docs/codex-reinstall-handoff.md`, `docs/2026-06-03-pet-island-liveops-upgrade-review.md`: currently local/untracked docs with prior encoding concerns; do not commit in this plan.

---

## Task 1: Add Missing Template Root Artifacts

**Files:**
- Create: `README.md`
- Create: `START_HERE.md`
- Create: `TEMPLATE_MANIFEST.md`
- Create: `VERSION`
- Create: `LICENSE.md`
- Modify: `index.md`
- Modify: `log.md`

- [ ] **Step 1: Create `VERSION`**

Create `VERSION` with exactly:

```text
1.0.0-balance-island
```

- [ ] **Step 2: Create `LICENSE.md`**

Create `LICENSE.md`:

```markdown
# License

This vault setup is adapted from the local `AI-Agent-Wiki-Template v1.0.0` reference supplied by the user.

Balance Island project code, documentation, and generated wiki notes remain part of this repository's existing ownership and licensing context.

Do not place secrets, tokens, passwords, private customer data, or provider credentials in this vault.
```

- [ ] **Step 3: Create `README.md`**

Create `README.md`:

```markdown
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
```

- [ ] **Step 4: Create `START_HERE.md`**

Create `START_HERE.md`:

```markdown
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
```

- [ ] **Step 5: Create `TEMPLATE_MANIFEST.md`**

Create `TEMPLATE_MANIFEST.md`:

```markdown
# Template Manifest

Adapted template: `AI-Agent-Wiki-Template v1.0.0`

## Required Root Files

- `README.md`
- `START_HERE.md`
- `CLAUDE.md`
- `AGENTS.md`
- `index.md`
- `log.md`
- `VERSION`
- `LICENSE.md`
- `TEMPLATE_MANIFEST.md`

## Required Directories

- `.obsidian/`
- `AI-Sessions/raw/`
- `AI-Sessions/conversations/`
- `AI-Sessions/wiki/sources/`
- `AI-Sessions/wiki/concepts/`
- `AI-Sessions/wiki/decisions/`
- `AI-Sessions/wiki/errors/`
- `AI-Sessions/wiki/projects/`
- `AI-Sessions/wiki/design/`
- `AI-Sessions/wiki/dev-tasks/`
- `prompts/`
- `scripts/`

## Required Command Prompts

- `prompts/save.md`
- `prompts/ingest.md`
- `prompts/query.md`
- `prompts/reference.md`
- `prompts/lint.md`

## Validation

Run:

```powershell
npm.cmd run validate:wiki
```
```

- [ ] **Step 6: Update `index.md`**

Under `## Start Here`, include links:

```markdown
- [[START_HERE]]
- [[README]]
- [[TEMPLATE_MANIFEST]]
- [[VERSION]]
- [[LICENSE]]
```

Under `## Prompt Library`, include:

```markdown
- [[prompts/reference]]
```

- [ ] **Step 7: Update `log.md`**

Append:

```text
2026-06-03 19:00 | save | Obsidian AI 업무 위키 템플릿 누락 루트 파일과 reference 명령 계획 반영 | [[README]], [[START_HERE]], [[TEMPLATE_MANIFEST]], [[prompts/reference]]
```

- [ ] **Step 8: Verify Task 1**

Run:

```powershell
Test-Path README.md,START_HERE.md,TEMPLATE_MANIFEST.md,VERSION,LICENSE.md
```

Expected: all five paths return `True`.

- [ ] **Step 9: Commit Task 1**

```powershell
git add README.md START_HERE.md TEMPLATE_MANIFEST.md VERSION LICENSE.md index.md log.md
git commit -m "Add wiki template root artifacts"
```

---

## Task 2: Add `reference` Command Alias

**Files:**
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md`
- Create: `prompts/reference.md`
- Modify: `index.md`
- Modify: `log.md`

- [ ] **Step 1: Update command lists in `CLAUDE.md`**

In the command keyword list, ensure this item exists:

```markdown
- `reference`: `query`와 동일하게 기존 wiki, index, log를 참조해 맥락을 복원한다.
```

In the Korean / English Hybrid section, ensure the command list includes:

```markdown
save, ingest, query, reference, lint
```

- [ ] **Step 2: Update command lists in `AGENTS.md`**

In the command keyword section, ensure this item exists:

```markdown
- `reference`: `query`와 동일하게 기존 vault에서 관련 맥락을 찾아 복원합니다.
```

Add this natural-language interpretation:

```markdown
"옵시디언 참조", "위키 참조", "이전 맥락 복원"은 `reference` 또는 `query`로 해석합니다.
```

- [ ] **Step 3: Create `prompts/reference.md`**

Create:

```markdown
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
```

- [ ] **Step 4: Update `index.md` prompt library**

Ensure:

```markdown
- [[prompts/reference]]
```

- [ ] **Step 5: Update `log.md`**

Append:

```text
2026-06-03 19:05 | save | reference 명령 alias를 CLAUDE/AGENTS 규칙과 prompt library에 추가 | [[CLAUDE]], [[AGENTS]], [[prompts/reference]], [[index]]
```

- [ ] **Step 6: Verify Task 2**

Run:

```powershell
rg -n "reference|옵시디언 참조|위키 참조" CLAUDE.md AGENTS.md prompts/reference.md index.md
```

Expected: matches in all four files.

- [ ] **Step 7: Commit Task 2**

```powershell
git add CLAUDE.md AGENTS.md prompts/reference.md index.md log.md
git commit -m "Add wiki reference command"
```

---

## Task 3: Add Executable Wiki Validation

**Files:**
- Create: `scripts/validate-wiki.mjs`
- Modify: `package.json`
- Modify: `prompts/lint.md`
- Modify: `log.md`

- [ ] **Step 1: Create `scripts/validate-wiki.mjs`**

Create:

```js
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const requiredFiles = [
  'README.md',
  'START_HERE.md',
  'CLAUDE.md',
  'AGENTS.md',
  'index.md',
  'log.md',
  'VERSION',
  'LICENSE.md',
  'TEMPLATE_MANIFEST.md',
  'prompts/save.md',
  'prompts/ingest.md',
  'prompts/query.md',
  'prompts/reference.md',
  'prompts/lint.md'
];

const requiredDirs = [
  'AI-Sessions/raw',
  'AI-Sessions/conversations',
  'AI-Sessions/wiki/sources',
  'AI-Sessions/wiki/concepts',
  'AI-Sessions/wiki/decisions',
  'AI-Sessions/wiki/errors',
  'AI-Sessions/wiki/projects',
  'AI-Sessions/wiki/design',
  'AI-Sessions/wiki/dev-tasks',
  'prompts',
  'scripts'
];

const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /sbp_[A-Za-z0-9_-]{20,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /service[_-]?role/i,
  /client[_-]?secret/i,
  /api[_-]?key\s*[:=]/i,
  /password\s*[:=]/i
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

for (const dir of requiredDirs) {
  if (!existsSync(dir)) failures.push(`Missing required directory: ${dir}`);
}

assertIncludes('CLAUDE.md', ['save', 'ingest', 'query', 'reference', 'lint']);
assertIncludes('AGENTS.md', ['save', 'ingest', 'query', 'reference', 'lint']);
assertIncludes('CLAUDE.md', ['AI-Sessions/raw/', 'AI-Sessions/wiki/', '5가지']);
assertIncludes('AGENTS.md', ['AI-Sessions/raw/', 'AI-Sessions/wiki/', '5가지']);
assertIncludes('index.md', ['[[prompts/save]]', '[[prompts/ingest]]', '[[prompts/query]]', '[[prompts/reference]]', '[[prompts/lint]]']);

for (const file of listMarkdownFiles('AI-Sessions/wiki')) {
  const content = readFileSync(file, 'utf8');
  if (!content.startsWith('---\n')) {
    failures.push(`Wiki file missing YAML frontmatter: ${file}`);
  }
}

for (const file of listMarkdownFiles('.')) {
  if (file.includes('node_modules') || file.includes('.git')) continue;
  if (file.includes('AI-Sessions/raw')) continue;
  const content = readFileSync(file, 'utf8');
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) {
      failures.push(`Potential secret-like text in ${file}: ${pattern}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Wiki validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Wiki validation passed.');

function assertIncludes(path, needles) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const needle of needles) {
    if (!content.includes(needle)) {
      failures.push(`${path} missing required text: ${needle}`);
    }
  }
}

function listMarkdownFiles(root) {
  const results = [];
  walk(root);
  return results;

  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      const rel = relative('.', path).replaceAll('\\\\', '/');
      if (rel.startsWith('node_modules/') || rel.startsWith('.git/') || rel.startsWith('dist/')) continue;
      const stat = statSync(path);
      if (stat.isDirectory()) {
        walk(path);
      } else if (path.endsWith('.md')) {
        results.push(path);
      }
    }
  }
}
```

- [ ] **Step 2: Add npm script**

In `package.json`, add:

```json
"validate:wiki": "node scripts/validate-wiki.mjs"
```

Keep the existing `validate:pet-assets` script.

- [ ] **Step 3: Update `prompts/lint.md`**

Append:

```markdown
## Executable Check

가능하면 먼저 아래 명령을 실행해 구조/규칙 위반을 확인한다.

```powershell
npm.cmd run validate:wiki
```

그 다음 자동 검증이 잡지 못하는 모순, 오래된 주장, 고아 페이지, 출처 없는 결정, 중복 문서를 수동으로 점검한다.
```

- [ ] **Step 4: Update `log.md`**

Append:

```text
2026-06-03 19:10 | lint | validate:wiki 자동 점검 명령 추가 | [[scripts/validate-wiki]], [[prompts/lint]], [[package]]
```

- [ ] **Step 5: Verify RED before frontmatter cleanup**

Run:

```powershell
npm.cmd run validate:wiki
```

Expected before Task 4: FAIL if any existing wiki page lacks YAML frontmatter.

- [ ] **Step 6: Commit Task 3**

If the script exists and RED behavior is confirmed:

```powershell
git add scripts/validate-wiki.mjs package.json prompts/lint.md log.md
git commit -m "Add wiki validation command"
```

---

## Task 4: Standardize Wiki Source Frontmatter

**Files:**
- Modify: `AI-Sessions/wiki/sources/2026-06-03-comprehensive-review.md`
- Modify: `AI-Sessions/wiki/sources/2026-06-03-pet-island-liveops-upgrade-review.md`
- Modify any other `AI-Sessions/wiki/**/*.md` file missing frontmatter.
- Modify: `log.md`

- [ ] **Step 1: Add frontmatter to comprehensive review source**

At the top of `AI-Sessions/wiki/sources/2026-06-03-comprehensive-review.md`, add:

```markdown
---
type: source
date: 2026-06-03
status: active
source: docs/2026-06-03-comprehensive-review.md
---
```

- [ ] **Step 2: Add frontmatter to liveops review source**

At the top of `AI-Sessions/wiki/sources/2026-06-03-pet-island-liveops-upgrade-review.md`, add:

```markdown
---
type: source
date: 2026-06-03
status: active
source: docs/2026-06-03-pet-island-liveops-upgrade-review.md
---
```

- [ ] **Step 3: Scan all wiki markdown files**

Run:

```powershell
Get-ChildItem AI-Sessions\wiki -Recurse -Filter *.md | ForEach-Object {
  $first = Get-Content $_.FullName -Encoding UTF8 -TotalCount 1
  if ($first -ne '---') { $_.FullName }
}
```

Expected: no output except `.gitkeep` is ignored because it is not `.md`.

- [ ] **Step 4: Update `log.md`**

Append:

```text
2026-06-03 19:15 | lint | wiki source frontmatter 표준화 | [[AI-Sessions/wiki/sources/2026-06-03-comprehensive-review]], [[AI-Sessions/wiki/sources/2026-06-03-pet-island-liveops-upgrade-review]]
```

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
npm.cmd run validate:wiki
```

Expected: `Wiki validation passed.`

- [ ] **Step 6: Commit Task 4**

```powershell
git add AI-Sessions/wiki log.md
git commit -m "Standardize wiki frontmatter"
```

---

## Task 5: Commit Safe Wiki System Files

**Files:**
- Add: `.obsidian/app.json`
- Add: `.obsidian/appearance.json`
- Add: `.obsidian/core-plugins.json`
- Add: `.obsidian/graph.json`
- Add: `.obsidian/workspace.json`
- Add: `AGENTS.md`
- Add: `CLAUDE.md`
- Add: `AI-Sessions/**`
- Add: `index.md`
- Add: `log.md`
- Add: `prompts/**`
- Add: `README.md`
- Add: `START_HERE.md`
- Add: `TEMPLATE_MANIFEST.md`
- Add: `VERSION`
- Add: `LICENSE.md`
- Do not add: `.supabase-access-token.txt`, `login-smoke.png`, `supabase-url-config-smoke.png`, untracked `docs/*.md` with encoding concerns.

- [ ] **Step 1: Check ignored secrets**

Run:

```powershell
git check-ignore -v .supabase-access-token.txt
```

Expected: `.gitignore` rule is printed.

- [ ] **Step 2: Review untracked files**

Run:

```powershell
git status --short --branch
```

Expected: wiki files are visible as untracked or staged. `.supabase-access-token.txt` must not appear.

- [ ] **Step 3: Stage safe wiki files**

Run:

```powershell
git add .obsidian AGENTS.md CLAUDE.md AI-Sessions index.md log.md prompts README.md START_HERE.md TEMPLATE_MANIFEST.md VERSION LICENSE.md scripts/validate-wiki.mjs package.json
```

- [ ] **Step 4: Confirm no local evidence/secrets are staged**

Run:

```powershell
git diff --cached --name-only
```

Expected: output does not include:

```text
.supabase-access-token.txt
login-smoke.png
supabase-url-config-smoke.png
docs/codex-reinstall-handoff.md
docs/2026-06-03-pet-island-liveops-upgrade-review.md
```

- [ ] **Step 5: Run final validation**

Run:

```powershell
npm.cmd run validate:wiki
npm.cmd run validate:pet-assets
npm.cmd run typecheck
git diff --cached --check
```

Expected:

- `Wiki validation passed.`
- `Pet asset validation passed: 10 common, 10 rare, 3 legend.`
- `tsc --noEmit` exits 0.
- `git diff --cached --check` exits 0.

- [ ] **Step 6: Commit Task 5**

```powershell
git commit -m "Harden Obsidian AI wiki setup"
```

- [ ] **Step 7: Push**

Run only after user has allowed push or current thread policy already allows `git push origin main`:

```powershell
git push origin main
```

Expected: remote `main` advances.

---

## Task 6: Post-Implementation Wiki Lint Report

**Files:**
- Create: `AI-Sessions/wiki/errors/wiki-hardening-gaps.md`
- Modify: `index.md`
- Modify: `log.md`

- [ ] **Step 1: Create gap report**

Create `AI-Sessions/wiki/errors/wiki-hardening-gaps.md`:

```markdown
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

## Prevention

- Run `npm.cmd run validate:wiki` before claiming the wiki is healthy.
- Keep raw source material in `AI-Sessions/raw/`.
- Keep processed reusable knowledge in `AI-Sessions/wiki/`.
- Update `index.md` and `log.md` after every important save or ingest.
```

- [ ] **Step 2: Add gap report to `index.md`**

Under `## Errors / Lessons`, add:

```markdown
- [[AI-Sessions/wiki/errors/wiki-hardening-gaps|Wiki Hardening Gaps]]
```

- [ ] **Step 3: Append `log.md`**

Append:

```text
2026-06-03 19:20 | lint | 위키 하드닝 누락 사항과 재발 방지 규칙 기록 | [[AI-Sessions/wiki/errors/wiki-hardening-gaps]]
```

- [ ] **Step 4: Validate and commit**

Run:

```powershell
npm.cmd run validate:wiki
git add AI-Sessions/wiki/errors/wiki-hardening-gaps.md index.md log.md
git commit -m "Record wiki hardening gaps"
```

---

## Self-Review

### Spec Coverage

- Template folder comparison: covered by Tasks 1, 3, 5.
- Attached screenshot hybrid Korean/English requirement: covered by Tasks 2 and 3.
- Raw/Wiki/conversations separation: covered by Tasks 3 and 5.
- Save 5 filter: preserved in `CLAUDE.md`/`AGENTS.md`, enforced partially by `validate-wiki`, and documented in Task 6.
- `save`, `ingest`, `query`, `reference`, `lint`: covered by Tasks 2 and 3.
- Lint checks for guesses, duplicates, uncited decisions, stale rules: documented in `prompts/lint.md` and machine-checked for structure/secrets/frontmatter; semantic checks remain manual by design.
- Git safety: covered by Task 5.

### Placeholder Scan

This plan contains no placeholder markers or unspecified implementation steps. Every created file has exact content.

### Known Intentional Limits

- This plan does not delete duplicated `/docs` materials. Deletion would be destructive and should be a later cleanup task after canonical wiki/raw references are proven.
- This plan does not automate semantic contradiction detection. It documents semantic lint in `prompts/lint.md` and adds structural lint in `scripts/validate-wiki.mjs`.
- This plan does not commit local screenshots or token files.
