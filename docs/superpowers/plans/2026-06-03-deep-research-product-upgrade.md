# Deep Research Product Upgrade Plan

> 구현 시 권장 스킬: `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`.
> 이 문서는 `deep-research-report.md`를 Balance Island 현재 코드 상태에 맞게 검토한 뒤, 바로 적용할 항목과 보류할 항목을 나눈 실행 계획서다.

## 목표

Balance Island의 정체성을 “밸런스 게임을 재미로 하다 보면, 나도 몰랐던 취향과 가치관이 펫과 섬에 쌓이는 자기발견 앱”으로 강화한다.

핵심 루프는 다음처럼 잡는다.

1. 피드에서 A/B 선택을 빠르게 한다.
2. 선택 직후 짧은 “Choice Echo”로 내가 어떤 방향을 고른 건지 바로 느낀다.
3. 선택이 쌓이면 섬에서 “오늘의 발견”과 연결 지도를 본다.
4. 펫은 감정적 아바타처럼 반응하고, 섬은 Obsidian/마인드맵처럼 내 선택의 흔적을 직관적으로 보여준다.
5. 펫/테마/장식 수집 욕망은 살리되, 확률·피티·중복 보상은 투명하게 보여준다.

## 검토 결론

### 바로 반영할 항목

- 7-15회 선택 안에 “앱이 나를 이해한다”는 첫 체감을 만든다.
- MBTI식 단정 대신 “요즘 선택에서 이런 흐름이 보여요”처럼 비진단 언어를 쓴다.
- 펫은 나의 감정 아바타, 섬은 나의 자기지식 공간으로 역할을 분리한다.
- 섬 첫 화면은 거대한 그래프가 아니라 요약 카드와 작은 연결 지도부터 보여준다.
- 뽑기/수집은 당장은 무료 재화와 보상 중심으로 유지한다.
- 테마 뽑기 전 확률, 피티, 중복 처리 규칙을 먼저 공개한다.
- 한국어 깨짐을 기능 추가보다 먼저 정리한다.
- KPI를 실제 이벤트로 남길 수 있는 최소 analytics 레이어를 추가한다.

### 보류할 항목

- 유료 랜덤 뽑기, 구독, IAP.
- 거래, 리셀, NFT형 소유권.
- UGC 질문 생성 공개 운영.
- 전체 자유 배치형 섬 캔버스.
- 거대한 전체 그래프를 기본 화면으로 노출.
- “당신은 X형입니다” 같은 MBTI/진단형 라벨.

## Spark 리뷰어 검증 반영

GPT-5.3-Codex-Spark 읽기 전용 리뷰어가 지적한 내용 중 타당한 것은 계획에 반영한다.

- `src/services/aiService.ts`, `src/app/(tabs)/create.tsx`의 AI 질문 생성/정제 흐름이 스텁 또는 placeholder 상태라면, 사용자에게 공개되는 생성 기능으로 취급하지 않는다.
- `fetch_feed_questions` RPC가 `p_sort` 인자를 받는 현재 호출부와 Supabase SQL 정의가 모든 환경에서 일치하는지 확인한다.
- `supabase/schema.sql`, `supabase/apply_new_project.sql`처럼 `DROP TABLE ... CASCADE`가 들어간 초기화 스크립트는 운영 DB에서 실행 금지 규칙을 문서화한다.
- 프로필 업데이트는 구버전 RLS 정책과 `update_profile_display` RPC가 섞이지 않도록 최종 권한 경계를 확인한다.
- 카테고리 slug와 한국어 라벨 매핑은 UI, AI 정제, 통계, 추천에서 같은 기준을 쓰게 만든다.
- 실험/KPI는 말로만 두지 않고 이벤트 이름과 수집 지점을 먼저 정한다.

## 현재 코드 기준 확인 지점

- 피드 화면: `src/app/(tabs)/index.tsx`
- 피드 카드: `src/components/feed/BalanceCard.tsx`
- 투표 store: `src/store/feedStore.ts`
- 질문 RPC 서비스: `src/services/questionService.ts`
- 섬 화면: `src/app/(tabs)/island.tsx`
- 인사이트 지도: `src/app/insight-map.tsx`, `src/components/insight/*`
- 인사이트 store/service: `src/store/insightMapStore.ts`, `src/services/insightMapService.ts`
- 펫/테마 경제: `src/store/gamificationStore.ts`, `src/services/gamificationService.ts`
- AI 질문 생성 관련: `src/services/aiService.ts`, `src/app/(tabs)/create.tsx`, `supabase/functions/refine-question/index.ts`
- Supabase 안전성 확인: `supabase/migrations/*`, `supabase/schema.sql`, `supabase/apply_new_project.sql`

## 구현 순서

### 1. 출시 전 안정성 잠금

목적: 새 UX를 얹기 전에 “누르면 안 되는 버튼”, “환경마다 깨질 RPC”, “운영 DB 파괴 위험”을 막는다.

작업:

- `fetch_feed_questions` 호출부와 DB 함수 정의가 `p_limit`, `p_exclude_before`, `p_sort` 3인자 기준으로 통일되어 있는지 확인한다.
- 배포 체크리스트에 “모든 Supabase migration 적용 후 타입 생성”을 넣는다.
- `supabase/schema.sql`, `supabase/apply_new_project.sql`은 새 프로젝트 초기화용으로만 표기하고 운영 적용 금지 문구를 추가한다.
- 프로필 업데이트 경로는 클라이언트 직접 update가 아니라 `update_profile_display` RPC 중심으로 정리한다.
- create 탭의 AI 질문 생성이 실제 Edge Function과 연결되지 않았으면 “준비 중” 또는 내부 테스트 기능으로 둔다.

검증:

- `rg -n "fetch_feed_questions|p_sort" src supabase`
- `rg -n "DROP TABLE|DROP POLICY|profiles_update_own|update_profile_display" supabase`
- create 탭에서 사용자가 실제로 기대하는 제출/정제 버튼이 동작하거나, 명확히 비공개 상태인지 확인한다.

### 2. 한국어 카피 복구와 제품 언어 통일

목적: 자기발견 앱은 신뢰가 핵심이므로 깨진 한글과 진단형 문장을 먼저 제거한다.

작업:

- `src/constants/productCopy.ts`를 만든다.
- 피드, 섬, 인사이트 지도, 펫 반응, 테마 희귀도 라벨을 이 파일로 모은다.
- 깨진 한국어 문자열은 직접 정상 한국어로 교체한다.
- 금지 표현을 정한다.

허용 표현:

- “요즘 선택에서 이런 흐름이 보여요.”
- “이건 성격 진단이 아니라 선택 패턴을 가볍게 해석한 결과예요.”
- “내 섬에 새로운 취향 가지가 생겼어요.”
- “펫이 방금 선택을 기억했어요.”

금지 표현:

- “당신은 X형입니다.”
- “진단 결과.”
- “심리검사.”
- “정확한 성격.”
- “MBTI 대체.”

검증:

- `rg -n "MBTI|진단|심리검사" src`
- 앱 주요 화면에서 한글이 깨지지 않는지 스크린샷으로 확인한다.

### 3. Choice Echo 추가

목적: 선택 직후 “내가 방금 무엇을 드러냈는지” 짧게 보여줘 첫 체감을 만든다.

작업:

- `src/utils/choiceEcho.ts`를 만든다.
- 입력값은 질문, 선택한 옵션, 카테고리 slug/name, 현재 gamification snapshot 정도로 제한한다.
- 투표 직후 store가 선택된 질문 정보를 반환하게 하거나, 화면에서 투표 전 질문 객체를 안전하게 보관한다.
- `src/components/feed/ChoiceEchoSheet.tsx`를 만든다.
- 이미 투표한 카드에서는 중복 echo를 띄우지 않는다.
- snapshot은 투표 직후 갱신 전 값일 수 있으므로 “방금 점수 반영 완료”처럼 확정적으로 말하지 않는다.

문장 톤:

- “방금 선택은 안정 쪽 가지를 조금 밝혔어요.”
- “이 선택은 모험보다 익숙함을 더 끌어안는 쪽이에요.”
- “몇 번 더 고르면 섬에서 더 선명한 흐름으로 보여줄게요.”

검증:

- 새 질문에서 투표하면 Choice Echo가 1회 열린다.
- 이미 투표한 질문은 Echo가 다시 열리지 않는다.
- 비로그인 상태에서 투표 흐름이 기존처럼 깨지지 않는다.

### 4. 오늘의 발견 카드 추가

목적: 섬을 단순 보상 화면이 아니라 “나에 대한 정보가 쌓이는 공간”으로 보이게 만든다.

작업:

- `src/components/island/TodayDiscoveryCard.tsx`를 만든다.
- `useInsightMapStore()`의 `cards[0]` 또는 가장 최근/가장 높은 confidence 카드를 표시한다.
- 섬 상단에 “오늘의 발견”을 배치한다.
- 카드에서 “지도 보기”를 누르면 `src/app/insight-map.tsx`로 이동한다.
- 선택 수가 부족하면 빈 상태 문구를 보여준다.

빈 상태 예시:

- “몇 개의 선택이 쌓이면 오늘의 발견이 열려요.”

검증:

- 로그인 사용자에게 인사이트 카드가 있으면 섬 상단에 표시된다.
- 카드가 없으면 빈 상태가 깨지지 않는다.
- 지도 이동이 정상 동작한다.

### 5. 섬 화면을 세 가지 모드로 정리

목적: 펫, 자기지도, 꾸미기/수집이 한 화면에서 뒤섞여 복잡해지는 것을 막는다.

모드:

- `발견`: 오늘의 발견, 작은 인사이트 지도, 최근 선택 흐름.
- `가지 지도`: trait/category 중심 연결 지도.
- `꾸미기`: 펫, 테마 인벤토리, 장식, 뽑기.

작업:

- `src/components/island/IslandModeTabs.tsx`를 만든다.
- `src/app/(tabs)/island.tsx`에서 기존 섹션을 모드별로 게이트한다.
- `ThemeInventorySection`은 꾸미기 모드로 이동하고 중복 렌더링하지 않는다.
- 기본 진입 모드는 `발견`으로 둔다.
- 큰 그래프는 기본 섬이 아니라 상세 지도 화면에서만 보여준다.

검증:

- 세 모드 전환 시 레이아웃이 흔들리지 않는다.
- 모바일 화면에서 버튼 텍스트가 잘리지 않는다.
- `꾸미기` 모드에 테마 인벤토리가 한 번만 보인다.

### 6. 확률/피티 공개 UI 추가

목적: 수집 욕망은 살리되 신뢰와 규제 리스크를 먼저 관리한다.

작업:

- `fetchThemeProbabilityDisclosure()`를 실제 UI에서 사용한다.
- `src/components/island/ThemeProbabilitySheet.tsx`를 만든다.
- 테마 뽑기 버튼 근처에 “확률 보기”를 둔다.
- 확률, 피티 카운터, 보장 규칙, 중복 변환 규칙을 표시한다.
- 이 단계에서는 유료 결제/IAP를 추가하지 않는다.

검증:

- 확률 보기에서 common/rare/legendary 확률이 보인다.
- 피티 규칙이 null이어도 화면이 깨지지 않는다.
- 뽑기 실패/로딩 상태에서 버튼 중복 입력이 막힌다.

### 7. 카테고리 slug/label 매핑 통일

목적: UI는 한국어, DB와 AI는 slug를 쓰면서도 서로 어긋나지 않게 한다.

작업:

- `src/constants/categories.ts` 또는 기존 적절한 위치에 category map을 만든다.
- slug는 `food`, `life`, `romance`, `career`, `culture`처럼 영문 canonical 값으로 둔다.
- 라벨은 한국어로 둔다.
- create 탭, feed, AI refine function, analytics payload가 같은 slug를 쓰게 한다.
- 알 수 없는 slug는 `uncategorized`로 안전하게 처리한다.

검증:

- `rg -n "푸드|라이프|food|life|romance|career|culture" src supabase/functions`
- UI 라벨과 RPC/Edge Function payload가 섞이지 않는지 확인한다.

### 8. 최소 analytics 레이어 추가

목적: 리서치 보고서의 KPI를 실제로 검증할 수 있게 한다.

작업:

- `src/services/analyticsService.ts`를 만든다.
- 초기 구현은 no-op 또는 dev console log로 충분하다.
- 이벤트 이름을 먼저 고정한다.

이벤트:

- `feed_impression`
- `vote_submit`
- `choice_echo_open`
- `choice_echo_map_open`
- `first_insight_unlock`
- `today_discovery_view`
- `today_discovery_map_open`
- `theme_draw_probability_open`
- `theme_draw_submit`
- `island_mode_change`
- `day_n_return`

주의:

- 이벤트 payload에 이메일, OAuth provider token, raw freeform text 같은 민감정보를 넣지 않는다.
- 질문/카테고리/희귀도/모드 같은 제품 분석에 필요한 최소값만 보낸다.

검증:

- dev 환경에서 이벤트가 콘솔에 찍힌다.
- 민감정보가 payload에 포함되지 않는다.

### 9. 인사이트 지도 기본값 단순화

목적: Obsidian의 장점은 가져오되, 첫 화면을 복잡한 점/선 덩어리로 만들지 않는다.

작업:

- `InsightMapPreview`는 최대 노드/엣지 수를 제한한다.
- 기본 depth는 1로 둔다.
- 노드 종류는 trait, category, recent question 정도로 제한한다.
- 상세 `insight-map` 화면에서만 depth 확장 또는 전체 그래프를 제공한다.
- 노드 상세 문구는 “근거 선택”과 “연결된 가지” 중심으로 쓴다.

검증:

- 선택이 많은 계정에서도 섬 첫 화면이 과밀하지 않다.
- 노드를 눌렀을 때 근거가 없는 단정 문구가 나오지 않는다.

### 10. 문서화와 결정 기록

목적: 나중에 다시 앱을 키울 때 “왜 지금 유료/거래/UGC를 안 했는지” 잊지 않게 한다.

작업:

- `docs/product/deep-research-upgrade-decisions.md`를 만든다.
- 이번 계획에서 채택/보류한 리서치 항목을 기록한다.
- `log.md`, `index.md`에는 구현을 시작할 때만 기록한다.
- `deep-research-report.md`는 사용자가 명시하지 않으면 커밋하지 않는다.

기록할 결정:

- 펫과 섬은 둘 다 유지하되 역할을 분리한다.
- 첫 출시 목표는 과금보다 자기발견 루프 검증이다.
- 무료 재화 뽑기에서도 확률/피티를 공개한다.
- UGC와 거래는 운영/보안/규제 체계가 생긴 뒤 검토한다.
- MBTI식 명명은 피하고 선택 패턴 언어를 쓴다.

## 우선순위

### P0: 기능 추가 전 반드시 잠금

- 한국어 깨짐 복구.
- RPC 시그니처 확인.
- destructive SQL 운영 실행 금지 문서화.
- AI 생성 스텁 공개 범위 정리.
- 프로필 업데이트 권한 경계 확인.

### P1: 이번 업그레이드 핵심

- Choice Echo.
- 오늘의 발견 카드.
- 섬 3모드 정리.
- 확률/피티 공개 UI.
- category slug/label 통일.
- 최소 analytics.

### P2: 데이터 보고 확장

- 펫 반응 고도화.
- 테마/장식 수집 루프 확장.
- 인사이트 지도 depth 확장.
- 공유 카드와 리텐션 실험.

## 완료 기준

- 앱 주요 화면에 깨진 한글이 없다.
- 투표 직후 Choice Echo가 열린다.
- 섬에서 오늘의 발견을 바로 볼 수 있다.
- 섬 첫 화면이 복잡한 전체 그래프가 아니라 요약/발견 중심이다.
- 테마 뽑기 전 확률과 피티 규칙을 볼 수 있다.
- 유료 랜덤, 거래, NFT, UGC는 추가되지 않았다.
- `fetch_feed_questions` 호출부와 DB 함수 정의가 일치한다.
- create 탭의 AI 생성 기능이 실제 연결 또는 명확한 비공개/준비 중 상태다.
- analytics 이벤트가 민감정보 없이 남는다.

## 검증 명령

```powershell
rg -n "MBTI|진단|심리검사" src
rg -n "fetch_feed_questions|p_sort" src supabase
rg -n "DROP TABLE|DROP POLICY|profiles_update_own|update_profile_display" supabase
npm run typecheck
npm run validate:pet-assets
npm run validate:wiki
```

## 출시 전 수동 QA

- 새 계정으로 로그인한다.
- 10개 이상 밸런스 질문을 고른다.
- Choice Echo가 과도하게 단정적이지 않은지 확인한다.
- 섬에서 오늘의 발견이 열리는지 확인한다.
- 지도 보기로 이동해 근거 선택이 보이는지 확인한다.
- 테마 뽑기 전 확률/피티 안내를 확인한다.
- 뽑기 후 펫/섬/인벤토리 상태가 갱신되는지 확인한다.
- create 탭은 실제 생성이 안 되면 사용자에게 공개된 성공 UX처럼 보이지 않아야 한다.
