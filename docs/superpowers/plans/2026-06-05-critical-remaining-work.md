# Critical Remaining Work Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Balance Island를 실제 사용자에게 보여줘도 되는 상태로 만들기 위해, 남은 핵심 작업을 보안, 운영 큐, 질문 품질, UI 스모크, 배포 정리 순서로 마무리한다.

**Architecture:** 이미 구현된 Supabase RPC, Expo Router 화면, 로컬 질문 검수 스크립트를 버리지 않고, 출시 전 차단 요소만 좁게 닫는다. 비용이 생기는 AI/API 자동화는 기본 OFF로 유지하고, 관리자 로컬 검수와 정적 질문 뱅크를 우선한다.

**Tech Stack:** Expo Router, React Native, Supabase Auth/Postgres/RPC, local Node admin scripts, Vercel/Expo web build, optional Browser/Playwright visual smoke.

---

## 0. Current Findings

### 이미 끝난 핵심

- 질문 뱅크/검수 도구 커밋 완료: `1b7258c Add question bank review tooling`
- trait canonical 정리 완료: `b5a3066 Normalize comfort trait labels`
- 사용자 질문 제출 RPC/보안 migration 커밋 완료: `6921dc4 Wire user question submission flow`
- 자기발견 UI polish 커밋 완료: `81ed4f3 Polish self-discovery UI`
- timeline 기록 커밋 완료: `1d721f8 Record question expansion timeline`

### 현재 작업트리 상태

남은 dirty state는 기능 변경보다 정리 성격이 강하다.

- Modified old migrations: `supabase/migrations/202606011940_run_ready_security.sql` 등 9개
  - 현재 diff는 대부분 빈 줄 삭제라 기능 커밋에 섞으면 안 된다.
- Untracked temp/generated folders: `.codex-run/`, `_tmp/`
  - 커밋 금지.
- Untracked duplicate/security migration drafts:
  - `supabase/migrations/20260604071308_harden_internal_function_execute.sql`
  - `supabase/migrations/20260604071346_trait_contradictions.sql`
  - `supabase/migrations/20260604071506_harden_internal_functions_revoke_public.sql`
  - 이미 더 나중 migration으로 대체된 내용이 있으므로, 그대로 커밋하지 않는다.

### 인코딩 확인

PowerShell 출력에서는 한글이 깨져 보일 수 있으나, 주요 파일의 실제 UTF-8 내용은 정상이다.

검사 대상:

- `src/app/(tabs)/create.tsx`
- `src/screens/InsightMapScreen.tsx`
- `src/components/insight/InsightGraphCanvas.tsx`
- `scripts/admin/classify-pending-question.mjs`
- `data/question-review/rubric.examples.jsonl`
- `docs/admin-question-review-rules.md`
- `docs/2026-06-04-zero-cost-ai-ops-plan.md`
- `docs/2026-06-04-unified-insight-map-plan.md`

검사 결과:

- Hangul present.
- CJK mojibake count: `0`
- replacement character `�` count: `0`

따라서 P0는 “인코딩 복구”가 아니라 “브라우저/빌드에서 실제 텍스트가 정상 표시되는지 스모크”다.

---

## Priority Decision

### P0: 바로 해야 하는 일

1. 작업트리 정리와 중복 migration 격리
2. Supabase security/advisory 적용 상태 재확인
3. 사용자 질문 제출 큐 end-to-end 스모크
4. UI/UX 브라우저 스모크와 모바일 폭 QA
5. 배포/푸시 전 최종 검증

### P1: P0 뒤에 이어서 할 일

1. 질문 300개까지 확장, 단 배치당 30~50개씩
2. 관리자 승인/import 도구 추가
3. 질문 이미지 수동 업로드 운영 흐름 만들기
4. Google/Kakao 로그인 회귀 스모크

### P2: 지금 미룰 일

1. 유료 가챠, 유료 재화, 확률형 BM
2. 실시간 AI 질문 생성/이미지 생성 자동화
3. Naver OAuth custom provider
4. 대형 그래프/캔버스 편집 기능

---

## File Structure

### Worktree Hygiene

- `supabase/migrations/*.sql`
  - old migration format-only diffs와 duplicate draft migrations를 기능 커밋에서 분리한다.

### Security And DB Verification

- `supabase/migrations/202606041900_question_submission_queue.sql`
  - `submit_user_question` RPC 검증.
- `supabase/migrations/202606041930_security_advisory_rls_search_path.sql`
  - RLS/search_path/match embedding execute 권한 검증.
- `supabase/schema.sql`
  - 새 프로젝트 기준 snapshot 검증.

### User Submission Flow

- `src/app/(tabs)/create.tsx`
  - 로그인 사용자 질문 제출 UI.
- `src/services/questionService.ts`
  - `submitUserQuestion` RPC 호출.
- `scripts/admin/export-pending-questions.mjs`
  - pending 질문 로컬 export.
- `scripts/admin/classify-pending-question.mjs`
  - 비용 없는 1차 분류.
- `docs/admin-review-workflow.md`
  - 운영 매뉴얼.

### UI/UX Smoke

- `src/app/(tabs)/index.tsx`
  - 피드와 투표 UX.
- `src/app/(tabs)/island.tsx`
  - 섬/펫/인사이트 preview.
- `src/screens/InsightMapScreen.tsx`
  - 단일 마음 지도 화면.
- `src/components/insight/InsightGraphCanvas.tsx`
  - mind-map/Obsidian hybrid 시각화.

### Question Bank

- `data/question-bank/*.json`
  - 현재 178개 JSON 질문.
- `scripts/seed-question-bank.mjs`
  - 검증/시드 생성.
- `scripts/admin/question-bank-report.sql`
  - 분포 모니터링.

---

## Task 1: Worktree Hygiene Gate

**Files:**

- Inspect: `supabase/migrations/*.sql`
- Do not commit: `.codex-run/`
- Do not commit: `_tmp/`

- [ ] **Step 1: Confirm dirty state**

Run:

```powershell
git status --short
git diff --stat
git diff --name-only
```

Expected:

- Only old migration formatting diffs, temp folders, and duplicate draft migrations remain.
- No app source file is accidentally dirty.

- [ ] **Step 2: Check whether old migration diffs are whitespace-only**

Run:

```powershell
git diff -w --name-only -- supabase/migrations/202606011940_run_ready_security.sql supabase/migrations/202606012125_gamification_foundation.sql supabase/migrations/202606012330_feed_state_and_ledger_hardening.sql supabase/migrations/202606020200_personality_pet_theme_economy.sql supabase/migrations/202606021500_personality_insight_map.sql supabase/migrations/202606030530_ai_edge_rate_limits.sql supabase/migrations/202606030900_expand_pet_asset_batch.sql supabase/migrations/202606040500_trait_contradictions.sql supabase/migrations/202606040700_normalize_pet_trait_keys.sql
```

Expected:

- If output still lists files, inspect each diff manually.
- If the only changes are blank lines/formatting, do not commit them.

- [ ] **Step 3: Decide handling for duplicate drafts**

Inspect:

```powershell
Get-Content supabase/migrations/20260604071308_harden_internal_function_execute.sql -TotalCount 120
Get-Content supabase/migrations/20260604071346_trait_contradictions.sql -TotalCount 120
Get-Content supabase/migrations/20260604071506_harden_internal_functions_revoke_public.sql -TotalCount 120
```

Decision:

- If superseded by `202606040600_harden_internal_function_execute.sql`, `20260604141500_curious_axis_labels.sql`, or `202606041930_security_advisory_rls_search_path.sql`, leave untracked or move to `_tmp/abandoned-migrations/` only after user approval.
- Do not commit duplicate migrations with broken/old comments.

- [ ] **Step 4: Record result**

Append a short entry to `timeline.md` only if a real decision is made.

Commit only if `timeline.md` or a deliberate cleanup document changes:

```powershell
git add timeline.md
git commit -m "Record migration cleanup decision"
```

---

## Task 2: Security And Live DB Verification

**Files:**

- Verify: `supabase/migrations/202606041900_question_submission_queue.sql`
- Verify: `supabase/migrations/202606041930_security_advisory_rls_search_path.sql`
- Verify: `supabase/schema.sql`

- [ ] **Step 1: Run local static checks**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run validate:question-review
npm.cmd run validate:question-bank
npm.cmd run validate:wiki
```

Expected:

- All exit 0.

- [ ] **Step 2: Verify SQL invariants locally**

Use text checks before touching live DB:

```powershell
rg -n "SECURITY DEFINER|SET search_path = public|REVOKE ALL ON FUNCTION public.submit_user_question|GRANT EXECUTE ON FUNCTION public.submit_user_question" supabase/migrations/202606041900_question_submission_queue.sql
rg -n "ENABLE ROW LEVEL SECURITY|match_questions_by_embedding|REVOKE ALL ON FUNCTION public.match_questions_by_embedding" supabase/migrations/202606041930_security_advisory_rls_search_path.sql
```

Expected:

- `submit_user_question` has `SECURITY DEFINER`, `SET search_path = public`, auth guard, and no anon/PUBLIC execute.
- advisory migration enables RLS and restricts `match_questions_by_embedding`.

- [ ] **Step 3: Live Supabase check**

Only after credentials/session are available, run read-only SQL in Supabase SQL editor or MCP:

```sql
select version, name
from public.schema_migrations
where version in ('202606041900', '202606041930')
order by version;

select proname, prosecdef
from pg_proc
join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
where nspname = 'public'
  and proname in ('submit_user_question', 'match_questions_by_embedding');
```

Expected:

- Both migration versions exist.
- `submit_user_question` is security definer.

- [ ] **Step 4: Security advisor**

Run Supabase security advisor if available.

Expected:

- No high/critical advisory related to exposed SECURITY DEFINER functions.
- Public extension advisories may remain separately if moving extensions risks live DB indexes/types; record as P1/P2, not P0.

Commit:

```powershell
git add docs/2026-06-04-phase0-foundation-handoff.md timeline.md
git commit -m "Record live security verification"
```

Only commit if verification notes were actually added.

---

## Task 3: User Submission Queue Smoke

**Files:**

- Modify if needed: `src/app/(tabs)/create.tsx`
- Modify if needed: `src/services/questionService.ts`
- Verify: `scripts/admin/export-pending-questions.mjs`
- Verify: `scripts/admin/classify-pending-question.mjs`
- Verify: `docs/admin-review-workflow.md`

- [ ] **Step 1: Confirm create screen has no AI-cost path**

Run:

```powershell
rg -n "refine|embed|OpenAI|Gemini|AI_PIPELINE|fetch\\(" src/app/(tabs)/create.tsx src/services/questionService.ts
```

Expected:

- No public create-screen path calls external AI.
- Only `submit_user_question` RPC is used for submission.

- [ ] **Step 2: Submit one test question**

In the browser/app, log in and submit:

```text
제목: 퇴근 후 바로 쉬기 vs 새 취미 배우기
A: 바로 쉬기
B: 새 취미 배우기
카테고리: life
설명: 회복과 호기심 사이에서 고르기
```

Expected:

- UI shows review-queue success copy.
- The question does not appear in public feed immediately.

- [ ] **Step 3: Export pending questions**

Run:

```powershell
npm.cmd run admin:export-pending -- --limit 20 --out data/question-review/pending.latest.jsonl
```

Expected:

- Export file contains the submitted question.
- Classification includes suggested action and traits.

- [ ] **Step 4: Telegram summary dry run**

Run:

```powershell
npm.cmd run admin:export-pending -- --telegram
```

Expected:

- Output is readable Korean summary.
- No token/secret appears.

- [ ] **Step 5: Clean test data decision**

If the test question was submitted to production:

- Prefer marking it `rejected` or leaving as pending with note.
- Do not delete production data unless explicitly approved.

Commit only if app copy or docs are changed:

```powershell
git add src/app/(tabs)/create.tsx src/services/questionService.ts docs/admin-review-workflow.md
git commit -m "Polish user question submission queue"
```

---

## Task 4: UI/UX Browser Smoke And Visual QA

**Files:**

- Verify: `src/app/(tabs)/index.tsx`
- Verify: `src/app/(tabs)/island.tsx`
- Verify: `src/screens/InsightMapScreen.tsx`
- Verify: `src/components/insight/InsightGraphCanvas.tsx`
- Update if needed: `docs/visual-audit/2026-06-05/README.md`

- [ ] **Step 1: Start local web**

Run:

```powershell
npm.cmd run web
```

Expected:

- Expo web server starts.
- If the default port is busy, use the printed alternative URL.

- [ ] **Step 2: Browser smoke routes**

Open the local URL and verify:

- `/` feed loads or shows a graceful empty/error state.
- `/island` shows the upgraded island UI.
- `/insight` shows one unified mind map, not three fragmented views.
- `/create` shows text-first question submission UI.
- `/login` still shows Google/Kakao/email and Naver disabled/ready-state as intended.

- [ ] **Step 3: Mobile viewport screenshots**

Capture at:

- `375x812`
- `390x844`
- `430x932`

Check:

- No overlapping Korean text.
- Bottom tab does not cover primary CTA.
- Mind map is not blank.
- No fake English mockup labels remain.
- No fabricated vote totals are shown.

- [ ] **Step 4: Desktop viewport screenshots**

Capture at:

- `1366x768`
- `1920x1080`

Check:

- Wide layout does not stretch cards awkwardly.
- Island hero remains visible and not tiny.
- Create screen fields are readable.

- [ ] **Step 5: Record visual audit**

Create:

```text
docs/visual-audit/2026-06-05/README.md
```

Include:

- Tested URL
- Viewports
- Screens with pass/fail
- Known issues
- Screenshot file paths if saved

Commit:

```powershell
git add docs/visual-audit/2026-06-05 src/app src/components src/screens
git commit -m "Verify polished UI smoke"
```

Only include source files if fixes were needed.

---

## Task 5: Question Bank Batch 3 Toward 300

**Files:**

- Modify: `data/question-bank/food.json`
- Modify: `data/question-bank/life.json`
- Modify: `data/question-bank/romance.json`
- Modify: `data/question-bank/career.json`
- Modify: `data/question-bank/culture.json`
- Verify: `scripts/seed-question-bank.mjs`
- Verify: `scripts/admin/question-bank-report.sql`

- [ ] **Step 1: Generate current report**

Run:

```powershell
npm.cmd run validate:question-bank
node scripts/seed-question-bank.mjs --check
```

Expected:

- Current bank validates.
- Current JSON bank count remains 178 unless already expanded.

- [ ] **Step 2: Add 40 questions, not 122 at once**

Add append-only questions across files:

- `life.json`: +8
- `career.json`: +8
- `culture.json`: +8
- `romance.json`: +8
- `food.json`: +8

Trait target:

- Prioritize `solo`, `social`, `flow`, `comfort`, `curious`.
- Avoid overfeeding `express`, `safe`, `adventure`.

Rules:

- Every question must map A and B to at least one canonical trait.
- Avoid medical/legal/financial advice framing.
- Avoid obvious good-vs-bad choices.
- Avoid direct copying from web/community lists.

- [ ] **Step 3: Validate**

Run:

```powershell
npm.cmd run validate:question-bank
npm.cmd run validate:question-review
node scripts/seed-question-bank.mjs --check
```

Expected:

- No rejected question.
- Trait distribution gap narrows or at least does not worsen.

- [ ] **Step 4: Generate NEW_ONLY SQL**

Run:

```powershell
$env:NEW_ONLY="1"
node scripts/seed-question-bank.mjs > _tmp/question-bank-batch3-new-only.sql
Remove-Item Env:NEW_ONLY
```

Expected:

- SQL contains only new batch rows if NEW_ONLY logic is configured for this batch.
- If NEW_ONLY cannot reliably isolate batch 3, do not apply live until script supports batch tags or explicit seed key ranges.

Commit:

```powershell
git add data/question-bank scripts/seed-question-bank.mjs AI-Sessions/wiki/projects/balance-question-expansion-plan.md
git commit -m "Expand question bank batch 3"
```

---

## Task 6: Admin Approval Import Tool

**Files:**

- Create: `scripts/admin/import-approved-questions.mjs`
- Modify: `package.json`
- Modify: `docs/admin-review-workflow.md`

- [ ] **Step 1: Define approved JSONL shape**

Use this line format:

```json
{"id":"question-uuid","status":"approved","option_a_image_url":"asset://questions/example/a.webp","option_b_image_url":"asset://questions/example/b.webp","traits":{"A":[{"trait_key":"comfort","weight":1.2}],"B":[{"trait_key":"curious","weight":1.3}]}}
```

- [ ] **Step 2: Implement dry-run first**

`scripts/admin/import-approved-questions.mjs` must:

- Read JSONL.
- Validate UUID.
- Validate status is `approved` or `rejected`.
- Validate trait keys against the 10 canonical traits.
- Refuse `approved` if either image URL is missing or still `pending://`.
- Print SQL or perform update only with `--apply`.

- [ ] **Step 3: Add package script**

Add to `package.json`:

```json
"admin:import-approved": "node scripts/admin/import-approved-questions.mjs"
```

- [ ] **Step 4: Test dry-run**

Run:

```powershell
npm.cmd run admin:import-approved -- --file data/question-review/approved.sample.jsonl --dry-run
```

Expected:

- Valid sample prints planned updates.
- Invalid sample exits non-zero.

Commit:

```powershell
git add scripts/admin/import-approved-questions.mjs package.json docs/admin-review-workflow.md data/question-review
git commit -m "Add admin approval import tool"
```

---

## Task 7: Auth Regression Smoke

**Files:**

- Verify: `src/app/login.tsx`
- Verify: `src/store/authStore.ts`
- Verify: `src/services/authService.ts`
- Update if needed: `docs/auth-provider-setup.md`

- [ ] **Step 1: Google login web smoke**

Use production or preview URL.

Expected:

- Google login completes.
- User returns to app.
- Profile/island data loads.

- [ ] **Step 2: Kakao login web smoke**

Expected:

- Kakao login completes or fails with known dashboard/provider reason.
- If Kakao does not return email, document whether Supabase `Allow users without email` is enabled and why.

- [ ] **Step 3: Email magic link smoke**

Expected:

- Magic link sends.
- Callback opens app session.
- Auth bootstrap does not double-consume callback URL.

- [ ] **Step 4: Naver state**

Expected:

- Naver remains disabled/ready-state unless custom OAuth/OIDC is deliberately configured.

Commit only docs if no code changes:

```powershell
git add docs/auth-provider-setup.md timeline.md
git commit -m "Record auth smoke results"
```

---

## Task 8: Final Build, Commit, Push Readiness

**Files:**

- Verify all committed files.

- [ ] **Step 1: Full local gates**

Run:

```powershell
npm.cmd run typecheck
npm.cmd run validate:question-bank
npm.cmd run validate:question-review
npm.cmd run validate:wiki
npm.cmd run build
```

Expected:

- All exit 0.
- Build output completes without unresolved route/runtime errors.

- [ ] **Step 2: Git status**

Run:

```powershell
git status --short
git log --oneline -10
```

Expected:

- Only intentionally ignored/uncommitted temp files remain.
- No source files accidentally dirty.

- [ ] **Step 3: Push only after user approval**

If user approves:

```powershell
git push origin feat/self-discovery-upgrade
```

If merging to `main` is desired, do not push directly to `main` from this branch unless user explicitly asks for direct main update.

---

## Recommended Execution Order

1. Task 1: Worktree hygiene
2. Task 2: Security/live DB verification
3. Task 3: User submission queue smoke
4. Task 4: UI browser visual QA
5. Task 8: Full build and push readiness
6. Task 5: Question bank batch 3
7. Task 6: Admin approval import tool
8. Task 7: Auth regression smoke

Rationale:

- Tasks 1-4 determine whether the current build is safe and understandable.
- Task 8 gives a clean deploy/push checkpoint.
- Tasks 5-7 increase content and operations capacity after the current product surface is stable.

---

## Self-Review

- Spec coverage: covers remaining security, pending queue, question expansion, UI smoke, auth smoke, deployment readiness, and cost control.
- Placeholder scan: no `TBD` or unspecified implementation placeholders are used as required work.
- Type consistency: canonical traits are `safe`, `adventure`, `plan`, `flow`, `solo`, `social`, `calm`, `express`, `comfort`, `curious`.
- Cost control: all AI/API automation stays optional and OFF by default.
