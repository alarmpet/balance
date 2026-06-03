# Codex Reinstall Handoff

작성 시각: 2026-06-03 KST

이 문서는 Codex 앱 재설치 후 `balance-island` 작업을 바로 이어가기 위한 인수인계 문서입니다. 민감한 토큰, 매직 링크, secret key, database password는 기록하지 않습니다.

## 1. 프로젝트 위치

- 로컬 루트: `C:\Users\petbl\balance\balance-island`
- GitHub: `alarmpet/balance`
- 기본 브랜치: `main`
- Vercel 프로덕션 URL: `https://balance-vert.vercel.app`
- Supabase 프로젝트 ref: `ztcexgnelqtdzinfgoja`
- Supabase Project URL: `https://ztcexgnelqtdzinfgoja.supabase.co`

## 2. 최근 완료 상태

최근 인증/배포 관련 작업은 완료되어 GitHub와 Vercel에 반영되어 있습니다.

주요 최근 커밋:

- `50d505b Harden auth callback state transitions`
- `6df7165 Fix Expo public env access`
- `d179bcf Add auth flow and insight map`
- `4a59b70 Inline Expo public env access for web`

최종 확인된 상태:

- Vercel 최신 배포 `50d505b`는 `Ready` 상태였습니다.
- 이메일 매직 링크 로그인은 실제 계정 `petblo12@gmail.com`으로 성공 확인했습니다.
- 로그인 후 `/profile`, `/island`, `/insight-map`, `/` 프로덕션 스모크 테스트를 통과했습니다.
- `/profile`에서 게스트가 아닌 `islander_dcc0ac` 계정 상태가 표시되었습니다.
- `/island`와 `/insight-map`에서 게스트 미리보기 문구가 사라지고 로그인 유저의 초기 상태가 표시되었습니다.
- `/` 피드에서 한국어 질문 데이터가 정상 로드되었습니다.

## 3. 인증 설정 현황

### 완료됨

- Supabase Auth Site URL: `https://balance-vert.vercel.app`
- Supabase Auth Redirect URL allow-list:
  - `https://balance-vert.vercel.app/auth/callback`
  - `https://balance-vert.vercel.app/**`
  - `http://localhost:8081/**`
  - `http://127.0.0.1:8081/**`
  - `balanceisland://**`
- Vercel env:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_SITE_URL`
- 이메일 매직 링크 로그인:
  - 실제 발송 성공
  - callback 세션 생성 성공
  - 프로필 화면 이동 성공

### 아직 사용자가 직접 인증/발급해야 하는 항목

Google/Kakao/Naver 소셜 로그인은 코드 연결은 되어 있으나, 각 개발자 콘솔과 Supabase provider credentials 설정이 필요합니다.

- Google:
  - Google Cloud OAuth Client ID/Secret 필요
  - Authorized redirect URI: `https://ztcexgnelqtdzinfgoja.supabase.co/auth/v1/callback`
- Kakao:
  - Kakao Developers 앱 REST API 키/Client Secret 또는 Supabase provider 요구값 필요
  - Redirect URI: `https://ztcexgnelqtdzinfgoja.supabase.co/auth/v1/callback`
- Naver:
  - 현재 앱 코드에서는 버튼 비활성화 상태입니다.
  - Supabase custom OAuth provider `custom:naver`로 별도 설정해야 합니다.

## 4. 재설치 후 먼저 확인할 것

Codex 재설치 후 아래 순서로 확인하세요.

1. Codex 로그인 확인
2. 플러그인/커넥터 설정에서 다음 항목 확인:
   - `Browser`
   - `Computer Use`
   - `Chrome`
   - `Superpowers`
   - `GitHub`
3. `Browser`, `Chrome`, `Computer Use`가 보이지 않으면 Codex 앱을 완전히 종료 후 재시작합니다.
4. 그래도 안 보이면 플러그인 파일은 남아 있으므로 앱의 플러그인 인덱스/캐시 로딩 문제로 보고 복구를 진행합니다.

현재 로컬에서 확인된 플러그인 캐시 경로:

- `C:\Users\petbl\.codex\plugins\cache\openai-bundled\browser`
- `C:\Users\petbl\.codex\plugins\cache\openai-bundled\chrome`
- `C:\Users\petbl\.codex\plugins\cache\openai-bundled\computer-use`

## 5. Chrome 제어 복구 메모

이전 세션에서 Codex Chrome 플러그인이 직접 동작하지 않을 때, Chrome 원격 디버깅으로 우회했습니다.

사용했던 테스트 Chrome 프로필:

- `C:\tmp\codex-chrome-balance-auth`

원격 디버깅 재실행 예시:

```powershell
Start-Process -FilePath "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" -ArgumentList @(
  '--remote-debugging-port=9222',
  '--remote-allow-origins=*',
  '--user-data-dir=C:\tmp\codex-chrome-balance-auth',
  'https://balance-vert.vercel.app/login'
)
```

CDP 확인 URL:

```text
http://127.0.0.1:9222/json/version
```

주의:

- 테스트용 Chrome 프로필과 일반 Chrome 프로필의 로그인 세션은 다를 수 있습니다.
- 이메일 매직 링크는 토큰이 들어 있으므로 문서에 저장하지 않습니다.
- 필요하면 사용자가 매직 링크를 다시 발급하고, 테스트 Chrome에서 열어 smoke test를 진행합니다.

## 6. 주요 구현 파일

인증:

- `src/lib/env.ts`
- `src/lib/supabaseClient.ts`
- `src/services/authService.ts`
- `src/store/authStore.ts`
- `src/app/login.tsx`
- `src/app/auth/callback.tsx`
- `src/app/(tabs)/profile.tsx`
- `src/app/(tabs)/island.tsx`

인사이트 맵:

- `src/app/insight-map.tsx`
- `src/services/insightMapService.ts`
- `src/store/insightMapStore.ts`
- `supabase/migrations/202606021500_insight_map_rpc.sql`

게임화/펫/테마:

- `src/store/gamificationStore.ts`
- `src/services/gamificationService.ts`
- `src/services/themeEconomyService.ts`
- `supabase/migrations/202606020200_personality_pet_theme_economy.sql`

문서:

- `research.md`
- `timeline.md`
- `agent.md`
- `docs/auth-provider-setup.md`
- `docs/superpowers/plans/2026-06-02-social-auth-magic-link.md`
- `docs/superpowers/plans/2026-06-02-personality-insight-map.md`

## 7. 재시작 후 권장 검증 명령

```powershell
cd C:\Users\petbl\balance\balance-island
git status --short
npm.cmd run typecheck
npx.cmd expo export --platform web
git diff --check
```

예상:

- `npm.cmd run typecheck`: 통과
- `npx.cmd expo export --platform web`: 통과
- `git diff --check`: 기존 CRLF 경고 외 큰 문제 없어야 함

## 8. 바로 이어갈 다음 작업

우선순위가 높은 다음 작업:

1. `src/app/login.tsx`의 한글 문자열 인코딩 상태 점검 및 필요 시 복구
   - 이전 PowerShell 출력에서 일부 한글이 mojibake처럼 보였습니다.
   - Vercel 화면에서는 정상 표시된 이력이 있으나, 파일 자체를 다시 열어 확인해야 합니다.
2. Google OAuth provider 설정 후 실제 로그인 테스트
3. Kakao OAuth provider 설정 후 실제 로그인 테스트
4. Naver는 custom OAuth 설정 난이도가 있으므로, MVP에서는 버튼 비활성 유지가 안전합니다.
5. 소셜 로그인 provider 설정이 끝나면 `/login`에서 실제 클릭 테스트 후 `/profile` 이동과 `profiles` row 생성을 확인합니다.

## 9. 중요한 주의사항

- `sb_secret_...`, service role key, Supabase database password는 Vercel public env나 문서에 넣지 않습니다.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`에는 publishable/anon key만 넣습니다.
- 매직 링크 전체 URL은 access token과 refresh token을 포함하므로 다시 공유하지 않는 것이 좋습니다.
- 사용자가 공유한 민감 링크는 답변이나 문서에 재출력하지 않습니다.
- 작업 전 `research.md`와 `timeline.md`를 먼저 읽고, 큰 변경 후 `timeline.md`를 업데이트합니다.
- DB schema, RLS, RPC, auth trigger 변경 시 `research.md`도 같이 업데이트합니다.

## 10. 마지막 확인된 결론

현재 Balance Island는 웹에서 이메일 매직 링크 기반 로그인까지 동작합니다. 앱 코드는 Google/Kakao OAuth 진입점도 갖고 있지만, 실제 소셜 로그인 성공은 사용자가 각 개발자 콘솔과 Supabase provider credentials를 설정한 뒤 확인해야 합니다. Codex 재설치 후에는 먼저 플러그인 노출 상태를 복구하고, 이후 `login.tsx` 문자열 점검과 소셜 provider smoke test를 이어가면 됩니다.
