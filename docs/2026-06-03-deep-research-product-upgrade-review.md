# Deep Research Product Upgrade 계획서 검토 및 개선 의견서

> **작성일:** 2026-06-03  
> **작성자:** Antigravity (AI Coding Assistant)  
> **문서 상태:** 검토 완료 및 제안  
> **인코딩 형식:** UTF-8  
> **문서 전체 경로:** `c:\Users\petbl\balance\balance-island\docs\2026-06-03-deep-research-product-upgrade-review.md`

---

## 1. 개요 및 전체 평가

본 검토 의견서는 `2026-06-03-deep-research-product-upgrade.md` 업그레이드 계획서를 분석하고, 현재 Balance Island 프로젝트의 실제 코드베이스 및 데이터베이스 스키마와 대조하여 구체적인 정합성을 검증하고, 제품의 가치를 향상시키기 위한 추가적인 개선점을 제시하고자 작성되었습니다.

전반적으로 업그레이드 계획서는 Balance Island를 단순한 A/B 테스트 투표 앱에서 **"게임을 하듯 취향과 가치관을 발견해 나가는 감성적 자기이해 서비스"**로 성공적으로 정체성을 확립하고 있습니다. 

특히 **Choice Echo**를 통한 즉각적 피드백, **동반자 펫**과 **지식 성찰 공간(섬/인사이트 지도)**의 역할 분리, 유료 BM을 배제한 **무료 재화 중심의 가챠 및 확률 투명성 UI** 선제 도입 등은 매우 완성도 높은 프로덕트 로드맵으로 평가됩니다. 

다만, 실제 소스 코드와 계획서 텍스트 간의 **RPC 함수 매개변수 불일치 오류** 및 **AI 질문 생성 스텁 처리** 등에 대한 미세한 리스크가 발견되어 보완 의견을 아래와 같이 정리합니다.

---

## 2. 세부 검토 및 문제점 분석 (Gaps & Corrections)

### [Critical] C1. `fetch_feed_questions` RPC 매개변수 명칭 불일치 오류

- **계획서 기술 내용 (Task 1):**
  - `fetch_feed_questions` 호출부와 DB 함수 정의가 `p_limit`, `p_exclude_before`, `p_sort` 3인자 기준으로 통일되어 있는지 확인할 것을 요구하고 있습니다.
- **실제 코드베이스 및 DB 상태:**
  - **SQL 스키마 (`supabase/migrations/...hardening.sql`):** 
    ```sql
    CREATE OR REPLACE FUNCTION public.fetch_feed_questions(
      p_limit integer DEFAULT 30,
      p_cursor_created_at timestamptz DEFAULT NULL,
      p_sort text DEFAULT 'popular'
    )
    ```
  - **TypeScript 코드 (`src/services/questionService.ts`):**
    ```typescript
    const { data, error } = await rpcClient!.rpc('fetch_feed_questions', {
      p_limit: limit,
      p_cursor_created_at: null,
      p_sort: sort
    });
    ```
- **판단 및 조치 사항:**
  - 실제 코드베이스와 Supabase 스키마는 **`p_cursor_created_at`**으로 정상 동기화되어 있지만, **계획서가 요구하는 `p_exclude_before`는 명백한 오타(오칭)**입니다.
  - 이를 그대로 둔 채 기계적으로 계획을 실행하는 에이전트가 투입될 경우, 정상 작동하는 코드를 잘못된 매개변수명으로 덮어써서 빌드 오류 및 런타임 에러를 발생시킬 수 있습니다.
  - **따라서 계획서의 매개변수 명칭을 `p_cursor_created_at`으로 명확히 정정하고 동기화 상태를 확정해야 합니다.**

---

### [Important] I1. AI 질문 생성/다듬기 (`create.tsx`) 스텁 처리 현황 검증

- **계획서 기술 내용:**
  - `src/services/aiService.ts`, `src/app/(tabs)/create.tsx`의 AI 질문 생성/정제 흐름이 스텁 또는 placeholder 상태라면, 사용자에게 공개되는 실제 작동 기능으로 취급하지 않도록 가이드합니다.
- **실제 코드베이스 분석:**
  - **`create.tsx` (화면 UI):** 사용자가 직접 입력하는 UI만 노출되어 있으며, 상단에 *"AI 다듬기와 중복 검사는 앱 실행 안정화 후 Edge Function으로 다시 연결합니다."*라는 안내 문구가 이미 추가되어 있습니다. 또한, 버튼 클릭 시 *"준비 중"* 알럿 모달이 발생하도록 올바르게 방어 처리가 되어 있습니다.
  - **`aiService.ts` (서비스 로직):** 실제 Edge Function을 연동하지 않고 하드코딩된 mock 데이터를 로컬에서 즉시 반환하도록 격리되어 있습니다.
- **의견 및 보완안:**
  - 현재 코드는 계획서의 안전 가이드를 매우 충실히 따르고 있습니다.
  - 추후 Supabase AI Edge Function 및 OpenAI API 환경이 안정화되어 실 연동으로 전환할 때를 대비하여, `aiService.ts` 파일 내에 **"실제 Edge Function으로 전환하는 방법"**에 대한 TODO 주석 가이드라인을 보강하는 것으로 개발 생산성을 향상시킬 수 있습니다.

---

## 3. 제품 업그레이드 상세 제안

### 💡 제안 1. Choice Echo의 반응 속도 최적화 (낙관적 갱신 적용)
- 투표 직후 **Choice Echo** 시트를 띄울 때 Supabase API의 네트워크 응답을 마냥 기다리면 모바일 환경에서 0.5초 이상의 렉(Lag)이 발생하여 즉각적인 재미가 반감될 수 있습니다.
- 따라서 사용자가 카드를 클릭하는 즉시 로컬 메모리 상태(`feedStore`)를 먼저 업데이트(Optimistic Update)하여 **Choice Echo를 0.1초 내로 띄우고**, 백그라운드로 Supabase 투표 트랜잭션을 실행하는 비동기 UX 구조를 제안합니다.

### 💡 제안 2. `productCopy.ts` 텍스트 현행화 및 동적 텍스트 리터럴 템플릿화
- 기획서의 `'진단형 단정 표현'` 사용 제한(금지 표현)을 체계적으로 거르기 위해 텍스트를 `src/constants/productCopy.ts`로 단일화하는 방안은 매우 훌륭합니다.
- 단순 문자열 뿐만 아니라 펫 이름이나 수치 등이 동적으로 섞여 들어가는 반응형 텍스트(예: *"비숑이 주인님의 모험 성향에 신이 났어요!"*)를 처리할 수 있도록, `productCopy` 구조를 객체 내 **템플릿 리터럴 함수** 형태로 설계할 것을 권장합니다.
  - 예: `petReaction: (petName, trait) => `${petName}이(가) 주인님의 ${trait} 선택에 반응했어요!``

### 💡 제안 3. 최소 Analytics 레이어의 데이터 누출 차단 가이드
- `analyticsService.ts`에서 KPI 측정을 위한 이벤트를 보낼 때, `CLAUDE.md`의 보안 규칙에 맞게 **개인식별정보(이메일, 폰번호) 및 OAuth Access Token 정보가 payload에 유출되지 않도록 하는 엄격한 타입 가드(Type Guard)**를 적용해야 합니다.
- 또한 모바일 환경의 오프라인 상태를 고려하여, 네트워크 단절 시 이벤트를 SQLite나 로컬 스토리지에 임시 버퍼링했다가 온라인 복구 시 벌크 전송하는 가벼운 유틸 레이어를 탑재해 두면 리텐션 데이터 유실 방지에 큰 도움이 될 것입니다.

---

## 4. 결론 및 다음 단계 제안

본 의견서가 저장된 전체 경로는 다음과 같습니다:  
`c:\Users\petbl\balance\balance-island\docs\2026-06-03-deep-research-product-upgrade-review.md`

`fetch_feed_questions` 매개변수명의 실질적 오류(`p_cursor_created_at`으로의 정정)를 제외하면, 이번 업그레이드 계획서는 Balance Island의 핵심 지표(리텐션, 교감 만족도, 자기 발견 지적 가치)를 획기적으로 끌어올릴 수 있는 완벽한 로드맵입니다.

사용자님께서 승인하신다면, 본 검토서의 보완점 및 리스크 가이드를 바탕으로 **Deep Research Product Upgrade 계획서의 개발 작업(Choice Echo, 오늘의 발견 카드, 섬 3개 모드 뷰 분리 등)**을 단계별로 착수하겠습니다. 
수행 여부를 편하게 말씀해 주세요!
