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
