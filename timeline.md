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
