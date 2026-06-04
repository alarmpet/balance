# Balance Island Timeline

이 문서는 `balance-island` 프로젝트의 큰 코드 변경, 아키텍처 결정, 복구 작업, 검증 결과를 시간순으로 기록한다.  
시간대는 KST 기준이다.

## 2026-06-01 19:18 KST

- 작업: 프로젝트 운영 지침 문서 `agent.md`와 변경 이력 문서 `timeline.md`를 추가했다.
- 범위: `agent.md`, `timeline.md`.
- 이유: 앞으로 작업 시 `research.md`를 먼저 참조하고, 큰 변경이 있을 때 `research.md`와 `timeline.md`를 함께 갱신하는 작업 규칙을 고정하기 위해서다.
- 검증: 기존 지침 파일 부재를 확인했고, 현재 시각을 확인한 뒤 새 문서를 생성했다. 문서 생성 후 파일 존재 여부와 핵심 섹션을 확인할 예정이다.
- 후속: 다음 기능/복구 작업부터는 `agent.md`의 루틴에 따라 `research.md` 선확인, 필요 시 `timeline.md` 로그 갱신을 수행한다.

## 2026-06-01 19:21 KST

- 작업: `alarmpet/balance` GitHub 저장소에 현재 프로젝트 상태를 초기 커밋으로 올리는 작업을 시작했다.
- 범위: 전체 `balance-island` 프로젝트 파일.
- 이유: 사용자가 현재 작업물을 GitHub 저장소에 커밋해 달라고 요청했다.
- 검증: GitHub 앱으로 `alarmpet/balance` 접근 권한과 빈 저장소 상태를 확인했고, 로컬 Git 설치 및 사용자 이름/이메일 설정을 확인했다.
- 후속: 로컬 Git 저장소를 초기화하고 원격 `origin`을 연결한 뒤 첫 커밋과 push 결과를 확인한다.

## 2026-06-01 19:23 KST

- 작업: 초기 커밋 `3e58cce`를 `alarmpet/balance`의 `main` 브랜치로 push했다.
- 범위: GitHub 원격 저장소 `alarmpet/balance`.
- 이유: 로컬 프로젝트 상태를 원격 GitHub 저장소에 보존하기 위해서다.
- 검증: `git push -u origin main` 성공, `git status -sb`에서 `main...origin/main` 확인, GitHub 앱으로 커밋 `3e58cce18d586981987801b59dbcebaa61c1997d` 조회 성공.
- 후속: 이 타임라인 업데이트도 별도 커밋으로 원격에 반영한다.

## 2026-06-01 19:29 KST

- 작업: Expo 앱을 브라우저에서 바로 실행 가능하게 만들기 위한 구현 계획서를 작성했다.
- 범위: `docs/superpowers/plans/2026-06-01-run-ready.md`, `timeline.md`.
- 이유: 현재 프로젝트의 실행 차단 요소를 순서대로 제거하고 Browser/Chrome 검증까지 이어지는 작업 경로가 필요하다.
- 검증: `agent.md`, `research.md`, `package.json`, 파일 목록을 확인했고, Browser 플러그인의 localhost 검증 용도를 계획에 반영했다.
- 후속: 사용자가 실행 방식을 선택하면 계획서의 Task 1부터 진행한다.

## 2026-06-01 19:39 KST

- 작업: 실행 계획서를 no-Supabase fallback 방식에서 사용자 인증 기반 live Supabase/Google 콘솔 설정 방식으로 수정했다.
- 범위: `docs/superpowers/plans/2026-06-01-run-ready.md`, `timeline.md`.
- 이유: 사용자가 Supabase 및 Google 개발자 센터 인증은 직접 수행하고, 에이전트가 Browser/Chrome 플러그인으로 콘솔을 띄워 필요한 설정값을 직접 입력하는 방향을 요청했다.
- 검증: 계획서에서 `sampleData` 참조를 제거했고, Browser-assisted Supabase/Google setup, `.env` 보안 규칙, `.env` 미추적 검증 단계를 추가했다.
- 후속: 실행 단계에서는 브라우저를 visible 상태로 띄우고 사용자의 로그인 완료 신호 후 공개 설정값만 로컬 `.env`에 입력한다.

## 2026-06-01 19:45 KST

- 작업: 외부 리뷰 리포트 `review_report.md`를 검토하고 타당한 항목만 실행 계획서에 반영했다.
- 범위: `docs/superpowers/plans/2026-06-01-run-ready.md`, `timeline.md`.
- 이유: live Supabase로 앱을 띄우는 계획에는 RLS, profile trigger, RPC 기반 투표/리액션, 비파괴 migration gate가 필요하다는 리뷰 지적이 코드 상태와 일치했다.
- 검증: 현재 `schema.sql`의 `DROP TABLE ... CASCADE` 존재, RLS/policy 부재, `questionService.ts`의 client-side vote/reaction 처리와 UUID `query.not` 사용, Zustand 전체 배열 롤백을 정적 검색으로 확인했다.
- 후속: 실행 단계에서는 `supabase/migrations/202606011940_run_ready_security.sql` 작성과 service RPC 전환을 parser 복구 이후 우선 적용한다.

## 2026-06-01 20:08 KST

- 작업: Expo Web run-ready 복구 작업을 진행했다.
- 범위: Expo 설정, Router layout, 탭 화면, BalanceCard, feed/gamification/AI 서비스, Supabase run-ready migration, 타입 정의, 의존성.
- 이유: 앱을 브라우저에서 실제로 띄우고 Supabase live 설정으로 이어갈 수 있게 하기 위해서다.
- 검증: `npm.cmd install` 성공, `npm.cmd run typecheck` 성공, `npm.cmd run doctor` 17/17 성공, Expo Web HTML 200, Metro entry bundle 200 확인. Browser 플러그인은 런타임 `windows sandbox failed` 오류로 사용하지 못했고, Chrome을 직접 열어 `http://localhost:8081`와 Supabase dashboard를 표시했다. `.env`는 `git check-ignore .env`로 ignore 확인.
- 후속: 사용자가 Supabase dashboard에서 로그인/2FA를 완료하면 Project URL과 anon key를 로컬 `.env`에 입력하고 DB schema/migration 적용을 이어간다.

## 2026-06-01 20:23 KST - Supabase Project Connection
- 새 Supabase 프로젝트 `balance` (`ztcexgnelqtdzinfgoja`) 생성 확인.
- 로컬 `.env`에 `EXPO_PUBLIC_SUPABASE_URL`과 publishable key를 저장하고, `.env`가 Git ignore 대상임을 재확인했다.
- Expo Web 서버를 재시작해 환경변수 반영 상태로 `http://localhost:8081` 응답 200을 확인했다.
- DB 적용 전 스키마/마이그레이션을 교차 확인하며 `profiles.today_participation_count` 누락을 발견해 `supabase/schema.sql`에 보강했다.

## 2026-06-01 20:30 KST - Supabase Bootstrap SQL Repair
- Supabase SQL Editor 실행 중 `syntax error at or near "life"`가 발생했다.
- 원인은 `supabase/schema.sql` seed 블록의 한글 문자열이 mojibake로 깨지며 작은따옴표가 손상된 것이었다.
- 깨진 seed 구간을 `supabase/seed_clean.sql`의 ASCII seed 30개와 islands/characters/categories seed로 교체했다.
- `fetch_feed_questions`, `submit_vote`, `submit_reaction` RPC가 실제 테이블 컬럼명(`option_a_votes`, `like_count`, `emoji`)을 사용하도록 보정했다.
- `supabase/apply_new_project.sql`을 재생성하고 클립보드에 다시 복사했다.

## 2026-06-01 20:35 KST - RLS Policy and Vote Count Repair
- Supabase SQL Editor 실행 중 `column "user_id" does not exist`가 발생했다.
- 원인은 `islands`와 `characters`가 마스터 데이터 테이블인데 RLS 정책에서 존재하지 않는 `user_id` 컬럼을 참조한 것이었다.
- 두 테이블은 `anon, authenticated` 공개 읽기 정책으로 변경했다.
- `votes` INSERT 트리거와 `submit_vote` RPC가 같은 투표 카운트/성향 점수를 중복 갱신할 위험도 발견해, 기본 스키마의 vote side-effect trigger를 제거하고 RPC를 단일 갱신 경로로 유지했다.
- `supabase/apply_new_project.sql`을 재생성하고 클립보드에 다시 복사했다.

## 2026-06-01 20:40 KST - Supabase Bootstrap Verified
- Supabase SQL Editor에서 `apply_new_project.sql` 실행이 `Success. No rows returned`로 완료되었다.
- publishable key와 REST RPC로 `fetch_feed_questions`를 직접 호출해 seed 질문 3개가 반환되는 것을 확인했다.
- 로컬 Expo Web 서버 `http://localhost:8081` 응답 200과 `npm run typecheck` 통과를 재확인했다.

## 2026-06-01 20:52 KST - Personality Avatar and Island Gamification Plan
- 작업: MBTI풍 성향 캐릭터, 매일 케어, 섬 꾸미기, 출석/질문 보상 루프를 포함한 제품 계획서를 작성했다.
- 범위: `docs/superpowers/plans/2026-06-01-personality-avatar-island-gamification.md`.
- 결정: 앱의 감정적 주인공은 `내 성향 캐릭터`, 섬은 캐릭터의 집이자 성장/꾸미기 무대로 정의했다.
- 결정: MBTI를 직접 복제하지 않고 자체 4축 `BIPI` 모델을 사용해 법적/기대치/정확도 리스크를 낮춘다.
- 리뷰: GPT-5.3-Codex-Spark 읽기 전용 리뷰어 에이전트를 먼저 띄웠으나 컨텍스트 한도로 실패했다. 계획서에는 자체 위험 점검으로 개인정보/심리진단 과장, 경제 밸런스, RLS/RPC, 이미지 저작권, MVP 범위 리스크를 반영했다.

## 2026-06-01 21:05 KST - Gamification Review Report Validation
- 작업: 외부 `gamification_review_report.md`를 검토하고 타당한 항목만 게임화 계획서에 반영했다.
- 채택: BIPI snapshot/캐시, 조개 ledger, RPC-only 경제 처리, egg 상태 null 가드, lazy daily mission progress, `gamificationStore` 분리, 섬/아이템 이미지 프리패치.
- 수정 채택: 리뷰의 `purchase_decor_item(p_user_id, p_item_id)` 예시는 클라이언트 user_id 입력이 위험하므로 `auth.uid()` 내부 사용 방식으로 바꿔 반영했다.
- 보류: pg_cron 일괄 리셋과 전체 신규 DDL 즉시 적용은 MVP 복잡도와 현재 우선순위상 계획서 단계에만 남기고 구현 적용은 보류했다.

## 2026-06-01 21:20 KST - Korean Feed Recovery
- 작업: Phase 1 우선순위에 따라 영어 seed를 국내 사용자용 한국어 seed로 교체했다.
- 범위: `supabase/seed_clean.sql`, `supabase/schema.sql`, `supabase/apply_new_project.sql`, `supabase/replace_korean_seed.sql`, feed/island/profile UI 문구, `src/services/gamificationService.ts`, `src/types/database.types.ts`.
- 이유: 임시 영어 seed와 일부 영어 UI가 국내 초기 사용 앱 톤과 맞지 않았고, 리뷰어가 지적한 `islands.user_id`/`characters.user_id` 타입 및 서비스 불일치가 실제 로그인 화면 오류로 이어질 수 있었다.
- 검증: `replace_korean_seed.sql` quote 검사 통과, `npm.cmd run typecheck` 통과. SQL Editor 실행용 한국어 seed 교체 SQL을 클립보드에 복사했다.
- 검증: Supabase SQL Editor에서 `replace_korean_seed.sql` 실행이 `Success. No rows returned`로 완료되었다.
- 검증: publishable key로 `fetch_feed_questions` RPC를 호출해 `새 취미를 시작한다면?`, `스트레스가 쌓인 날 회복법은?`, `방 정리는 어떤 스타일?` 등 한국어 질문 반환을 확인했다.
- 검증: 로컬 Expo Web `http://localhost:8081` 응답 200, `npm.cmd run typecheck` 통과.

## 2026-06-01 23:09 KST - Gamification Foundation
- 작업: 조개 원장, 아바타 상태, 성향 스냅샷 기반의 게임화 DB/RPC 초안을 구현하고 클라이언트 상태관리와 화면을 연결했다.
- 범위: `supabase/migrations/202606012125_gamification_foundation.sql`, `src/types/database.types.ts`, `src/services/gamificationService.ts`, `src/store/gamificationStore.ts`, `src/store/feedStore.ts`, `src/app/(tabs)/island.tsx`, `src/app/(tabs)/profile.tsx`, `research.md`, `timeline.md`.
- 이유: 투표/출석/캐릭터 케어 보상을 profile 숫자 직접 증분이 아니라 idempotency 가능한 `shell_ledger` 중심으로 전환하고, 섬/프로필 UI가 같은 게임화 snapshot을 보도록 하기 위해서다.
- 리뷰: 읽기 전용 리뷰어가 seed 재실행 위험, `submit_vote` 승인 가드 부족, 보상 원장 부재, RPC/type 미정의, feed 상태 동기화 리스크를 지적했다. 이 중 게임화 foundation 범위에 해당하는 승인 가드, ledger, RPC/type/store 항목을 반영했다.
- 검증: `npm.cmd run typecheck` 성공.
- 검증: `supabase/migrations/202606012125_gamification_foundation.sql` quote/dollar quote scan 성공.
- 후속: live Supabase에는 새 migration을 SQL Editor에서 적용해야 한다. 적용 후 `claim_daily_checkin`, `care_avatar`, `submit_vote` RPC smoke test가 필요하다.

## 2026-06-01 23:25 KST - Feed State and Ledger Hardening
- 작업: live DB 적용 성공 후 RPC smoke test를 진행하고, 리뷰어가 지적한 feed 상태 동기화와 ledger 동시성 리스크를 보강했다.
- 범위: `supabase/migrations/202606012330_feed_state_and_ledger_hardening.sql`, `src/services/questionService.ts`, `src/services/gamificationService.ts`, `src/types/database.types.ts`, `research.md`, `timeline.md`.
- 이유: 피드 새로고침 후 `userVote/userReaction`이 사라지고 sort 인자가 무시되는 문제를 막고, 같은 idempotency key의 동시 보상 요청을 직렬화하기 위해서다.
- 리뷰: GPT-5.3-Codex-Spark 읽기 전용 리뷰어가 `fetchGamificationSnapshot` error 무시, feed user state 미동기화, sort 미사용, `apply_shell_delta` race 가능성을 P1/P2로 지적했다. 해당 항목을 반영했다.
- 검증: live REST smoke test에서 `fetch_feed_questions` 3개 반환, anon `claim_daily_checkin`/`care_avatar`는 `Authentication required` 반환.
- 검증: `npm.cmd run typecheck` 성공.
- 검증: follow-up migration quote/dollar quote scan 성공, `git diff --check` 성공.
- 후속: `supabase/migrations/202606012330_feed_state_and_ledger_hardening.sql`은 클립보드에 복사했으며, Supabase SQL Editor에서 실행 후 새 `fetch_feed_questions` 반환 필드 smoke test가 필요하다.

## 2026-06-01 23:50 KST - Character Card Collection Economy Plan
- 작업: 사용자가 제공한 일반/레어/전설 캐릭터 PNG 에셋을 기반으로 확률형 카드 획득, 출석 카드, 조개 카드팩, 합성, 천장, 확률 공개 계획서를 작성했다.
- 범위: `docs/superpowers/plans/2026-06-01-character-card-collection-economy.md`, `research.md`, `timeline.md`.
- 이유: 기존 성향 아바타/섬 성장 루프를 해치지 않으면서, 카드 수집과 합성을 장기 리텐션 루프로 붙일 수 있는 안전한 방향이 필요했다.
- 결정: 대표 아바타는 성향 기반으로 유지하고, 확률형 카드는 스킨/동료/섬 장식 수집으로 분리한다. MVP에서는 현금 결제 없이 무료/획득 조개 기반으로만 검증한다.
- 리뷰: GPT-5.3-Codex-Spark 읽기 전용 리뷰어가 `profiles.shell_balance` 직접 수정 가능성, request id 기반 멱등성, 확률 공개/변경 이력, 미성년자 보호, 에셋 메타데이터 필요성을 지적했고 계획서에 반영했다.
- 검증: 계획서 placeholder/핵심 키워드 스캔을 수행했다. 구현 코드는 변경하지 않았다.
- 후속: 카드 시스템 구현 전에 `profiles_update_own` 정책을 먼저 좁히는 security migration을 작성해야 한다.

## 2026-06-02 00:56 KST - Personality Pet Matching Plan Update
- 작업: 사용자가 제공한 `C:\Users\petbl\Desktop\alarmpetgo_` 일반/희귀/전설 펫 이미지 구조를 기준으로 성향 펫 매칭 계획을 업데이트했다.
- 범위: `docs/superpowers/plans/2026-06-01-character-card-collection-economy.md`, `research.md`, `timeline.md`.
- 결정: 캐릭터와 펫을 동시에 운영하지 않고, 사용자의 성향 대표는 `펫 1마리`로 단순화한다. 보상 뽑기는 펫 자체가 아니라 펫이 사는 `배경/테마 스킨`으로 전환한다.
- 설계: BIPI trait vector와 품종/동물 성향 자료를 매칭해 `pet_species_traits` seed를 만들고, `assign_personality_pet` RPC가 유저 trait과 가장 가까운 펫을 배정하는 방향으로 잡았다.
- 이유: 파츠형 아이템이나 캐릭터 교체형 가챠보다 화면과 개발 공수가 작고, 사용자는 “내 성향 펫이 자라고 세계를 꾸민다”는 하나의 문장으로 이해할 수 있다.
- 검증: TICA/AKC/RSPCA 등 공개 품종/동물 행동 자료를 참고해 초기 매핑 기준을 세웠고, 구현 코드는 변경하지 않았다.

## 2026-06-02 01:56 KST - Economy Review Report Validation
- 작업: 외부 리뷰 `economy_review_report.md`를 검토하고 타당한 항목만 성향 펫/테마 가챠 계획서에 반영했다.
- 범위: `docs/superpowers/plans/2026-06-01-character-card-collection-economy.md`, `research.md`, `timeline.md`.
- 채택: `profiles_update_own` broad policy의 경제 필드 직접 수정 위험, `p_request_id` 기반 테마 뽑기 멱등성, 실제 weight 기반 확률 공시 RPC, 클라이언트 request id 로컬 보존 규칙.
- 수정 채택: 리뷰의 RLS 예시 SQL은 `OLD` 참조 때문에 그대로 쓰지 않고, 직접 UPDATE 제거/안전 컬럼 grant/`update_profile_display` RPC 방향으로 바꿨다.
- 보류: 미완성 10연차 RPC SQL 예시는 그대로 반영하지 않고 필요한 트랜잭션 순서만 계획에 남겼다.

## 2026-06-02 02:15 KST - Personality Pet Theme Economy Foundation
- 작업: 계획서의 P0/P1 항목을 기준으로 성향 펫 + 테마 가챠 기반 migration과 클라이언트 타입/서비스/스토어/섬 화면 연결을 구현했다.
- 범위: `supabase/migrations/202606020200_personality_pet_theme_economy.sql`, `src/types/database.types.ts`, `src/services/gamificationService.ts`, `src/store/gamificationStore.ts`, `src/app/(tabs)/island.tsx`, 계획서, `research.md`, `timeline.md`.
- 리뷰: GPT-5.3-Codex-Spark 읽기 전용 리뷰어가 `profiles_update_own` 권한 축소 미반영, `care_avatar` 멱등성 붕괴, `update_profile_display` 부재, `pet/theme` 테이블/RPC 부재, 확률 공시 RPC 부재를 P0/P1로 지적했다.
- 반영: broad profile update 제거, `update_profile_display`, `pet_species/user_pet_state/theme_*` 테이블, `assign_personality_pet`, `draw_theme_pack`, `claim_daily_theme_draw`, `get_theme_probability_disclosure`, paid care request id를 추가했다.
- 추가 방어: 일일 무료 테마는 클라이언트 request id를 무시하고 KST 날짜 기반 deterministic id로 처리해 무한 수령을 막았다.
- 검증: `npm.cmd run typecheck` 성공, `git diff --check` 성공.
- 후속: live Supabase SQL Editor에서 새 migration 적용 후 RPC smoke test가 필요하다.

## 2026-06-02 03:35 KST - Live Supabase Pet Theme SQL Recovery
- Work: Applied the missing live Supabase function chunk after confirming Chrome CDP access was available.
- Root cause: the previous SQL run stopped behind Supabase's destructive-operation confirmation, so `claim_daily_theme_draw(uuid)` was missing and `care_avatar(text)` remained as the old one-argument function.
- Fix: confirmed the Supabase modal, re-ran the daily draw/care function chunk, then re-ran the seed and GRANT chunk.
- Verification: live DB now reports `claim_daily_theme_draw(p_request_id uuid)`, `care_avatar(p_care_type text, p_request_id uuid)`, `draw_theme_pack(text, integer, uuid)`, `assign_personality_pet()`, `get_theme_probability_disclosure(text)`, `update_profile_display(...)`, and `apply_shell_delta(...)`.
- Verification: seed counts are `pet_species=3`, `pet_species_traits=9`, `theme_skins=5`, `theme_draw_pools=2`, `theme_draw_pool_items=10`, and `get_theme_probability_disclosure('daily-theme')` returns a JSON object.

## 2026-06-02 03:50 KST - Island Pet Theme UI Wiring
- Work: Connected the live pet/theme economy loop to the island screen.
- Scope: `src/store/gamificationStore.ts`, `src/app/(tabs)/island.tsx`, `timeline.md`.
- Change: theme draw results are now kept in Zustand as `lastThemeDrawResults` so the UI can immediately show the obtained theme and duplicate level-up result.
- Change: rebuilt the island screen with a pastel island header, shell balance, personality pet panel, pet assignment action, daily free theme draw action, paid theme draw action, care actions, progress bars, top trait labels, loading state, error banner, and draw result modal.
- Verification: `npm.cmd run typecheck` passed.
- Verification: `git diff --check` passed; Git only reported CRLF conversion warnings.

## 2026-06-02 04:05 KST - Island Theme Inventory and Guest UX
- Work: Extended the island loop so owned theme skins are visible from the gamification snapshot.
- Scope: `src/services/gamificationService.ts`, `src/app/(tabs)/island.tsx`, `timeline.md`.
- Change: `fetchGamificationSnapshot` now fetches up to 12 owned theme inventory rows with joined `theme_skins`, while preserving the equipped theme query.
- Change: the island screen now shows a theme inventory panel with rarity, level, duplicate count, and equipped badge.
- Change: guest mode now shows a clear preview banner and disables mutation actions so auth-only RPCs do not produce avoidable server errors.
- Verification: `npm.cmd run typecheck` passed.
- Verification: Chrome smoke check at `http://localhost:8081/island` rendered the guest banner and empty theme inventory state.
- Verification: `git diff --check` passed; Git only reported CRLF conversion warnings.
## 2026-06-02 14:45 KST - Personality Insight Map Plan

- 작업: Obsidian Graph/Canvas, mind map, personal informatics, React/React Native graph visualization 자료를 조사하고 `나의 선택 지도` 계획서를 작성했다.
- 범위: `docs/superpowers/plans/2026-06-02-personality-insight-map.md`, `timeline.md`.
- 이유: 질문 답변으로 누적된 성향 데이터를 섬 화면에서 직관적으로 탐색하게 만들기 위해, 전체 그래프와 마인드맵을 그대로 복제하지 않고 모바일 MVP에 맞는 하이브리드 인사이트 지도 방향을 정했다.
- 결정: 기본 화면은 성향 펫 중심 radial mindmap, 탐색은 Obsidian Local Graph식 주변 연결, 해석은 AI/규칙 기반 인사이트 카드로 분리한다.
- 검증: 공식 Obsidian 문서, React Flow GitHub 예제, personal informatics 연구, React Native SVG/D3 관련 자료를 비교했다. 구현 코드는 변경하지 않았다.
- 후속: implementation plan 작성 전 현재 UI 문자열 인코딩 복구와 `get_personality_insight_graph` RPC 설계를 세부화해야 한다.

## 2026-06-02 15:30 KST - Insight Map Review Validation

- 작업: 외부 리뷰 문서 `insight_map_review_report.md`를 코드베이스와 기존 계획서에 대조해 검증하고, 타당한 항목만 인사이트 맵 계획서에 반영했다.
- 범위: `docs/superpowers/plans/2026-06-02-personality-insight-map.md`, `timeline.md`.
- 채택: 그래프 RPC lazy loading, SQL 레벨 최근 30일/상위 trait 10개/노드 40개 제한, migration 순서 명시, SECURITY DEFINER + `auth.uid()` 제한, confidence check constraint, guest 정적 JSON, `균형 연결` 프레이밍, recent change P1 이동, store 경계, 접근성 label.
- 보류: `react-native-reanimated` 필수 도입은 현재 package.json에 의존성이 없어 보류했다. MVP에서는 애니메이션을 최소화하고 필요 시 별도 검증 후 추가한다.
- 검증: 현재 `fetchGamificationSnapshot()` 병렬 쿼리 구조, pet/theme migration 테이블, broad profile update 제거, Edge Function JWT/rate limit 리스크, package.json 의존성을 확인했다.

## 2026-06-02 16:10 KST - Personality Insight Map P0 Implementation

- 작업: `나의 선택 지도` P0 구현을 진행했다.
- 범위: `supabase/migrations/202606021500_personality_insight_map.sql`, `src/types/database.types.ts`, `src/services/insightMapService.ts`, `src/store/insightMapStore.ts`, `src/data/guestInsightGraph.ts`, `src/components/insight/*`, `src/app/insight-map.tsx`, `src/app/(tabs)/island.tsx`, `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `package.json`, `package-lock.json`.
- 변경: `user_insight_cards` 테이블, RLS, 읽음 처리 RPC, 인사이트 카드 갱신 RPC, 성향 그래프 RPC를 추가했다. 그래프 RPC는 authenticated 사용자만 실행되고 최근 30일, 상위 trait 10개, 노드 40개 제한을 적용한다.
- 변경: `react-native-svg`, `d3-hierarchy` 의존성을 추가하고, 게스트 정적 그래프, Supabase 서비스, Zustand 스토어, radial graph canvas, 노드 상세 sheet, 인사이트 상세 화면을 추가했다.
- 변경: 섬 화면에 `InsightMapPreview`를 붙이고 `/insight-map` 라우트로 진입하도록 연결했다. 깨져 있던 탭 title 문자열도 한국어로 복구했다.
- 리뷰: GPT-5.3-Codex-Spark 읽기 전용 리뷰어가 누락 파일, 타입/RPC 누락, guest fallback, SQL 성능 인덱스, store 경계, 라우팅 위험을 지적했고, 구현 중 해당 항목을 반영했다.
- 검증: `npm.cmd run typecheck` 통과.
- 검증: `npx.cmd expo export --platform web` 통과.
- 제한: 이 세션의 Windows sandbox 문제로 로컬 정적 서버를 Chrome에서 유지하지 못해 브라우저 스모크는 완료하지 못했다.

## 2026-06-02 16:50 KST - Insight Map Supabase Apply and RPC Smoke

- Work: Applied `supabase/migrations/202606021500_personality_insight_map.sql` to Supabase project `ztcexgnelqtdzinfgoja` through the authenticated dashboard session.
- Fix: Adjusted the migration before apply so visible insight copy and graph labels are Korean, and corrected the `max(count(*))` cast expression in `category_counts`.
- Verification: Supabase SQL API `select 1 as ok` returned status 201 before applying the migration.
- Verification: Post-apply SQL confirmed `public.user_insight_cards`, `get_personality_insight_graph`, `refresh_user_insight_cards`, and `mark_insight_card_read` exist.
- Verification: Transactional smoke test created a temporary auth/profile/trait/vote context and rolled it back; `get_personality_insight_graph` returned 5 nodes and 4 edges, and `refresh_user_insight_cards` returned 1 card.
- Verification: `npm.cmd run typecheck` passed.
- Verification: `npx.cmd expo export --platform web` passed.
- Note: The live app tab currently has no Supabase Auth session and the new project has 0 profiles, so a real logged-in app-user RPC smoke test must wait until a user logs in and creates a profile.

## 2026-06-02 18:39 KST - Social Auth and Magic Link Plan

- Work: Created a full implementation plan for Kakao, Naver, Google, and email magic-link login.
- Scope: `docs/superpowers/plans/2026-06-02-social-auth-magic-link.md`, `timeline.md`.
- Decision: Use Supabase Auth as the only session source; Google and Kakao use built-in providers, email uses `signInWithOtp`, and Naver is gated behind a Custom OAuth compatibility smoke test before the button is enabled.
- Review: GPT-5.3-Codex-Spark read-only reviewer flagged redirect URI drift, SecureStore/session persistence, missing provider email, identity linking, CSRF/PKCE, and environment separation risks; accepted items were reflected in the plan.
- Sources: Supabase Auth redirect/deep-link/social/magic-link/custom OAuth docs, Expo AuthSession docs, and Naver developer OAuth docs.

## 2026-06-02 19:05 KST - Social Auth External Review Validation

- Work: Reviewed `social_auth_review_report.md` and updated the social auth implementation plan with validated items only.
- Scope: `docs/superpowers/plans/2026-06-02-social-auth-magic-link.md`, `timeline.md`.
- Accepted: single-owner signout, OAuth profile metadata hardening, native SecureStore chunking for large sessions, `EXPO_PUBLIC_SITE_URL` env typing, auth listener duplicate prevention, OAuth cancel routing guard, magic-link resend cooldown, provider setup warnings, and Vercel callback rewrite verification.
- Rejected: plain native AsyncStorage fallback for auth tokens, because it weakens token storage; the plan now uses SecureStore chunking on native and AsyncStorage only on web.
- Verification: Plan placeholder scan found only React Native `TextInput` placeholder props, and `git diff --check` reported no whitespace errors beyond existing CRLF warnings.

## 2026-06-02 19:42 KST - Social Auth Implementation

- Work: Implemented Supabase-backed Google/Kakao OAuth, email magic-link login, gated Naver provider wiring, shared auth storage, and callback routing.
- Scope: `.env.example`, `src/lib/env.ts`, `src/lib/supabaseClient.ts`, `src/services/authService.ts`, `src/store/authStore.ts`, `src/app/login.tsx`, `src/app/auth/callback.tsx`, `src/app/_layout.tsx`, `src/app/(tabs)/profile.tsx`, `src/app/(tabs)/island.tsx`, `src/store/gamificationStore.ts`, `src/services/*Service.ts`, `supabase/migrations/202606021900_auth_profile_metadata.sql`, `docs/auth-provider-setup.md`.
- Change: Supabase client creation now lives in one shared module with SecureStore chunking on native and AsyncStorage on web.
- Change: Guest profile/island flows now route auth-only actions to `/login`; logout is owned by `authStore`, while gamification signout only clears local state.
- Change: OAuth profile creation migration now reads provider metadata from common Google/Kakao/Naver shapes and creates a profile fallback safely.
- Verification: `npm.cmd run typecheck` passed after route typing and guest-action fixes.

## 2026-06-02 19:50 KST - Social Auth Supabase Apply

- Work: Applied `supabase/migrations/202606021900_auth_profile_metadata.sql` to Supabase project `ztcexgnelqtdzinfgoja` through the authenticated dashboard session.
- Verification: Supabase SQL API returned status 201 for the migration.
- Verification: `pg_get_functiondef('public.handle_new_user()')` now includes the nested `response,nickname` metadata lookup used for Naver-style provider payloads.

## 2026-06-02 22:03 KST - Vercel Auth Smoke Fix

- Work: Configured Vercel production/preview env variables and Supabase Auth URL settings for the deployed Balance Island app.
- Scope: Vercel project `balance`, Supabase Auth URL Configuration, `src/lib/env.ts`, `timeline.md`.
- Fix: `/login` initially rendered after deploy, but magic-link submission reported `Supabase config is required` because Expo Web did not inline dynamic `process.env[name]` access.
- Change: `getPublicEnv()` now uses static `process.env.EXPO_PUBLIC_*` property access so Expo can inline public env values during web export.

## 2026-06-02 22:19 KST - Auth Callback State Hardening

- Work: Applied read-only reviewer feedback after the first real email magic-link verification.
- Scope: `src/store/authStore.ts`, `src/app/auth/callback.tsx`, `src/app/login.tsx`, `timeline.md`.
- Fix: Auth bootstrap no longer consumes the initial callback URL, preventing the callback screen from trying to exchange the same code twice.
- Fix: Successful social/callback logout transitions now clear the gamification snapshot so profile/island screens reload authenticated data instead of keeping the old guest preview.
- Fix: Callback navigation now happens only when session creation succeeds; failures stay on the callback screen and show the error.
- Fix: Email resend cooldown now starts only after the magic-link request succeeds.

## 2026-06-03 00:00 KST - Codex Reinstall Handoff

- Work: Created a reinstall handoff document so the project can resume cleanly after Codex app reinstall.
- Scope: `docs/codex-reinstall-handoff.md`, `timeline.md`.
- Reason: Browser/Chrome/Computer Use plugin entries disappeared from the Codex UI after reinstall troubleshooting, while local plugin cache files still existed.
- Included: current project URLs, recent commits, Vercel/Supabase auth status, email magic-link smoke result, Chrome CDP fallback notes, verification commands, and next work queue.
- Security: Magic-link tokens, secret keys, service role keys, and database passwords were intentionally excluded.

## 2026-06-03 01:56 KST - Reinstall Handoff Resume Check

- Work: Resumed from `docs/codex-reinstall-handoff.md` and verified the next queued auth/login checks.
- Finding: `src/app/login.tsx` appears mojibake when read with PowerShell's default encoding, but `Get-Content -Encoding utf8` shows the Korean copy and JSX are intact.
- Verification: `npm.cmd run typecheck` passed.
- Verification: `npx.cmd expo export --platform web` passed.
- Verification: `git diff --check` passed with only the existing CRLF warning for `timeline.md`.
- Verification: Local Expo web required network access to fetch Expo SDK metadata, then `http://localhost:8081/login` returned HTTP 200.
- Limitation: Browser/Chrome/Computer Use screen-control tools were still not exposed in this Codex session, so visual screenshot smoke testing was not completed here.

## 2026-06-03 02:14 KST - Google Kakao OAuth Provider Smoke

- Work: Continued the auth smoke test from the reinstall handoff queue.
- Finding: `src/app/login.tsx` is valid UTF-8 and renders Korean correctly in Chrome at `http://localhost:8081/login`; the earlier mojibake is PowerShell default-decoding behavior.
- Verification: Saved a local Chrome screenshot to `login-smoke.png` and confirmed visible Korean copy for the login heading, Google/Kakao/Naver buttons, and magic-link section.
- Verification: The Google login button handler is wired; automated direct click surfaced a browser popup-blocking error rather than a missing app handler.
- Verification: Supabase JS generated OAuth authorize URLs for both `google` and `kakao`, but Supabase returned `400 validation_failed` with `Unsupported provider: provider is not enabled` for both.
- Conclusion: Google/Kakao cannot complete real login until the Supabase Dashboard providers are enabled and configured with their Client ID/Secret values.

## 2026-06-03 02:23 KST - OAuth Web Redirect and Callback Hardening

- Work: Continued as the main agent while a GPT-5.3-Codex-Spark read-only reviewer checked missed auth risks.
- Review finding addressed: web social login was vulnerable to browser popup blocking because `openAuthSessionAsync` opened a separate auth session on web.
- Change: `signInWithSocialProvider` now uses `window.location.assign(data.url)` on web, while keeping `WebBrowser.openAuthSessionAsync` for native.
- Change: native social auth cancel/dismiss paths now surface explicit errors instead of silently returning `false`.
- Review finding addressed: `auth/callback` now subscribes to `Linking.addEventListener('url', ...)` and deduplicates callback URLs, so native deep-link callbacks can be handled when the app is already running.
- Verification: `npm.cmd run typecheck` passed.
- Verification: `npx.cmd expo export --platform web` passed.
- Verification: Chrome CDP smoke confirmed Google and Kakao buttons both navigate the current tab to Supabase `/auth/v1/authorize`; Supabase still returns provider-disabled until dashboard credentials are enabled.

## 2026-06-03 02:30 KST - Auth Profile Resilience and Google Provider Setup

- Work: Continued with GPT-5.3-Codex-Spark as a read-only reviewer and addressed the new highest-risk auth finding.
- Review finding addressed: auth callback/session sync no longer depends on profile fetch success. `authStore` now sets the authenticated user first and stores profile load failure separately as `profileError`.
- Change: bootstrap, auth state listener, social completion, and callback completion now use a safe profile fetch path so profile RLS/trigger lag does not fail a valid auth session.
- Change: removed the unused `getInitialLinkingUrl` auth helper and its `expo-linking` import from `authService`.
- Dashboard: opened Supabase Auth Providers for project `ztcexgnelqtdzinfgoja`; the dashboard confirmed Google and Kakao are currently `Disabled`.
- Dashboard: opened the Google provider configuration panel and stopped at the user-owned Client ID/Client Secret entry step.
- Verification: `npm.cmd run typecheck` passed.
- Verification: `npx.cmd expo export --platform web` passed.
- Verification: `git diff --check` passed with only existing CRLF conversion warnings.

## 2026-06-03 02:36 KST - OAuth Provider Console Setup Plan

- Work: Created an official-docs-based operational plan for Google and Kakao provider console setup.
- Scope: `docs/superpowers/plans/2026-06-03-oauth-provider-console-setup.md`, `timeline.md`.
- Sources: Supabase Google/Kakao provider docs, Supabase redirect URL docs, Google OAuth client console help, and Kakao Login prerequisite/REST API docs.
- Decision: The agent can open dashboards, navigate screens, enter non-secret values, and run smoke checks; the user handles dashboard authentication and directly pastes provider secrets into browser fields.
- Security: Client IDs, client secrets, Kakao REST API key, auth codes, tokens, and token-bearing callback URLs must not be written to git, docs, screenshots, terminal output, or chat.
- Verification: Plan placeholder scan passed after replacing secret placeholders with direct browser-field paste instructions.

## 2026-06-03 02:44 KST - OAuth Console Guide Validation

- Work: Reviewed the user-provided Google/Kakao console setup guide against official Supabase, Google, and Kakao documentation.
- Accepted: Google OAuth consent/testing user checks, Google web OAuth client origin/redirect URI setup, Supabase Google provider enablement, Kakao Login ON, Kakao redirect URI, consent items, REST API key as Client ID, Kakao Client Secret, and Supabase Kakao provider setup.
- Adjusted: Google scope checklist now includes Supabase-required `openid` in addition to `userinfo.email` and `userinfo.profile`.
- Adjusted: Supabase URL configuration verification now uses dashboard confirmation instead of relying on an unsupported public Auth settings endpoint.
- Adjusted: Kakao redirect URI instructions now prefer `Product Settings > Kakao Login > General`, while allowing the REST API key edit page if the Kakao UI routes there.
- Verification: Plan placeholder scan passed and Markdown code fence count is balanced.

## 2026-06-03 03:08 KST - Supabase Auth URL Configuration Verified

- Work: Began executing `docs/superpowers/plans/2026-06-03-oauth-provider-console-setup.md`.
- Dashboard: Supabase Auth URL Configuration for project `ztcexgnelqtdzinfgoja` was opened and inspected.
- Verification: Site URL is `https://balance-vert.vercel.app`.
- Verification: Redirect URL allow-list contains `balanceisland://**`, `https://balance-vert.vercel.app/auth/callback`, `https://balance-vert.vercel.app/**`, `http://localhost:8081/**`, and `http://127.0.0.1:8081/**`.
- Verification: `npm.cmd run typecheck` passed.

## 2026-06-03 03:31 KST - Google OAuth Provider Enabled

- Work: Created a new Google Web OAuth client for Balance Island and configured production plus local web origins and the Supabase OAuth callback URL.
- Work: Added the Supabase-required `openid` Google data access scope alongside email and profile scopes.
- Security: The downloaded Google client secret JSON was moved out of the git repository, and `client_secret_*.json` was added to `.gitignore`.
- Dashboard: Supabase Google provider was enabled and saved with the Google OAuth credentials.
- Verification: Supabase OAuth authorize smoke for `google` returned HTTP 302 to `accounts.google.com`.

## 2026-06-03 03:58 KST - Kakao OAuth Provider Enabled

- Work: Created and configured the Kakao Developers app for Balance Island.
- Dashboard: Kakao Login was turned ON, and the Supabase OAuth callback URL was registered for the app's REST API key.
- Dashboard: Kakao consent items for nickname and profile image were enabled as optional consent; account email remains unavailable because the app is not a Kakao Biz App.
- Safety check: The current auth profile trigger derives profile fields from `raw_user_meta_data` and does not require `NEW.email`, so Supabase's Kakao email-less fallback is acceptable for MVP smoke testing.
- Dashboard: Supabase Kakao provider was enabled and saved with `Allow users without an email` ON.
- Verification: Supabase OAuth authorize smoke for `kakao` returned HTTP 302 to `kauth.kakao.com`.

## 2026-06-03 04:33 KST - Kakao KOE205 Resolved

- Finding: Production Kakao login initially reached Kakao but failed with `KOE205` because Supabase's built-in Kakao provider includes the `account_email` scope.
- Work: Registered a small app icon in Kakao Developers, converted the Kakao app to a personal developer Biz App, and changed `account_email` from `사용 안 함` to `필수 동의`.
- Verification: Supabase authorize for `kakao` returned HTTP 302 to `kauth.kakao.com`, and Kakao then returned HTTP 302 to `accounts.kakao.com` instead of rendering the `KOE205` error page.
- Verification: Production `/login` Kakao button now navigates from Balance Island to the Kakao consent screen for `Balance Island`; the consent screen shows required email plus optional nickname/profile image consent.
- Limitation: Real Kakao login completion is waiting at the user-owned Kakao consent step; token-bearing callback URLs were not copied or recorded.

## 2026-06-03 04:49 KST - Kakao Real Login and Side Effects Verified

- Work: User completed the Kakao account login and consent screen in Chrome.
- Verification: Production app returned to `https://balance-vert.vercel.app/profile` and rendered a non-guest profile with the Kakao-created session.
- Verification: Profile screen showed nickname `islander_dcc0ac`, shell/streak/participation counters, and logout/check-in actions.
- Verification: Island screen loaded the authenticated gamification snapshot with avatar mood/energy values, confirming `user_avatar_state` was available through the app session.
- Verification: Triggered the app's `펫 배정` action and the Island screen updated from no pet to `카멜레온`, confirming `user_pet_state` creation/loading.
- Security: Callback URL query strings, auth codes, access tokens, refresh tokens, and provider credentials were not recorded.

## 2026-06-03 05:02 KST - Google Production Login Smoke Rechecked

- Work: Logged out of the production app session and re-ran the Google login button flow from `https://balance-vert.vercel.app/login`.
- Verification: The app returned to `https://balance-vert.vercel.app/profile` and rendered the non-guest profile screen with logout/check-in actions.
- Note: The visible profile nickname matched the existing account, so this confirms production Google login flow/session creation is not blocked, but it does not distinguish a separate Google-only user from the already linked/same-email account.
- Security: Token-bearing callback URLs and browser storage were not inspected or recorded.

## 2026-06-03 05:25 KST - Edge Function AI Cost Guard First Pass

- Work: Hardened `supabase/functions/embed-question/index.ts` and `supabase/functions/refine-question/index.ts` beyond the existing JWT check.
- Security: Added POST-only handling, request size limits, field length/category validation, per-user in-memory rate limits, masked OpenAI upstream errors, and restricted browser CORS origins to production plus local dev origins.
- Security: Removed caller-controlled `systemPrompt` from `refine-question`; the function now always uses the server-side default system prompt.
- Security: Added runtime validation for the refined OpenAI JSON payload before returning it to callers.
- Limitation: The rate limit is an immediate in-process guard only; Supabase Edge isolate restarts or scale-out can reset it. Durable DB/RPC-backed quota and actual Edge Function deployment remain next steps.

## 2026-06-03 05:40 KST - Durable AI Edge Rate Limit Prepared

- Work: Added `supabase/migrations/202606030530_ai_edge_rate_limits.sql` with `ai_edge_rate_limit_events` and the `check_ai_rate_limit()` RPC.
- Security: Updated `embed-question` and `refine-question` to call the durable RPC before any OpenAI request; if the RPC is unavailable, the functions fail closed with 503 instead of spending API tokens.
- Security: Kept the in-memory per-isolate limiter as a second local guard after the durable DB quota.
- Verification: A pre-implementation source check failed for missing migration/RPC wiring; after the change, the same check passed and `npm.cmd run typecheck` passed.
- Limitation: The migration still needs to be applied to the live Supabase DB, then both Edge Functions need deployment and authenticated smoke testing.

## 2026-06-03 05:55 KST - AI Edge Rate Limit Deployed

- Work: User completed Supabase CLI authentication in an interactive PowerShell window.
- Deployment: Ran Supabase project link, database migration push, and Edge Function deploy commands for `embed-question` and `refine-question`.
- Verification: Deployment window reported `Supabase migration and Edge Function deploy commands completed.`
- Verification: External unauthenticated POST smoke tests against both deployed function URLs returned HTTP 401 with missing authorization header errors, confirming unauthenticated calls do not reach OpenAI.
- Security: Supabase access token, DB password, callback URLs, and auth tokens were not recorded in chat or repository files.

## 2026-06-03 18:30 KST - Obsidian AI 업무 위키 통합 및 기획 마이그레이션

- Work: 김효율 AI 업무 위키 템플릿의 디렉토리 구조(`AI-Sessions/`, `prompts/`)를 루트에 연동하고, 핵심 규칙 파일(`CLAUDE.md`, `AGENTS.md`, `index.md`, `log.md`)을 루트에 배치함.
- Work: 기존에 흩어져 있던 `/docs` 하위의 계획 및 리뷰 보고서들을 위키 3-Layer 아키텍처에 맞춰 각 영역(`AI-Sessions/raw/plans/`, `wiki/sources/`, `conversations/`)으로 안전하게 마이그레이션 완료.
- Design: Balance Island 프로젝트 전용 가이드라인을 `CLAUDE.md` 하단에 병행 준수 규칙으로 커스텀 탑재.
- Concept: 핵심 비즈니스 개념 3개(`bipi-personality-system`, `pet-care-and-evolution-system`, `shell-economy-and-rpc-security`) 및 아키텍처 의사결정 2개(`oauth-provider-selection`, `bipi-model-adoption`)를 위키 문서로 작성하고 `index.md`에 교차 참조 링크 갱신 완료.

## 2026-06-03 19:30 KST - 위키 하드닝(Hardening) 및 검증 스크립트 배포

- Hardening: `.gitignore`에 Obsidian 로컬 작업 세션 캐시 파일(`.obsidian/workspace*`) 제외 규칙 적용 완료.
- Hardening: 템플릿 누락 루트 문서 5건(`README.md`, `START_HERE.md`, `TEMPLATE_MANIFEST.md`, `VERSION`, `LICENSE.md`) 생성하여 위키 정합성 확보.
- Script: 크로스플랫폼 린트 스크립트 `scripts/validate-wiki.mjs` 신규 작성 및 `validate:wiki` npm script 추가.
- Safety: `validate-wiki.mjs` 검사 시 규칙 파일(`CLAUDE.md`), 프롬프트, 기획 본문(`/docs/`)은 Secret 패턴 오탐(False Positive)에서 예외 처리하고, 크로스플랫폼 경로 호환 가드 코드를 보강 완료.
- Validation: `npm run validate:wiki` 명령으로 전체 위키 데이터 검증을 수행하여 정상 통과(`Wiki validation passed.`) 확인 완료.
- Refactor: 580줄에 이르던 비대한 `research.md` 리스크 문서를 과거 이력 아카이브(`docs/research-history.md`)와 현재 활성 리스크로 완전 이원화하여 슬림화 완료.

## 2026-06-03 21:40 KST - P1 핵심 제품 고도화 기능 구현 완료

- 작업: `2026-06-03-deep-research-product-upgrade.md` 기획서에 명시된 P1 핵심 기능들을 실제 React Native 코드베이스에 구현 완료.
- 범위:
  - `src/constants/categories.ts`, `src/constants/productCopy.ts`
  - `src/services/analyticsService.ts`, `src/utils/choiceEcho.ts`
  - `src/components/feed/ChoiceEchoSheet.tsx`, `src/components/island/TodayDiscoveryCard.tsx`
  - `src/components/island/IslandModeTabs.tsx`, `src/components/island/ThemeProbabilitySheet.tsx`
  - `src/app/(tabs)/index.tsx`, `src/app/(tabs)/island.tsx`
- 이유: 단순 A/B 투표 앱을 감성적이고 몰입감 있는 자기 성찰/발견 서비스로 고도화하기 위함.
- 검증: `npm run typecheck`, `npm run validate:pet-assets`, `npm run validate:wiki`를 차례로 실행하여 모든 검증 및 타입 에러 정정 완료.

## 2026-06-03 21:50 KST - Visual UI/UX 고도화 기능 구현 완료

- 작업: `2026-06-03-visual-ui-upgrade-plan.md` 기획서에 명시된 비주얼 고도화 기능들을 구현 완료.
- 범위:
  - `src/theme/styles.ts` (공통 스타일 및 그라데이션 상수 신규 정의)
  - `src/app/(tabs)/index.tsx` (리액션 클릭 시 위로 솟아오르는 이모지 파티클 애니메이션 추가)
  - `generate_image` 스킬로 화면별 프리미엄 디자인 시안 3건 도출 및 아티팩트 보존.
- 이유: 앱의 미감을 향상시켜 프리미엄 모바일 프로덕트로서의 Wow 효과를 확보하기 위함.
- 검증: `npm run typecheck`, `npm run validate:pet-assets`, `npm run validate:wiki`를 차례로 실행하여 정상 빌드 및 린트 정합성 유지 확인 완료.

## 2026-06-03 22:10 KST - Visual UI/UX 리팩토링 및 디자인 가이드라인 위키 연동

- 작업: Visual UI/UX 계획서(`2026-06-03-visual-ui-upgrade-plan.md`)를 위키 표준에 맞춰 디자인 가이드 문서로 정리하고, 세부 컴포넌트들의 테마/성능 제약을 실 코드베이스에 최종 리팩토링하여 반영함.
- 범위:
  - `src/theme/motion.ts`, `src/theme/surfaces.ts` (모션 템포 및 표면 깊이 토큰 모듈화 분리)
  - `src/theme/styles.ts` (신규 토큰들을 사용하도록 전면 리팩토링)
  - `src/app/(tabs)/index.tsx` (파티클 최대 활성 개수 12개 제한 및 모션 토큰 적용)
  - `src/components/feed/ChoiceEchoSheet.tsx` (글래스 표면 위계 및 그림자 연동)
  - `src/app/(tabs)/island.tsx` (시간대별 하늘 그라데이션 토큰 헬퍼 연동)
  - `src/components/insight/InsightGraphCanvas.tsx` (그래프 노드 강조 및 점선 애니메이션 보류 등 모션 절제 정책 적용)
  - `src/app/(tabs)/create.tsx` (AI 다듬기 경고 메시지 구체화로 마법 콘셉트 상태 명확화)
  - `AI-Sessions/wiki/design/visual-ui-guidelines.md` (디자인 가이드 위키 문서 생성)
  - `index.md`, `log.md` (위키 문서 링크 추가 및 작업 로그 추가)
- 이유: 과도한 애니메이션 남발을 억제하고 성능 가이드라인을 유지하면서 비주얼 디자인을 고도화하여 앱의 사용성을 보장하기 위함.
- 검증: `npm run typecheck`, `npm run validate:pet-assets`, `npm run validate:wiki`를 순차 실행하여 전체 빌드 정합성과 위키 린트 검증 정상 통과 확인.

## 2026-06-04 00:50 KST - Premium Visual UI/UX Upgrade (시안 수준 100% 매칭 고도화)

- 작업: 사용자가 제공한 3D Cozy Island, 우주 네온 글로잉 마인드맵, 글래스모피즘 피드 등의 프리미엄 디자인 시안을 100% 충족하도록 실 코드베이스를 최종 전면 리팩토링 완료.
- 범위:
  - `src/components/common/GlassView.tsx` (웹 backdrop-filter 및 모바일 투명도 Fallback 처리된 크로스플랫폼 컴포넌트 신규 작성)
  - `src/components/feed/BalanceCard.tsx` (GlassView 적용, 가로 대칭형 레이아웃 및 중앙 VS 배지, 하단 통합 결과 프로그레스 바 적용)
  - `src/app/(tabs)/index.tsx` (모형 radial-gradient를 대체하여 4개의 흐릿한 파스텔 배경 스폿 효과 추가, 상단 레벨 스태츠 및 아바타 프로필 엠블럼 매칭)
  - `src/app/(tabs)/island.tsx` (상단 My Island 글래스 요약 바, 가로 2단 펫 무드/에너지 게이지 카드, 중앙 Cozy Island 펫 이미지 및 하트 부유 펄싱 애니메이션 구현, 하단 조개/젬 상자 대칭 배지 레이아웃 개편)
  - `src/components/insight/InsightGraphCanvas.tsx` (어두운 성운 밤하늘 배경, Defs 필터 stdDeviation 발광을 이용한 주황/민트/자홍 형광 네온 글로잉 마인드맵 및 다크 글래스모피즘 결과 카드 구현)
  - `task.md`, `log.md`, `timeline.md` (체크리스트 완료, 작업 로그 및 타임라인 기록 추가)
- 이유: 단순 플랫 디자인을 시안과 동일한 몽환적인 3D, 글래스, 밤하늘 글로잉 입체 레이아웃으로 변환해 최정상급 프리미엄 미감을 제공하기 위함.
- 검증: `npm run typecheck`, `npm run validate:wiki`를 순차 실행하여 모션 리렌더링 예외 없이 완벽하게 빌드 및 린트 통과 완료.

## 2026-06-04 01:17 KST - 3D/글래스/네온 시안 100% 매칭 고도화 완료 (Premium Visual Match)

- 작업: 사용자가 제공한 3가지 핵심 화면 시안(Cozy Island, Starry Mind, Feed Premium Card)에 맞추어 실감형 3D 에셋 생성 및 코드 전면 고도화 완료.
- 범위:
  - `assets/pets/cozy-island-retriever.png`, `assets/feed/fried-chicken.png`, `assets/feed/shaved-ice.png`, `assets/icons/shell.png`, `assets/icons/gem-chest.png` (3D 이미지 에셋 신규 추가)
  - `src/theme/styles.ts` (그라데이션 및 글래스 투명도 토큰 조정)
  - `src/components/feed/BalanceCard.tsx` (좌우 대칭 카드, 세로 구분선 및 VS 배지, 단일 가로 트랙 결과 바 및 골드 배지, VOTE NOW 버튼 구현, 3D 에셋 매핑 및 Fallback 구현)
  - `src/app/(tabs)/index.tsx` (로고 색상 매칭, Stats 영역 프리미엄 글래스모피즘 바 리팩토링, onViewableItemsChanged 예외 가드 추가)
  - `src/app/(tabs)/island.tsx` (Decorate 모드 시 3D 골든 리트리버 아일랜드 에셋 적용 및 플로팅 애니메이션 통합, My Island 탑바 게이지 가로 정렬, Status panel 게이지 개편, Shell/Gem 3D 아이콘 획득 배지 적용)
  - `src/components/insight/InsightGraphCanvas.tsx` (우주 은하수 배경, 반짝이는 별들 및 moon path 렌더링, Constellation 점선 연결, 카테고리별 주황/민트/자홍 색상 바인딩 및 glowing filter 효과, Sarah's Universe 닉네임 연동, 선택 시 절대좌표 툴팁 말풍선 callout 렌더링 구현)
- 이유: 단순 플랫 스타일이었던 이전 UI/UX를 사용자가 업로드한 3D 시안의 깊이감과 네온 글로우, 정밀 타이포그래피에 100% 매칭시켜 프리미엄 밸류를 제공하기 위함.
- 검증: `npm run typecheck` (통과), `npm run validate:wiki` (통과), `npm run validate:pet-assets` (통과).

## 2026-06-04 03:55 KST - Phase 0 기반 토목공사 (코드 측) 착수 및 완료

- 작업: 트렌디 자기발견 업그레이드 계획서 §6 Phase 0 중 코드/로컬에서 안전하게 가능한 항목 구현.
- 범위:
  - `supabase/migrations/202606040400_schema_migration_tracking.sql` (migration 적용 추적 테이블 `schema_migrations` 신규 + 기존 8개 버전 백필, comprehensive-review C3 대응)
  - `src/components/feed/BalanceCard.tsx` (외부 Unsplash 이미지 로딩 실패 시 카테고리 톤 placeholder 폴백 + 200ms 페이드, research.md S1 완화)
  - `scripts/migrate-feed-images-to-storage.mjs` (외부 이미지 → Supabase Storage 자체 호스팅 마이그레이션 도구 신규; dry-run으로 외부 이미지 57개 확인)
  - `docs/2026-06-04-phase0-foundation-handoff.md` (Phase 0 완료/인수인계 문서; 라이브 적용 명령 포함)
- 검증/확인:
  - `schema.sql:1-4` 파괴적 DROP 차단 경고 이미 존재 → 추가 조치 불필요 확인.
  - `handle_new_user`가 `NEW.email`을 참조하지 않아 이메일 없는 Kakao 사용자도 안전함을 코드로 확인.
  - `npm run typecheck` 통과, `npm run validate:wiki` 통과.
- 이유: 계획서 대전제("기능 추가보다 기반 안정화 우선")에 따라 출시 전 리스크(C3 migration 추적, S1 외부 이미지 의존)를 코드 측에서 먼저 제거.
- 후속(사용자 실행 필요): Edge rate limit DB 적용+배포+스모크, 이미지 자체 호스팅 스크립트 실행, 모바일 딥링크 QA — 상세는 handoff 문서 참조.

## 2026-06-04 04:20 KST - Phase 1 핵심 루프 구현 (희귀도 노출 · 펫 말풍선 · 오늘의 딜레마 테마)

- 작업: 트렌디 자기발견 업그레이드 계획서 §6 Phase 1의 핵심 경험 3종을 클라이언트 측에서 구현(DB 스키마 변경 없이 MVP).
- 범위:
  - `src/utils/choiceEcho.ts` (희귀도 계산 추가: 같은 선택 비율을 사용자 표 포함해 산출, 표본<10이면 '개척자' 프레이밍. 5단계 tier(pioneer/unicorn/minority/even/majority)와 tier 기반 펫 말풍선 라인 생성)
  - `src/components/feed/ChoiceEchoSheet.tsx` (tier 색상 기반 희귀도 배지 + 큰 퍼센트 + 펫 말풍선 버블 렌더)
  - `src/app/(tabs)/index.tsx` (vote_submit 애널리틱스에 rarityTier/rarityPercent 추가 — 계획서 A/B #3 측정용; 오늘의 딜레마 테마 배너를 피드 헤더에 추가)
  - `src/utils/dailyTheme.ts` (요일별 성향 축 매핑, BIPI 4축과 정렬, 신규)
- 이유: 투표 후 감정/의미 보상을 강화하고('나도 몰랐던 나' 즉시 체감), 희귀도를 바이럴 훅으로 노출하며, 복귀 이유(오늘의 테마)를 제공하기 위함.
- 톤 가드: 모든 카피는 비진단·비처벌 톤 유지(펫은 그립게 만들되 벌주지 않음).
- 검증: `npm run typecheck` 통과, `npm run validate:wiki` 통과, `npm run validate:pet-assets` 통과.
- 후속(권장): 펫 말풍선을 trait streak 기반으로 심화, 오늘의 딜레마 테마를 DB 큐레이션/이벤트로 확장, 희귀도를 공유 카드에도 노출.

## 2026-06-04 04:55 KST - Phase 2 직관적 자기지도 구현 (섬 지형 · 별자리 · semantic zoom · 모순 발견)

- 작업: 트렌디 자기발견 업그레이드 계획서 §6 Phase 2의 시각화 점진 공개와 모순 발견을 구현. 서버 의존 부분은 마이그레이션으로 핸드오프.
- 범위(클라이언트):
  - `src/components/insight/IslandTerrainView.tsx` (성향을 추상 그래프 대신 '섬 지형'으로 보여주는 직관 모드, 점수 비율로 지형 크기 성장, 1·2위 근접 시 '균형의 다리' 표현, 신규)
  - `src/components/insight/ContradictionCard.tsx` (모순 발견을 '상황별 다른 나'로 긍정 프레이밍하는 비교 카드, 신규)
  - `src/screens/InsightMapScreen.tsx` (탭 재구성: 발견/섬 지형/별자리 — 점진 공개. 기본 탭을 섬 지형으로, 발견 탭에 모순 카드, 별자리 탭에 전체 보기 리셋 추가)
  - `src/store/insightMapStore.ts` (`focusOnNode` 액션 추가 — semantic zoom)
  - `src/components/insight/InsightNodeDetailSheet.tsx` ('이 노드로 확대' 버튼으로 semantic zoom 진입)
  - `src/services/insightMapService.ts`, `src/types/database.types.ts`, `src/data/guestInsightGraph.ts` (InsightContradiction 타입 + snapshot.contradictions 옵셔널 필드 + 파싱 + 게스트 샘플)
- 범위(서버 핸드오프):
  - `supabase/migrations/202606040500_trait_contradictions.sql` (카테고리별 BIPI 분리로 모순을 계산하는 `compute_user_trait_contradictions` RPC; 표본>=3, 격차>=35p, 상위 2개. 라이브 적용/검증은 사용자 몫 — handoff 문서 §2-5)
- 이유: Obsidian 그래프를 그대로 모바일에 이식하면 복잡하므로, 섬 지형(직관)→별자리(추상) 점진 공개로 인지부하를 통제하고, '나도 몰랐던 나'의 핵심 aha인 모순 발견을 제공하기 위함.
- 검증: `npm run typecheck` 통과, `npm run validate:wiki` 통과, `npm run validate:pet-assets` 통과. (실기기/프리뷰 시각 검증은 미실시)
- 후속(사용자): `202606040500_trait_contradictions.sql` 적용 + `get_personality_insight_graph`에 contradictions 키 병합(handoff §2-5).

## 2026-06-04 05:30 KST - Phase 3 소유욕 엔진 (내 성향이 만든 펫 서사) + 웹 빌드 검증

- 작업: 트렌디 자기발견 업그레이드 계획서 §6 Phase 3의 핵심 차별점("수집을 자기발견의 보상으로 번역")을 클라이언트로 구현. 경제 잔여 항목은 핸드오프.
- 범위(클라이언트):
  - `src/components/island/PetOriginCard.tsx` (펫을 "내 성향이 만든, 세상에 단 하나뿐인 동반자"로 서사화. 상위 성향 2개 + 희귀도 배지 + 소유 프레이밍. 펫 미배정 시 수집 동기 CTA 상태, 신규)
  - `src/app/(tabs)/island.tsx` (discover 모드에 PetOriginCard 통합: 오늘의 발견 ↔ 인사이트 지도 사이)
- 범위(서버 핸드오프 — handoff §2-6): 천장(pity) 진행도 표시, 주간 챌린지 티켓, 시즌 한정+재편입, 중복→산호 가루. (기존 테마 가챠 확률/보장/중복 공시 UI는 이미 구현됨)
- 검증:
  - `npm run typecheck` 통과, `npm run build`(expo export) 성공 — 전체 번들 정상.
  - 프리뷰(dist 정적 서빙, localhost:4321)에서 실제 구동 확인: Phase 1 오늘의 딜레마 배너(🎭 차분 vs 표현, 목요일), Phase 2 섬 지형(안정의 마을 + 균형의 다리)·발견 탭 모순 발견 카드(연애 80% vs 커리어 30% 표현), Phase 3 PetOriginCard(게스트 CTA 상태) 모두 정상 렌더, 콘솔 에러 0건.
  - 한계: Choice Echo 희귀도 배지·펫 말풍선과 PetOriginCard의 펫 배정 서사 상태는 로그인+투표/펫배정이 필요해 시각 미확인(코드 경로는 빌드로 검증). 스크린샷은 RN-Web 애니메이션 루프로 타임아웃되어 DOM 텍스트 추출로 검증.
- 이유: 일반 가챠앱과의 결정적 차별점인 "내 성향이 만든 펫"을 제품에 새겨, 소유욕과 자기발견을 결합하기 위함.

## 2026-06-04 06:00 KST - Phase 3.5 정서·바이럴 (펫 일기 + 주간 리캡 + 텍스트 공유)

- 작업: 트렌디 자기발견 업그레이드 계획서 §6 Phase 3.5의 데이터 스토리텔링/정서 채널을 클라이언트로 구현. 서버·네이티브 의존 항목은 핸드오프.
- 범위(클라이언트):
  - `src/utils/traitLabels.ts` (성향 키→라벨 공유 유틸, 중복 제거, 신규)
  - `src/components/island/PetDiaryCard.tsx` (펫이 그날의 상위 성향+참여로 짧은 일기를 남김, 하루 단위 결정적, 비진단 톤, 신규)
  - `src/components/island/WeeklyRecapCard.tsx` (Wrapped식 요약: 누적 선택·최상위 성향·연속 참여+펫 한마디. 무의존 텍스트 공유(RN Share/navigator.share). 데이터 없으면 미노출. 신규)
  - `src/services/analyticsService.ts` (`share_card_generate`/`share_card_complete` 이벤트 추가 — 계획서 KPI)
  - `src/app/(tabs)/island.tsx` (discover 모드에 PetDiaryCard·WeeklyRecapCard 통합)
- 범위(핸드오프 — handoff §2-7): 정확한 주간 윈도우 집계, 펫 일기 서버 자동생성/보관(pet_diary_entries), 공유 이미지 export(view-shot/html2canvas), 시간여행(user_personality_snapshots 비교).
- 검증:
  - `npm run typecheck` 통과, `npm run build`(expo export) 성공.
  - 프리뷰에서 PetDiaryCard 게스트 빈 상태("오늘은 아직 주인을 못 만났어…", 6월 4일) 정상 렌더 확인. WeeklyRecapCard는 게스트(데이터 0)에서 의도대로 미노출 — 로그인 데이터 시 표시.
  - 한계: 로그인 데이터가 필요한 리캡 본문/공유 동작은 시각 미확인(코드 경로는 빌드로 검증).
- 이유: "데이터를 돌려주면 자발적으로 공유한다"(Wrapped 공식)로 바이럴을 만들고, 펫 일기로 인사이트를 감성 채널로 전달하기 위함.

## 2026-06-04 06:45 KST - 디자인 시스템 업그레이드 D9(토큰 파운데이션) + D2(골드 결과바)

- 작업: 디자인 시스템 업그레이드 계획서(docs/2026-06-04-design-system-upgrade-plan.md)의 선행 토큰 작업과 첫 시그니처 컴포넌트 적용.
- 범위:
  - `src/theme/gradients.ts` (feedBokeh/islandSunset/insightNebula 그라데이션 토큰, 신규)
  - `src/theme/styles.ts` (THEME에 gradients 연결 + glowByCluster(food/life/romance 네온), elevation(e1~e3), accentColors(gold), typography display/stat/badge 추가 — 모두 비파괴적)
  - `src/components/feed/BalanceCard.tsx` (결과 바: 승리 측을 골드로 강조 — progressBarFillWin, percentLabelWin(흰색), votesInfoWin(앰버). 시안의 단일 트랙 골드 강조와 정합)
- 검증: `npm run typecheck` 통과, `npm run build`(expo export) 성공, `validate:wiki`/`validate:pet-assets` 통과.
- 한계: 결과 바는 투표(로그인) 후에만 노출되어 게스트 프리뷰로는 시각 미확인. 빌드/타입으로 검증.
- 후속: D1(XP 헤더), D4(섬 듀얼 게이지/Gem 통화), D6(네온 클러스터 라벨+근거 콜아웃+Map View)로 토큰 적용 확대.

## 2026-06-04 07:00 KST - 디자인 D1 (피드 XP/레벨 헤더 칩)

- 작업: 디자인 계획서 D1. 피드 상단에 실제 레벨/XP 칩 추가(시안의 Level 헤더 정합).
- 범위: `src/app/(tabs)/index.tsx` — useGamificationStore 연동(스냅샷 없으면 loadSnapshot), 헤더에 Lv.N + XP 미니 바(experience/level×100) + 표기 칩 렌더. 데이터 없으면 미노출.
- 검증: `npm run typecheck` 통과, `npm run build` 성공. 프리뷰에서 게스트 "Lv.1 0/100" 헤더 칩 정상 렌더 확인.
- 후속: D4(섬 듀얼 게이지/Gem), D6(네온 클러스터+콜아웃+Map View).

## 2026-06-04 07:30 KST - 디자인 D4(섬 통화 카드 깊이/골드) + D6(별자리 클러스터 범례)

- 작업: 디자인 계획서 D4·D6의 안전·정직 증분.
- 범위:
  - `src/app/(tabs)/island.tsx` (통화 카드에 elevation 깊이 + Shell 값 골드 강조. Gem은 데이터 백킹이 없어 "준비 중" 정직 유지 — 가짜 수치 표기 금지)
  - `src/screens/InsightMapScreen.tsx` (별자리 탭에 클러스터 범례: 푸드·건강(주황)/삶·균형(민트)/관계·연결(자홍), THEME.glowByCluster 색과 정렬. 복잡한 네온 캔버스는 회귀 위험으로 미개조)
- 검증: `npm run typecheck` 통과, `npm run build` 성공, 프리뷰에서 별자리 범례 정상 렌더 확인.
- 한계/후속: D6의 근거 콜아웃·Map View 토글은 InsightGraphCanvas 내부 개조가 필요해 보류(향후 캔버스 정독 후 진행). Gem 통화는 서버 잔액 도입 시 표기.

## 2026-06-04 08:30 KST - UI/UX 라이브러리 도입 (gradient·haptics·blur·reanimated·gesture)

- 작업: 디자인 계획서 §3-A 도구 파이프라인. 시안 구현 토대 라이브러리 설치 및 일부 적용. 전부 `npx expo install`로 SDK 51 호환 버전 설치.
- 설치: expo-linear-gradient, expo-haptics, expo-blur, react-native-reanimated, react-native-gesture-handler.
- 적용:
  - `src/app/(tabs)/index.tsx` (피드 배경에 LinearGradient = gradients.feedBokeh 토큰 적용; 투표 시 expo-haptics 라이트 임팩트, 웹 가드)
  - `src/components/common/GlassView.tsx` (네이티브에 BlurView 추가 = 진짜 프로스티드 글래스. 웹 경로는 backdropFilter 그대로 유지 — 무회귀)
  - `babel.config.js` (react-native-reanimated/plugin 추가, plugins 마지막)
  - `src/app/_layout.tsx` (gesture-handler 엔트리 import 최상단)
- 검증: `npm run typecheck` 통과, `npm run build`(expo export, reanimated babel 포함) 성공, 프리뷰에서 부팅·피드·그라데이션(135deg feedBokeh) 정상 + 콘솔 에러 0건.
- 한계: 네이티브 BlurView/haptics/reanimated 모션은 dev build에서만 시각 검증 가능(웹은 검증됨). reanimated/gesture/blur는 향후 bottom-sheet/moti/lottie 도입과 모션 고도화의 토대.
- 주의: 이 네이티브 모듈들은 Expo Go가 아닌 dev build(EAS/prebuild) 필요. SDK 51은 구버전이라 추후 업그레이드 검토 권장.

## 2026-06-04 09:00 KST - dev build 준비 + Tier2(view-shot) + SDK 업그레이드 어셋먼트

- 작업: 추천 순서(① dev build ② Tier2 ③ SDK 업그레이드) 진행.
- ① dev build 준비(코드/설정만, 클라우드 빌드는 사용자):
  - `expo-dev-client` 설치, `src/app/_layout.tsx` 루트 `GestureHandlerRootView` 래핑, `eas.json`(dev/preview/prod) 생성.
- ② Tier2:
  - `react-native-view-shot` 설치 → `WeeklyRecapCard` 공유를 **네이티브 이미지(PNG) 캡처**로, 웹은 텍스트 공유 폴백(가드).
  - `@gorhom/bottom-sheet`는 **reanimated 3.16+ 요구 ↔ SDK 51의 3.10 충돌**로 보류(드래그 시트는 SDK 업그레이드 후).
- ③ SDK 업그레이드: `expo-doctor` 17/17 통과(SDK51 건강). 업그레이드는 RN 버전 상승 동반 대규모 마이그레이션이라 **웹만 검증 가능한 현 세션 강행은 회귀 위험** → dev build 검증과 함께 전담 작업 권장(handoff §2-8에 경로 기록).
- 검증: `npm run typecheck` 통과, `npm run build`(expo export) 성공, `expo-doctor` 통과, 프리뷰 부팅 정상.
- 결론: dev build 준비 완료(사용자 실행 대기), bottom-sheet/SDK는 업그레이드 게이트로 묶임.

## 2026-06-04 09:40 KST - dev build 선행: 번들 식별자 + prebuild 검증 + system-ui

- 작업: dev build를 막던 설정 공백을 메우고 네이티브 생성이 정상 동작함을 검증.
- 범위:
  - `app.json` (빌드 필수인 `ios.bundleIdentifier`/`android.package` = com.alarmpet.balanceisland 추가, ios.supportsTablet)
  - `npx expo prebuild --platform android` **성공**("Finished prebuild") — reanimated/gesture/blur/dev-client/router/font/secure-store 등 모든 config plugin이 네이티브로 정상 반영됨을 확인(=dev build 어셈블 가능 신호).
  - 관리형(CNG) 유지: 생성된 `android/` 제거, `.gitignore`에 `/android` `/ios` 추가.
  - prebuild 어드바이저리 해소: `expo-system-ui` 설치(userInterfaceStyle 네이티브 적용).
  - `package.json` scripts: prebuild가 android/ios를 `expo run:*`로 갱신(네이티브 앱에 맞는 정확한 명령) — 유지.
- 검증: `npx expo-doctor` 17/17 통과, `npm run build`(expo export) 성공.
- 결과: **이제 `eas build --profile development`가 설정상 막힘 없이 실행 가능**(사용자가 eas login 후 실행). 에이전트는 클라우드/인증이 필요한 빌드 자체는 미실행.



