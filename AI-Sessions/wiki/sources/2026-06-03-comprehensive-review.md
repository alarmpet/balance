---
type: source
date: 2026-06-03
status: active
source: docs/2026-06-03-comprehensive-review.md
---

# Balance Island 프로젝트 종합 리뷰 및 개선 의견

작성일: 2026-06-03 02:38 KST
작성자: Claude Opus 4.6 (Thinking)
검토 범위: OAuth Provider Console Setup 계획서, 코드베이스, 워크플로우, research.md, timeline.md, 전체 계획서 6건

---

## 1. 검토 요약

이 문서는 `2026-06-03-oauth-provider-console-setup.md` 계획서를 중심으로, 프로젝트 전체의 코드베이스, 문서 체계, 아키텍처 결정, 보안, 운영 워크플로우를 교차 검토한 결과입니다. 발견한 문제점과 개선 제안을 **긴급도(Critical/Important/Suggestion)** 순으로 정리합니다.

---

## 2. OAuth Provider Console Setup 계획서 리뷰

### 2.1 잘 된 점

- **보안 원칙이 명확합니다.** Client ID, Client Secret, REST API key, 토큰 등이 git, docs, chat, screenshot에 노출되지 않도록 하는 규칙이 반복적으로 강조되어 있습니다.
- **Supabase callback URL과 앱 callback URL의 역할 분리가 정확합니다.** Google/Kakao → Supabase callback → 앱 callback 흐름이 명확하게 기술되어 있습니다.
- **실패 분류가 구체적입니다.** Task 7의 Google/Kakao 실패 원인별 분류와 대응이 명확합니다.
- **에이전트와 사용자의 역할 분리가 좋습니다.** 에이전트는 비민감 작업을, 사용자는 인증과 시크릿 입력을 담당하는 구조입니다.

### 2.2 문제점 및 개선 제안

#### [Critical] C1. Google OAuth Consent Screen 상태 미확인

**현재 문제:**
Task 2는 OAuth 클라이언트 생성/선택만 다루고, Google OAuth Consent Screen의 현재 상태를 확인하지 않습니다. `docs/auth-provider-setup.md`에는 "testing mode라면 등록된 test user만 로그인 가능"이라고 명시되어 있지만, 계획서에는 이 확인 단계가 빠져 있습니다.

**리스크:**
- Consent Screen이 Testing 모드이면 등록하지 않은 사용자의 Google 로그인이 실패합니다.
- 프로덕션 전환에는 Google의 앱 검증이 필요할 수 있고, 이 과정이 수일~수주 걸릴 수 있습니다.

**개선안:**
```markdown
## Task 2 추가 Step: Google OAuth Consent Screen 상태 확인

- [ ] Google Cloud Console > APIs & Services > OAuth consent screen 열기
- [ ] Publishing status 확인:
  - Testing: 테스트 사용자만 로그인 가능
  - In production: 모든 Google 계정 로그인 가능
- [ ] Testing 모드이면:
  - 사용자 이메일을 Test users에 추가
  - 또는 In production으로 전환 (검증 필요 여부 확인)
- [ ] Scopes에 email, profile이 포함되어 있는지 확인
```

#### [Critical] C2. Kakao 비즈 앱 검수 상태와 이메일 가용성 리스크가 계획에 반영되었으나 실행 순서가 불명확

**현재 문제:**
Task 4 Step 6에서 이메일이 없는 경우를 언급하지만, Supabase에서 "Allow users without email"을 켤 때의 후속 영향이 모호합니다. 특히:

- 이메일 없는 Kakao 사용자와 이메일 기반 매직 링크 사용자 간 identity linking이 불가능합니다.
- `handle_new_user` trigger가 이메일 없는 사용자를 어떻게 처리하는지 검증이 필요합니다.

**개선안:**
```markdown
Step 6 이후 추가:
- [ ] 이메일 없는 Kakao 사용자의 profiles 생성 경로 확인
- [ ] handle_new_user()가 email이 null인 경우에도 정상 동작하는지 SQL Editor에서 검증
- [ ] 이메일 없는 사용자의 identity linking 제한을 auth-provider-setup.md에 문서화
```

#### [Important] I1. Redirect URL 검증 순서가 뒤바뀌어 있음

**현재 문제:**
Task 1 (URL Configuration 확인)이 Task 2-5 (Provider 설정) 앞에 있는 것은 맞지만, Task 1 Step 4에서 `npm.cmd run typecheck`를 실행하는 것은 URL 설정 검증과 무관합니다. typecheck는 코드 변경 없이는 의미가 없고, 실제로 Supabase URL 설정이 올바른지 확인하려면 Supabase REST API 호출이 필요합니다.

**개선안:**
```markdown
Step 4 교체:
- [ ] Supabase REST API로 Site URL과 Redirect URL 설정을 확인:
  curl -s https://ztcexgnelqtdzinfgoja.supabase.co/auth/v1/settings | jq '.external'
  Expected: site_url이 https://balance-vert.vercel.app이고, redirect_urls에 위 목록이 포함
```

#### [Important] I2. Completion Criteria에 누락된 항목

**현재 문제:**
Completion Criteria에 `user_avatar_state`와 `user_pet_state` 확인이 포함되어 있지만, 이 테이블들이 `handle_new_user` trigger에서 자동 생성되는지 확인하는 단계가 Task 1-6 어디에도 없습니다.

현재 `handle_new_user`는 `ensure_user_gamification_state(NEW.id)`를 호출하는데, 이 함수가 실제로 `user_avatar_state`와 `user_pet_state`를 생성하는지 검증이 필요합니다.

**개선안:**
Task 6 Step 3의 SQL에 추가:
```sql
select user_id, species_id from public.user_pet_state
order by created_at desc limit 5;

select user_id, evolution_stage from public.user_avatar_state
order by updated_at desc limit 5;
```

#### [Important] I3. 모바일 딥링크 콜백 검증 부재

**현재 문제:**
Task 6은 프로덕션 웹 스모크만 다룹니다. 하지만 `balanceisland://auth/callback`이 Supabase Redirect URL에 등록되어 있고, 앱 코드에도 모바일 callback 처리가 구현되어 있습니다. 모바일 환경에서의 OAuth 흐름 검증이 계획서에 없습니다.

**개선안:**
MVP 단계에서 모바일 빌드가 준비되지 않았다면, 모바일 스모크를 명시적으로 "보류" 상태로 기록하는 것이 좋습니다:
```markdown
## Task 6 추가: 모바일 딥링크 스모크 (보류)
- 현재 모바일 빌드가 검증되지 않아 보류
- 모바일 빌드 준비 후 balanceisland://auth/callback 흐름 확인 필요
- Expo Development Build에서 Google/Kakao OAuth 리다이렉트 검증
```

#### [Suggestion] S1. Naver Provider 참조 정리

계획서에서 Naver는 의도적으로 제외되어 있지만, `docs/auth-provider-setup.md`와 로그인 화면 코드에는 Naver 관련 코드와 문서가 남아 있습니다. OAuth 계획서에 "Naver는 이 계획의 범위 밖이며 비활성 상태 유지" 한 줄을 넣으면 혼란을 줄일 수 있습니다.

#### [Suggestion] S2. 롤백 후 재시도 프로세스

Task 7의 롤백 절차가 "OFF로 돌리고 기록"까지만 있습니다. 실패 원인을 수정한 뒤 다시 시도하는 프로세스가 없어, 롤백 후 다시 Task 2-6을 처음부터 반복해야 하는지 불명확합니다.

---

## 3. 코드베이스 전반 리뷰

### 3.1 아키텍처 현황

현재 프로젝트는 약 3일(2026-06-01 ~ 06-03) 동안 빠르게 성장했습니다.

```
주요 구현 완료:
✅ Expo Router 기본 앱 셸 (root layout, tab layout)
✅ 한국어 피드 seed 30개
✅ Supabase RPC 기반 투표/리액션 (submit_vote, submit_reaction)
✅ 게임화 기반 (shell_ledger, user_avatar_state, user_personality_snapshots)
✅ 성향 펫/테마 경제 (pet_species, theme_skins, theme_draw)
✅ 인사이트 맵 (get_personality_insight_graph)
✅ 소셜 로그인 코드 (Google/Kakao/Naver/Magic Link)
✅ Auth callback/session 관리
✅ 프로필 보안 (profiles_update_own 제거, RPC-only 경제)
✅ Vercel 프로덕션 배포
✅ 이메일 매직 링크 실 동작 확인

현재 상태:
✅ Google/Kakao OAuth provider 실 설정 및 연동 테스트
❌ 테스트 코드 (단위/통합/E2E 모두 없음)
⚠️ Edge Function 인증/rate limit 1차 보강됨, 배포/운영형 rate limit 검증 필요
❌ 실사용자 데이터 기반 피드 페이지네이션
❌ 모바일 네이티브 빌드 검증
❌ 이미지 에셋 자체 호스팅
```

### 3.2 Critical 문제

#### [Critical] C3. Migration 파일 관리 체계 부재

**현재 상태:**
- `supabase/schema.sql` (37KB) — 기본 스키마 + destructive DROP TABLE
- `supabase/apply_new_project.sql` (46KB) — 전체 적용 스크립트
- 6개 migration 파일 — 모두 수동으로 SQL Editor에서 실행

**문제:**
1. `supabase/schema.sql`은 여전히 `DROP TABLE ... CASCADE`로 시작합니다. 이것이 실행되면 운영 데이터가 전멸합니다.
2. Migration 적용 상태를 추적하는 메커니즘이 없습니다. 어떤 migration이 live DB에 적용되었는지 확인하려면 수동으로 테이블/함수 존재를 확인해야 합니다.
3. `apply_new_project.sql`은 "새 프로젝트 초기화"용이지만, 부분 적용/실패 시 복구 절차가 없습니다.

**개선안:**
1. `supabase/schema.sql` 파일 상단에 명확하게 경고를 추가:
```sql
-- ⚠️ WARNING: DEV RESET ONLY. DO NOT RUN ON PRODUCTION.
-- This file drops all tables. Use migrations for production changes.
```

2. Migration 적용 추적 테이블 도입:
```sql
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
```

3. 각 migration 시작과 끝에 추적 코드 추가:
```sql
INSERT INTO public.schema_migrations (version) VALUES ('202606011940')
ON CONFLICT DO NOTHING;
```

#### [Critical] C4. Edge Function 보안이 여전히 열려 있음

**현재 상태:**
- `supabase/functions/embed-question/index.ts`, `refine-question/index.ts`가 존재
- 2026-06-03 로컬 코드에서 Supabase Auth JWT 검증, POST-only 처리, 입력 크기/길이 제한, per-user in-memory rate limit, OpenAI 오류 마스킹, 제한 CORS가 1차 반영됨
- `supabase/migrations/202606030530_ai_edge_rate_limits.sql`에서 `ai_edge_rate_limit_events`와 `check_ai_rate_limit()` RPC를 추가하여 durable per-user quota의 로컬 구현이 준비됨
- 두 Edge Function은 OpenAI 호출 전에 `check_ai_rate_limit()`을 먼저 호출하며, RPC 실패 시 비용 보호를 위해 503으로 fail-closed 처리함
- `refine-question`은 호출자 제공 `systemPrompt`를 더 이상 system role로 사용하지 않고 기본 서버 프롬프트만 사용하도록 정리됨
- `refine-question`은 OpenAI 응답을 `JSON.parse` 후 필수 필드/태그/카테고리/trait 범위로 재검증함
- 아직 Supabase DB migration 적용, Edge Functions 배포, 실제 authenticated 호출 smoke test는 남아 있음

**리스크:**
로컬 코드의 1차 방어와 DB/RPC quota 구현은 직접 호출 비용 소진 위험을 줄입니다. 다만 migration이 live DB에 적용되지 않았거나 Edge Function이 새 코드로 배포되지 않으면 production에는 아직 반영되지 않습니다.

**개선안:**
`202606030530_ai_edge_rate_limits.sql`를 Supabase DB에 적용한 뒤 1차 보강 코드를 Supabase Edge Functions에 배포해야 합니다. 배포 시 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, 모델 환경변수 설정도 함께 확인해야 합니다.

```typescript
// 최소한의 JWT 검증 핵심
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
}
const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
if (error || !user) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
}
```

#### [Critical] C5. `authStore.bootstrap()`의 초기 URL 소비 경합 조건

**현재 상태:**
`timeline.md` 2026-06-02 22:19 KST 항목에서 "Auth bootstrap no longer consumes the initial callback URL"로 수정되었다고 기록되어 있습니다. 하지만 `social-auth-magic-link.md` Task 3의 원본 코드에는 여전히 `getInitialLinkingUrl()`을 bootstrap에서 호출하는 코드가 남아 있습니다.

**리스크:**
계획서의 코드와 실제 구현이 다릅니다. 향후 계획서를 참조해서 작업하는 에이전트가 이미 수정된 버그를 다시 도입할 수 있습니다.

**개선안:**
계획서를 "구현 완료" 상태로 마크하거나, 실제 구현과 다른 부분에 주석을 추가하는 것이 좋습니다.

### 3.3 Important 문제

#### [Important] I4. 타입 정의와 실제 DB 스키마의 동기화 위험

**현재 상태:**
`src/types/database.types.ts`는 수동으로 관리됩니다. 6개 migration을 거치면서 DB 스키마가 크게 변했고, 타입 파일도 여러 번 수정되었습니다.

**문제:**
- Supabase CLI의 `supabase gen types typescript`를 사용하지 않고 있어, 타입과 실제 DB가 어긋날 위험이 있습니다.
- 특히 RPC 반환 타입이 실제 함수와 다를 경우, 런타임에서만 발견됩니다.

**개선안:**
1. `supabase gen types typescript` 명령을 통해 자동 생성된 타입과 현재 수동 타입을 비교
2. 개발 워크플로우에 타입 동기화 단계 추가:
```json
// package.json scripts
"gen:types": "supabase gen types typescript --project-id ztcexgnelqtdzinfgoja > src/types/database.generated.ts"
```

#### [Important] I5. `research.md`가 581줄로 비대해짐

**현재 상태:**
`research.md`는 원래 "프로젝트 상태와 주요 리스크의 장기 기억"으로 시작했지만, 현재는:
- 초기 Deep Research Report (Section 1-9)
- Run-Ready 상태 기록
- Supabase 연결 상태
- Bootstrap SQL 수리 기록
- 게임화 기반 구현 상태
- 피드 상태 하드닝
- 캐릭터 카드 경제 방향
- 펫/테마 매칭 방향
- 경제 리뷰 검증
- 경제 기반 구현 상태

이 모든 내용이 한 파일에 축적되어, 새로운 에이전트가 읽을 때 "현재 상태"와 "과거 기록"을 구분하기 어렵습니다.

**개선안:**
`research.md`를 역할별로 분리:
- `research.md` → 현재 프로젝트 상태, 아키텍처, 알려진 리스크만 유지 (200줄 이하 목표)
- `docs/research-history.md` → 과거 분석 결과, 해결된 리스크, 단계별 구현 기록을 이동
- `agent.md`의 규칙에 "research.md는 300줄을 넘지 않도록 오래된 항목을 history로 이동한다" 추가

#### [Important] I6. `timeline.md`의 언어 혼용

**현재 상태:**
`timeline.md`는 2026-06-02 16:10 KST 이후부터 영어로 작성되기 시작했습니다. 이전 항목은 한국어, 이후 항목은 영어로 혼재되어 있습니다.

**리스크:**
프로젝트의 대상 사용자와 개발자가 한국어 기반이라면, timeline 검색과 이해에 불필요한 인지 부담이 생깁니다.

**개선안:**
`agent.md`에 "`timeline.md`는 한국어로 작성한다"는 규칙을 추가하거나, 역으로 "영어로 통일한다"고 명시하는 것이 좋습니다. 현재는 규칙이 없어 에이전트마다 다르게 작성합니다.

#### [Important] I7. 로그인 화면 UX에서 에러 핸들링 미흡

**현재 상태:**
`src/app/login.tsx`의 `handleSocial` 함수:
```tsx
async function handleSocial(provider: SocialProvider, enabled: boolean) {
  if (!enabled) return;
  await signInSocial(provider);
  const { user } = useAuthStore.getState();
  if (user) {
    router.replace('/(tabs)/profile');
  }
}
```

**문제:**
- `signInSocial`이 에러를 던져도 `handleSocial`에서 catch하지 않습니다.
- 에러는 `authStore.error`에만 저장되고, 사용자에게 어떤 provider에서 실패했는지 맥락이 없습니다.
- 네트워크 오류, 팝업 차단, 사용자 취소를 구분하지 않습니다.

**개선안:**
```tsx
async function handleSocial(provider: SocialProvider, enabled: boolean) {
  if (!enabled) return;
  try {
    await signInSocial(provider);
    const { user } = useAuthStore.getState();
    if (user) {
      router.replace('/(tabs)/profile');
    }
  } catch (e) {
    // authStore.error에 이미 저장되므로 추가 처리 불필요
    // 단, 팝업 차단 에러 시 별도 안내 추가 권장
  }
}
```

#### [Important] I8. `supabaseClient.ts`에서 `supabase`가 `null`일 때의 서비스 레이어 처리

**현재 상태:**
`supabaseClient.ts`는 환경변수가 없으면 `null`을 반환합니다. 하지만 서비스 레이어의 대부분 함수는 `if (!supabase)` 가드로 시작하고, 그 처리가 `throw`인 곳과 `return null/[]`인 곳이 혼재되어 있습니다.

**문제:**
- `gamificationService`는 에러를 throw
- `authService`의 일부 함수는 `return null`
- 이 불일치가 호출자의 에러 핸들링을 복잡하게 만듭니다.

**개선안:**
일관된 패턴을 정의:
- 읽기 전용 함수: `null`/빈 배열 반환 (게스트 모드 지원)
- 쓰기/mutation 함수: throw (인증 필요 상태를 명확히)

### 3.4 Suggestion

#### [Suggestion] S3. `vercel.json`의 SPA rewrite가 API 경로와 충돌할 가능성

```json
{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}
```

현재는 문제 없지만, 향후 Vercel Serverless Functions나 API Routes를 추가하면 모든 요청이 `index.html`로 가서 API가 동작하지 않습니다. 지금은 기록만 해두는 것이 좋습니다.

#### [Suggestion] S4. Expo SDK 51은 2026년 기준 구버전일 가능성

`package.json`의 `"expo": "~51.0.0"`은 2024년 중반 출시 버전입니다. 2026년 6월 기준으로 Expo SDK 53 이상이 최신일 수 있습니다. 현재는 동작하지만, 장기적으로 보안 패치와 기능 업데이트를 받으려면 SDK 업그레이드 계획이 필요합니다.

#### [Suggestion] S5. 계획서 파일명 날짜와 실제 작성일 불일치

`2026-06-01-character-card-collection-economy.md`는 최초 2026-06-01에 작성되었지만, 2026-06-02에 성향 펫/테마 가챠 방향으로 대폭 수정되었습니다. 파일명만 보면 카드 수집 경제인데, 실제 내용은 펫 매칭 + 테마 가챠입니다.

**개선안:**
파일 상단에 "이 파일은 원래 카드 수집 경제 계획이었으나, 2026-06-02에 성향 펫 + 테마 가챠 방향으로 전환됨"을 명시하거나, 별도 파일로 분리하는 것이 좋습니다.

---

## 4. 워크플로우 리뷰

### 4.1 `agent.md` 워크플로우 평가

**장점:**
- 매 작업 전 `research.md` 확인 규칙이 좋습니다.
- 리뷰어 에이전트 사용 기준이 구체적입니다.
- 한글 인코딩 주의 규칙이 있습니다.

**개선 필요:**

1. **커밋 규칙이 없습니다.** 3일간 커밋 히스토리를 보면 큰 변경이 한 번에 커밋되는 패턴입니다. 기능 단위 커밋 규칙이 있으면 롤백이 쉬워집니다.

2. **브랜치 전략이 없습니다.** 모든 작업이 `main`에서 직접 이루어지고 있습니다. OAuth 설정처럼 실패 가능성이 있는 작업은 feature branch에서 진행하고, 스모크 테스트 통과 후 merge하는 것이 안전합니다.

3. **테스트 규칙이 없습니다.** `agent.md`의 검증 원칙에 typecheck과 Expo doctor만 있고, 단위 테스트에 대한 언급이 없습니다. RPC smoke test를 자동화하는 스크립트라도 추가하면 회귀 방지에 도움됩니다.

### 4.2 에이전트 간 핸드오프 개선

`docs/codex-reinstall-handoff.md`를 보면 에이전트 전환 시 맥락 손실이 발생하고 있습니다. 특히:

- 플러그인 상태가 불안정합니다 (Browser/Chrome/Computer Use)
- 이전 세션의 Chrome 원격 디버깅 설정을 재사용해야 합니다

**개선안:**
1. `agent.md`에 "핸드오프 시 반드시 확인할 체크리스트" 섹션 추가
2. 로컬 환경 상태를 빠르게 확인하는 스크립트 추가:
```powershell
# verify-env.ps1
Write-Host "=== Balance Island Environment Check ==="
Write-Host "Node: $(node --version)"
Write-Host "npm: $(npm --version)"
Write-Host "Git branch: $(git branch --show-current)"
Write-Host "Git status: $(git status --short | Measure-Object -Line | Select-Object -ExpandProperty Lines) changed files"
npm.cmd run typecheck 2>&1 | Select-Object -Last 3
```

---

## 5. research.md 리뷰

### 5.1 현재 상태 정확성

`research.md`의 내용은 대체로 정확하지만, 일부 항목이 이미 해결된 상태입니다:

| 항목 | research.md 상태 | 실제 상태 |
|------|-----------------|----------|
| C1. 인코딩 손상 | "가장 먼저 해결해야 할 문제" | ✅ 해결됨 (UTF-8 재작성 완료) |
| C2. DROP TABLE CASCADE | "운영 데이터 전멸 위험" | ⚠️ 부분 해결 (dev reset 표시, 운영 migration 분리) |
| C3. RLS 부재 | "확인되지 않음" | ✅ 해결됨 (migration으로 RLS/policy 추가) |
| C4. Layout 파일 부재 | "앱 셸이 구성되지 않을 가능성" | ✅ 해결됨 |
| C5. profiles 생성 경로 | "trigger 미확인" | ✅ 해결됨 (handle_new_user trigger) |

**개선안:**
`research.md`의 Critical/Important 항목에 현재 상태를 반영하는 것이 좋습니다. 새로운 에이전트가 이 문서를 읽으면 아직 모든 것이 위험한 상태로 보입니다.

### 5.2 누락된 현재 리스크

`research.md`에 기록되지 않은 새로운 리스크:

1. **OAuth provider 미설정 상태에서 프로덕션 배포 중** — 사용자가 Google/Kakao 버튼을 누르면 400 에러가 반환됩니다.
2. **6개 migration의 적용 순서 의존성** — 잘못된 순서로 적용하면 FK 에러가 발생합니다.
3. **SecureStore 청크 어댑터 미검증** — 실제 모바일에서 큰 세션 토큰의 청킹이 정상 동작하는지 테스트되지 않았습니다.
4. **프로덕션에 `process.env` inline 의존성** — Expo Web은 빌드 시 `process.env.EXPO_PUBLIC_*`를 inline하는데, Vercel 환경변수가 변경되면 재빌드가 필요합니다.

---

## 6. timeline.md 리뷰

### 6.1 기록 품질

Timeline은 330줄로, 3일간의 작업이 상세하게 기록되어 있습니다. 각 항목에 작업/범위/이유/검증/후속이 포함되어 있어 추적성이 좋습니다.

### 6.2 개선점

1. **검증 결과의 증거가 부족합니다.** "typecheck 통과"만 기록하고, 실패 케이스나 경고는 기록하지 않습니다. 예: "CRLF 경고 외 문제 없음"이 반복되지만, 이 경고가 실제로 문제가 되는지 확인이 필요합니다.

2. **"후속" 항목의 완료 추적이 없습니다.** 많은 항목이 "후속: SQL Editor에서 migration 적용 필요"로 끝나는데, 이 후속 작업이 완료되었는지 같은 문서에서 추적되지 않습니다.

**개선안:**
각 timeline 항목의 "후속"이 완료되면 해당 항목에 `[완료됨: YYYY-MM-DD HH:mm]`을 추가하는 규칙을 `agent.md`에 넣는 것이 좋습니다.

---

## 7. 전체 우선순위 제안

현재 프로젝트의 남은 작업을 우선순위로 정리합니다:

### 즉시

1. ⚠️ `202606030530_ai_edge_rate_limits.sql` DB 적용
2. ⚠️ Edge Function 보강 코드 배포 및 Supabase 환경변수 확인 (`refine-question`, `embed-question`)
3. ⚠️ `research.md` 현재 상태 갱신 (해결된 항목 업데이트)

### 이번 주

4. 🔧 `handle_new_user` trigger의 이메일 없는 사용자 처리 회귀 검증
5. 🔧 migration 적용 추적 메커니즘 도입
6. 🔧 Google/Kakao OAuth 회귀 smoke test 문서화
7. 🔧 Edge Function 호출 smoke test 스크립트 작성

### 다음 주

8. 📋 최소 RPC smoke test 스크립트 작성
9. 📋 `research.md` 분리 (현재 상태 vs 과거 기록)
10. 📋 기능 브랜치 전략 도입
11. 📋 `timeline.md` 언어 통일 규칙 확정
12. 📋 Expo SDK 업그레이드 검토

### 장기

13. 📌 모바일 네이티브 빌드 및 딥링크 검증
14. 📌 이미지 에셋 자체 호스팅 전환
15. 📌 피드 커서 기반 페이지네이션
16. 📌 자동화 테스트 체계 구축
17. 📌 Supabase CLI 기반 타입 자동 생성

---

## 8. 결론

Balance Island 프로젝트는 3일이라는 짧은 기간에 놀라운 진전을 보였습니다. 밸런스 게임 → 성향 분석 → 펫 매칭 → 테마 경제 → 인사이트 맵까지 제품 비전이 명확하고, Supabase RPC 기반 서버 트랜잭션, RLS 보안, idempotency 설계 등 아키텍처 결정이 건실합니다.

OAuth Provider Console Setup 계획서는 전체적으로 잘 작성되어 있지만, **Google Consent Screen 상태 확인, Kakao 이메일 부재 시 후속 처리, 모바일 딥링크 검증 보류 명시**가 추가되면 더 안전합니다.

가장 시급한 개선은:
1. **Edge Function 보안** — OAuth로 실제 사용자가 유입되기 전에 처리
2. **문서 현행화** — research.md의 해결된 항목 갱신
3. **Google Consent Screen 확인** — OAuth 설정의 숨겨진 차단 요소

이 세 가지만 선행하면, OAuth 설정 실행이 한결 안전해집니다.

---

> 이 문서는 UTF-8로 인코딩되어 있습니다.
