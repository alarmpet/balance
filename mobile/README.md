# 세상의 모든 밸런스 모바일 MVP

Expo SDK 57 + Supabase 기반의 iOS, Android, Web 앱이다. 첫 투표, 무한 A/B 덱,
질문 작성, 나의 뇌, 공유 투표, 신고·차단, 알림과 개인정보 최소 계측까지 P0 범위를
구현한다.

## 요구 환경

- Node.js 22.13+와 npm
- Docker-compatible local containers가 실행 가능한 Docker Desktop 또는 동등한 런타임
- 로컬 데이터베이스용 Supabase CLI(프로젝트 devDependency 사용)
- 알림 검증용 physical device 또는 supported emulator
- 운영 푸시용 EAS 프로젝트와 APNs/FCM credentials

## 로컬 시작

PowerShell에서 이 `mobile` 디렉터리로 이동한 뒤 실행한다.

```powershell
npm install
Copy-Item .env.example .env.local
npx supabase start
npx supabase db reset
npm run verify
npx expo start
```

`npx supabase status`가 출력한 local publishable key를 `.env.local`의
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`에 복사한다. 키를 Git에 커밋하지 않는다.

- iOS Simulator와 Web은 `EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`을 쓴다.
- Android Emulator는 `http://10.0.2.2:54321`을 쓴다.
- Physical device는 두 loopback 주소가 아니라 개발 PC의 기기에서 접근 가능한 LAN IP,
  예를 들어 `http://192.168.0.10:54321`을 쓴다. 방화벽에서 해당 포트를 허용한다.
- 환경 변수를 바꾼 뒤 Expo dev server를 다시 시작한다.

Supabase 환경 변수가 없으면 앱은 메모리 기반 로컬 저장소로 실행된다. 백엔드/RLS/알림
검증에는 반드시 로컬 Supabase 환경을 연결한다.

## 전체 검증

Docker 엔진을 먼저 실행하고 다음 명령을 순서대로 수행한다.

```powershell
npx supabase db reset
npx supabase test db
npx supabase db lint
npm run verify
npx expo export --platform web
npx expo export --platform android
```

`npm run verify`는 TypeScript, 전체 Jest, Expo Doctor를 실행한다. Export 결과는 `dist/`에
생성되며 커밋하지 않는다.

실기기 또는 에뮬레이터와 Maestro가 설치된 환경에서는 test build를 설치한 뒤 실행한다.

```powershell
maestro test maestro/vote-create-brain.yaml
maestro test maestro/shared-question.yaml
```

첫 flow는 10회 투표 → 질문 작성 → 나의 뇌 공개를, 두 번째 flow는 seeded deep link →
게스트 투표 → 플레이 복귀를 검증한다. Local JSON과 Supabase seed 모두 이 flow에 필요한
eligible A/B 질문 10개 이상을 제공하며 DB test가 각 Supabase 질문의 A/B option과 value-axis
weight를 검증한다. Screen reader에서는 플레이→물어보기→나의 뇌
순서로 이동해 한국어 이름, 역할, disabled/selected/expanded 상태와 읽기 순서를 확인한다.
200% dynamic type에서 텍스트 잘림과 조작부 겹침이 없어야 하며, Reduce Motion을 켠
상태에서도 기능을 잃지 않아야 한다. 현재 P0 UI는 시간 기반 결과 표시만 사용하고
필수 정보를 움직임에 의존하지 않는다. Web에서는 Tab 키로 모든 control을 이동하며
3px focus-visible outline을 확인한다.

자동화는 고정 높이 clipping, touch target, contrast와 semantic state의 회귀를 막지만 실제
200% dynamic type, screen reader 읽기 순서, Reduce Motion과 작은 화면의 overlay 겹침을
증명하지는 못한다. Maestro/실기기 접근성 checklist가 끝날 때까지 접근성 검증은 미완료다.

## 실패 복구 확인

- 질문 조회 offline: `질문 다시 시도`가 daily/feed를 다시 읽는다.
- Vote 실패: offline action은 정확한 owner/action ID로 보관하고 같은 선택으로 재전송한다.
  Duplicate vote는 대기열에 넣지 않고 명시적인 `투표 다시 시도`를 제공한다.
- 질문 작성 실패: 입력한 A/B와 선택 필드는 유지되고 `질문 등록 다시 시도`가 같은 입력을 쓴다.
- Reason reaction 실패: 0.8초 뒤 다음 카드로 넘어가도 원 질문/사용자/reason을 유지한
  `선택 이유 다시 시도`가 보인다.
- Closed/missing shared question 및 조회 오류: 오류 상태에서 `공유 질문 다시 시도`를 제공한다.
- Account continuity conflict에서는 vote/create/reason/report/block/token mutation을 시작하지 않는다.

## Edge Function 로컬 probe

별도 PowerShell 창에서 function을 시작한다.

```powershell
npx supabase functions serve send-question-notification --no-verify-jwt
```

`npx supabase status`의 service role key를 현재 shell의 비커밋 환경 변수에만 넣은 뒤,
재시도/receipt queue의 빈 상태를 확인할 수 있다.

```powershell
$headers = @{ Authorization = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"; "Content-Type" = "application/json" }
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:54321/functions/v1/send-question-notification" -Headers $headers -Body '{"action":"dispatch_retries"}'
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:54321/functions/v1/send-question-notification" -Headers $headers -Body '{"action":"dispatch_outbox"}'
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:54321/functions/v1/send-question-notification" -Headers $headers -Body '{"action":"poll_receipts"}'
```

운영 알림 생명주기는 `votes` 트리거가 첫 투표/의미 표본 작업을 durable outbox에 한 번만 넣고,
마감 스캐너가 마감 작업을 한 번만 넣는 구조다. Edge 함수를 배포하고
`NOTIFICATION_FUNCTION_SECRET`을 설정한 뒤, 프로젝트별 실제 값으로
`supabase/bootstrap/notification-cron.sql`을 SQL Editor에서 한 번 실행한다. 이 스크립트는
Vault에 URL/service-role/함수 secret을 보관하고 close scan, outbox dispatch, confirmed-transient
retry dispatch, Expo receipt poll을 각각 cron으로 등록한다. 의미 표본 임계값은 Edge 환경변수가
아니라 `public.notification_settings`의 단일 행에서만 관리한다. 실제 secret이 들어간 수정본은
커밋하지 않는다.

close cron도 DB 함수를 직접 호출하지 않는다. pg_net이 Vault의 service-role 키로 Edge의
`scan_closed` action을 호출하고, Edge service client만 `enqueue_closed_question_notifications`
RPC를 실행한다. 따라서 일반 SQL/JWT-null 세션에 대한 RPC 거부 정책을 완화하지 않는다.

서비스 역할 키는 클라이언트의 `EXPO_PUBLIC_*` 변수에 절대 넣지 않는다.

## 운영 배포

1. `npx supabase login`, `npx supabase link --project-ref <ref>`로 대상 프로젝트를 확인한다.
2. 백업/PITR 상태를 확인한 뒤 `npx supabase db push`로 forward migration을 적용한다.
3. `npx supabase secrets set NOTIFICATION_FUNCTION_SECRET=<secret>`를 설정하고
   `npx supabase functions deploy send-question-notification`을 실행한다. service role key는
   Supabase runtime이 주입하며 저장소나 EAS public env에 넣지 않는다.
4. EAS project를 연결하고 APNs/FCM credentials를 등록한다. Android FCM V1 service account와
   iOS APNs key/team/bundle ID가 `com.semobal.balance`에 맞는지 확인한다.
5. `npx eas-cli build --platform all --profile preview`로 Gate 1 test build를 만들고 두 플랫폼의
   physical device에서 알림 opt-in, token roll, logout revocation, deep link를 확인한다.
6. Gate 1을 통과한 같은 commit만 production profile로 빌드한다. P1 기능은 열지 않는다.

### CAPTCHA

Production CAPTCHA는 아직 활성화 완료 상태가 아니다. 현재 저장소에는 provider site key,
widget와 token-provider adapter가 없다. 활성화 전에는 Supabase Auth IP rate limit을 유지한다.
공급자 키/secret을 발급하고 adapter 및 실기기 검증을 완료한 뒤에만
`EXPO_PUBLIC_AUTH_CAPTCHA_REQUIRED=true`를 설정한다. 이 플래그에서 신규 anonymous signup은
provider가 없거나 token이 만료되면 fail-closed해야 하며, 기존 유효 session 재사용은 signup이
아니므로 차단하지 않는다.

### 알림 운영

알림은 `first_vote`, `meaningful_sample`, `question_closed`만 허용한다. 사용자 opt-in 뒤에만
token을 저장한다. APNs/FCM 장애, Expo ticket/receipt 오류와 `DeviceNotRegistered` 비율을
관찰한다. 외부 전송 시작 뒤 응답이 불명확한 delivery는 중복 방지를 위해 자동 재전송하지
않는다. 확인된 transient 오류만 retry queue로 보낸다.

## 개인정보·보안 운영

- Analytics에는 allowlist event와 session/question ID, source, timestamp만 저장한다. 질문 문구,
  이유 문구, 이메일, 연락처와 user-entered free text를 넣지 않는다.
- RLS와 security-definer RPC 검증 없이 client table write 권한을 넓히지 않는다.
- 신고·차단과 notification revocation은 account continuity mutation guard를 통과해야 한다.
- 사용자 데이터 요청 시 `profiles`, `votes`, `reason_reactions`, `questions`, `reports`, `blocks`,
  `push_tokens`, `analytics_events`의 소유 범위와 보존 정책을 함께 검토한다.
- 출시 전에 마이 화면의 선택 기록/유형 데이터/계정 삭제 UX와 운영 삭제 절차를 법률·정책
  담당자가 승인해야 한다. 현재 마이 화면은 placeholder이므로 production launch blocker다.
- 운영 로그, test fixture와 screenshots에 service key, push token, CAPTCHA secret 또는 질문의
  민감한 자유 텍스트를 남기지 않는다.

## 롤백

1. 배포 전 DB backup/PITR 시점을 기록하고 이전 app/function artifact와 Git commit을 보존한다.
2. Client 장애는 store rollout을 중지하고 이전 승인 binary를 재배포한다. 현재 OTA update가
   구성되지 않았으므로 `eas update`를 rollback 수단으로 가정하지 않는다.
3. Edge 장애는 이전 commit의 function을 다시 deploy한다. Queue 상태를 지우거나 unknown
   delivery를 재전송하지 않는다.
4. 이미 적용된 migration을 임의의 destructive SQL로 되돌리지 않는다. 호환 가능한 forward-fix를
   우선하고, 데이터 손상이면 쓰기를 중단한 뒤 확인된 backup/PITR에서 복구한다.
5. 복구 후 `db reset/test/lint`, `npm run verify`, exports와 핵심 deep link flow를 다시 실행한다.

## Gate 1 사용자 검증

코칭 없이 18~29세 중심 10명과 확장 연령 5명, 총 15명에게 동일 test build를 제공한다.
관찰자는 첫 투표 완료 여부, 첫 투표 시간, 자발적 10회 투표 완료 여부와 중단 이유만 기록하고
조작법을 설명하지 않는다.

- 통과: 15명 중 12명 이상이 첫 투표를 unaided 완료
- 통과: 15명 중 10명 이상이 자발적으로 10개 투표 완료

실제 결과는 `../docs/superpowers/reports/2026-07-14-gate-1-user-test.md`에 익명 participant ID로
기록한다. 15명 모집/관찰이 끝나기 전에는 Gate 1을 통과했다고 표시하거나 P1을 시작하지 않는다.
