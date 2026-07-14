# Balance UI/UX Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재의 투표·질문 작성·나의 뇌 기능을 유지하면서, 제공된 네 장의 레퍼런스처럼 밝고 가벼운 카드형 피드와 명확한 A/B 선택 경험으로 개편한다.

**Architecture:** 1차는 디자인 토큰과 공통 프리미티브를 먼저 고정한 뒤 피드, 상세, 작성, 나의 뇌, 탭 셸을 순차 교체한다. 오늘의 밸런스만 검수 이미지를 필수로 사용하고 일반·사용자 질문은 이미지 URL이 없을 때 카테고리 아이콘과 색상으로 안전하게 대체한다. 댓글·공감·저장·검색·랭킹·유사 사용자는 실제 데이터 모델과 운영 정책이 준비되는 2차 계획으로 분리한다.

**Tech Stack:** Expo SDK 57, React Native 0.86, Expo Router, TypeScript, TanStack Query, Zustand, `expo-image`, `expo-symbols`, `react-native-svg`, Jest, React Native Testing Library, Maestro

## Global Constraints

- 지원 대상은 iOS, Android, Web이며 390×844 모바일 뷰를 기준으로 설계한다. Web은 화면별 컨테이너가 아니라 헤더·콘텐츠·하단 탭을 모두 포함하는 단일 앱 셸을 최대 폭 720px로 제한한다.
- 첫 화면의 핵심 행동은 A/B 투표다. 검색, 알림, 랭킹은 실제 기능이 준비되기 전까지 클릭 가능한 버튼으로 노출하지 않는다.
- 투표 전에는 전체 결과 비율과 다수 선택을 공개하지 않는다. 투표 직후에만 실제 집계값을 표시한다.
- 오늘의 밸런스는 검수된 A/B 이미지와 대체 텍스트가 필수다. 일반·사용자 질문의 이미지는 선택 사항이며 카테고리 아이콘 fallback을 제공한다.
- 댓글·공감·저장·유사 사용자 수치는 실제 서버 데이터 없이 예시값으로 표시하지 않는다.
- 모든 터치 대상은 최소 44×44pt, 일반 텍스트 대비는 4.5:1 이상, 큰 텍스트 대비는 3:1 이상으로 유지한다.
- 200% Dynamic Type, 키보드 탐색, 화면 읽기 순서, Reduce Motion을 지원한다.
- 기존 익명 세션, 오프라인 게스트, 재시도 큐, 공유 딥링크, 신고·차단, 알림 및 분석의 동작을 보존한다.
- 부분 Supabase 설정에서는 서버 클라이언트를 만들지 않고 로컬 질문 저장소로 부팅해야 한다.
- 제공된 네 장의 이미지는 시각적 레퍼런스로만 사용하고 앱 자산으로 직접 잘라 쓰지 않는다.
- 새 UI 문구는 정상 UTF-8 한국어로 작성하며 깨진 인코딩 문자열을 복사하지 않는다.

## Confirmed Product Decisions

1. **단계 C:** 1차 UI/UX 개편과 2차 소셜 확장을 분리한다.
2. **이미지 A+C:** 오늘의 밸런스는 이미지 필수, 일반·UGC 질문은 이미지 선택 사항이다.
3. **추천 접근 A:** 디자인 기반부터 단계적으로 전환하고 각 화면을 독립 검토한다.
4. 피드는 `오늘의 밸런스 hero + 일반 질문 compact list` 구조를 사용한다.
5. 나의 뇌는 진단처럼 단정하지 않고 선택 근거와 공개 단계를 유지한다.

## Opinion Review Disposition (2026-07-15)

`2026-07-15-balance-ui-ux-refresh-opinion.md`를 현재 코드, 001–011 Supabase 마이그레이션, Expo SDK 57 공식 문서와 대조했다.

- **수용:** `question_options`에 미디어 저장소와 읽기 RPC 반환값이 없으므로 012 마이그레이션을 미디어 도메인 작업보다 먼저 추가한다.
- **수용:** `PlayScreen` 마운트 시 무조건 실행되는 `reset()`과 투표 성공 800ms 뒤의 `advance()`를 제거한다. 동일한 repository/user/source 재진입은 질문 위치와 스크롤을 보존하고, 명시적 새로고침 또는 source key 변경에서만 초기화한다.
- **수용:** 카테고리별 색·아이콘은 중앙 `CATEGORY_THEMES`와 안전한 `기타` fallback으로 관리한다. `expo-symbols`는 iOS/Android/Web 이름을 모두 제공하고 렌더 불가 시 텍스트 fallback을 둔다.
- **수용:** Web 최대 폭은 개별 화면이 아니라 루트 앱 셸에 적용한다. 단, 의견서의 `minHeight: '100vh'`를 공용 React Native `ViewStyle`에 넣는 방식은 채택하지 않고 Web 전용 CSS에서 `100dvh`와 `100vh` fallback을 사용한다.
- **수용:** `react-native-svg`는 Web 호환 계층을 제공하지만 동일 렌더링을 보장하는 것은 아니므로 Web export와 실제 브라우저 시각 검증을 추가한다.
- **부분 수용:** 읽기 RPC인 `get_daily_question`, `get_feed`, 최신 `get_shared_question`은 A/B 이미지 URL·alt를 반환하게 한다. 1차 작성 화면은 이미지 업로드를 제공하지 않으므로 `create_question` 인자/반환 계약은 확장하지 않고 repository가 생성 결과를 null media로 정규화한다.
- **기각:** `QuestionRepository.ts` 메서드 시그니처는 이미 도메인 `Question`을 반환하므로 미디어 필드 추가만으로 수정할 필요가 없다. 해당 파일은 수정 목록에 넣지 않고 TypeScript 계약 검증 대상으로 둔다.

검증 근거:

- 로컬: `question_options` 정의(001), 읽기 RPC(002/005), 최신 `create_question`(010), `PlayScreen.tsx`, `useDeckStore.ts`, `QuestionRepository.ts`
- 공식: [Expo Symbols SDK 57](https://docs.expo.dev/versions/latest/sdk/symbols/)의 교차 플랫폼 이름/fallback 계약
- 공식: [react-native-svg](https://github.com/software-mansion/react-native-svg)의 React Native Web 호환 계층과 Expo 설치 안내

### Balance Card Integration Opinion Review (2026-07-15)

후속 `2026-07-15-balance-card-integration-design-opinion.md`를 현재 local 결과 계산, Supabase RPC·pgTAP 계약, React Native 0.86, React Native Web 0.21과 대조했다. 상세 실행 절차는 `docs/superpowers/plans/2026-07-15-balance-card-integration.md`를 단일 기준으로 사용한다.

- **수용:** selected 항목의 2px primary 테두리·옅은 배경·체크·`선택됨` 텍스트, `props.mode` 분기 후 union narrowing.
- **부분 수용:** read-only 질문·A·B·카테고리를 명시 라벨로 그룹화하되 질문 카드에 맞지 않는 `summary` 역할은 정적 text 의미로 바꾼다.
- **부분 수용:** 잘못된 퍼센트는 결과 막대 안의 비차단 fallback으로 처리하고 무투표 마감 `0/0`은 별도 빈 상태로 표시한다.
- **기각:** 현재 local·RPC가 모두 `percentB = 100 - percentA`를 보장하므로 95–105 임의 자동 보정은 하지 않는다.
- **기각:** React Native Web 0.21에서 deprecated인 `focusable={true}`를 추가하지 않는다. 활성 `Pressable`의 기본 tab stop과 실제 Tab/Enter/Space·`:focus-visible`을 검증한다.

## Reference Screen Mapping

- `ChatGPT Image 2026년 7월 14일 오전 03_16_17.png` → 피드의 큰 오늘의 카드, compact 일반 카드, floating CTA가 아닌 고정 작성 탭의 시각 방향
- `ChatGPT Image 2026년 7월 14일 오전 03_16_33.png` → 상세의 결과 막대, 한 줄 근거, 하단 주요 행동의 시각 방향; 댓글·공감·저장은 2차까지 제외
- `ChatGPT Image 2026년 7월 14일 오전 03_16_28.png` → 나의 뇌 8축 지도, 세 개의 요약 카드, 단계적 공개의 시각 방향; 유사 사용자는 2차까지 제외
- `ChatGPT Image 2026년 7월 14일 오전 03_16_25.png` → 작성 화면의 섹션 카드, A/B 색상 구분, 카테고리 칩, 설정 행, 전체 폭 CTA의 시각 방향

레퍼런스의 iPhone frame, Dynamic Island, status bar는 앱 UI에 포함하지 않는다. 장식용 왕관·검색·알림·floating 작성 버튼도 실제 기능 또는 명확한 사용자 가치가 없으면 추가하지 않는다.

## File Structure

### Create

- `mobile/src/design/components.ts`: 그림자, 카드, 버튼, pill 변형의 공통 스타일 상수
- `mobile/src/design/categoryThemes.ts`: 카테고리별 교차 플랫폼 아이콘·색상과 `기타` fallback
- `mobile/src/components/ui/SurfaceCard.tsx`: 표면 카드 컨테이너
- `mobile/src/components/ui/ScreenHeader.tsx`: 제목, 설명, 선택 액션 슬롯
- `mobile/src/components/ui/Pill.tsx`: 카테고리·오늘의 밸런스 badge
- `mobile/src/components/ui/SectionCard.tsx`: 작성 화면 섹션 컨테이너
- `mobile/src/features/play/ui/HeroBalanceCard.tsx`: 이미지/아이콘 fallback을 지원하는 오늘의 질문
- `mobile/src/features/play/ui/BalanceChoicePanel.tsx`: 피드·상세·공유가 함께 쓰는 read-only/votable A/B 프리미티브
- `mobile/src/features/play/ui/CompactBalanceCard.tsx`: 일반 질문 목록 카드
- `mobile/src/features/play/ui/VoteSplitBar.tsx`: 투표 후 실제 결과 막대
- `mobile/src/features/play/ui/QuestionMedia.tsx`: 검수 이미지와 fallback 렌더링
- `mobile/src/features/brain/ui/BrainMap.tsx`: 8축 선택 지도
- `mobile/src/features/brain/ui/BrainInsightCards.tsx`: 근거 기반 요약 카드
- `mobile/src/features/ask/ui/CategoryChipGroup.tsx`: 단일 선택 카테고리 칩
- `mobile/src/features/ask/ui/SettingRow.tsx`: 공개 범위·기간 설정 행
- `mobile/src/components/AppFrame.tsx`: Native 전체 높이 앱 셸
- `mobile/src/components/AppFrame.web.tsx`: 헤더·본문·탭을 함께 제한하는 720px Web 셸
- `mobile/__tests__/design/design-tokens.test.ts`: 디자인 계약 테스트
- `mobile/__tests__/play/hero-balance-card.test.tsx`: hero 카드 테스트
- `mobile/__tests__/play/compact-balance-card.test.tsx`: compact 카드 테스트
- `mobile/__tests__/play/vote-split-bar.test.tsx`: 결과 공개 테스트
- `mobile/__tests__/brain/brain-map.test.tsx`: 8축 지도 테스트
- `mobile/__tests__/ask/category-chip-group.test.tsx`: 카테고리 접근성 테스트
- `mobile/__tests__/design/category-themes.test.ts`: 알려진/알 수 없는 카테고리 fallback 계약
- `mobile/__tests__/routing/app-frame.test.tsx`: Web 전체 앱 폭 계약
- `mobile/supabase/migrations/202607150012_option_media.sql`: 옵션 미디어 컬럼과 읽기 RPC 계약
- `mobile/maestro/ui-refresh-primary-flow.yaml`: 1차 대표 흐름

### Modify

- `mobile/src/design/tokens.ts`: 색상, 타이포, 간격, 반경, elevation, breakpoint 확장
- `mobile/src/global.css`: Web focus ring, 배경, 최대 폭 및 reduced-motion 규칙
- `mobile/src/features/play/domain/question.ts`: 선택지 이미지 URL과 대체 텍스트 추가
- `mobile/src/features/play/data/LocalQuestionRepository.ts`: 선택적 미디어 필드 보존
- `mobile/src/features/play/data/SupabaseQuestionRepository.ts`: 선택적 미디어 매핑
- `mobile/supabase/tests/database/schema.test.sql`: 옵션 미디어 컬럼·제약 검증
- `mobile/supabase/tests/database/functions.test.sql`: 읽기 RPC A/B 미디어 반환 검증
- `mobile/supabase/tests/upgrade-path.ps1`: 011 → 012 업그레이드와 기존 행 null 호환 검증
- `mobile/src/seed/questions.ko.json`: 오늘의 질문 미디어 메타데이터 추가
- `mobile/src/features/play/state/useDeckStore.ts`: compact 카드에서 특정 질문으로 이동하는 `goTo` 추가
- `mobile/src/features/play/ui/PlayScreen.tsx`: hero + compact 피드 구조로 재구성
- `mobile/src/features/play/ui/QuestionCard.tsx`: 호환 wrapper 또는 제거 전환
- `mobile/src/features/play/ui/ResultOverlay.tsx`: `VoteSplitBar` 기반 결과 panel로 교체
- `mobile/app/question/[id].tsx`: 상세 화면 계층 및 1차 기능만 노출
- `mobile/src/features/ask/ui/AskScreen.tsx`: 카드 섹션, 칩, 설정 행 구조로 재구성
- `mobile/src/features/brain/ui/BrainScreen.tsx`: 지도 + 인사이트 + 근거 disclosure 구조로 재구성
- `mobile/src/components/app-tabs.tsx`: native 탭 아이콘·label·active indicator 개편
- `mobile/src/components/app-tabs.web.tsx`: Web 탭 셸과 focus state 개편
- `mobile/app/(tabs)/_layout.tsx`: 탭명 `피드 / 작성 / 나의 뇌 / 마이`로 통일
- `mobile/app.json`: 앱 배경색과 splash 색상 동기화
- `mobile/package.json`: `react-native-svg` 직접 의존성 추가
- 관련 `mobile/__tests__/**/*.test.tsx`: 기존 동작과 새 시각 계약을 함께 검증

### Phase 2 Separate Plan

1차 승인 후 `docs/superpowers/plans/2026-07-15-balance-social-layer.md`를 새로 작성한다. 그 계획에서만 댓글, 공감, 저장, 검색, 랭킹, 공개 프로필, 유사 사용자, 관련 알림과 운영 도구를 구현한다.

---

### Task 1: 디자인 토큰과 공통 표면 확립

**Files:**
- Modify: `mobile/src/design/tokens.ts`
- Create: `mobile/src/design/components.ts`
- Create: `mobile/src/design/categoryThemes.ts`
- Create: `mobile/src/components/ui/SurfaceCard.tsx`
- Create: `mobile/src/components/ui/ScreenHeader.tsx`
- Create: `mobile/src/components/ui/Pill.tsx`
- Create: `mobile/src/components/ui/SectionCard.tsx`
- Modify: `mobile/src/global.css`
- Test: `mobile/__tests__/design/design-tokens.test.ts`
- Test: `mobile/__tests__/design/category-themes.test.ts`

**Interfaces:**
- Produces: `colors`, `typography`, `spacing`, `radius`, `shadow`, `layout`, `motion`
- Produces: `CATEGORY_THEMES`, `getCategoryTheme(category)` with a `기타` fallback
- Produces: `SurfaceCard`, `ScreenHeader`, `Pill`, `SectionCard`
- Consumes: React Native `ViewProps`, `TextProps`, `PropsWithChildren`

- [ ] **Step 1: 실패하는 디자인 계약 테스트 작성**

```ts
import { colors, layout, radius, spacing, typography } from '@/src/design/tokens';

test('defines the approved bright card system', () => {
  expect(colors).toMatchObject({
    background: '#F8F8FC', surface: '#FFFFFF', primary: '#6C4DFF',
    optionA: '#FF5364', optionB: '#FF9500', text: '#15151A', muted: '#73737D',
  });
  expect(radius.card).toBe(24);
  expect(spacing.touch).toBe(44);
  expect(layout.contentMaxWidth).toBe(720);
  expect(typography.title.fontSize).toBe(32);
});

test.each(['일상', '회사', '관계', '여행', '돈', '성장', '기타'])('%s has cross-platform icon names', (category) => {
  expect(getCategoryTheme(category).icon).toEqual(expect.objectContaining({ ios: expect.any(String), android: expect.any(String), web: expect.any(String) }));
});

test('unknown categories use the safe fallback', () => {
  expect(getCategoryTheme('새 카테고리')).toEqual(CATEGORY_THEMES.기타);
});
```

- [ ] **Step 2: 테스트가 기존 토큰 누락으로 실패하는지 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/design/design-tokens.test.ts`

Expected: FAIL because `layout`, `typography`, `spacing.touch`, and category themes do not exist.

- [ ] **Step 3: 토큰과 공통 프리미티브 최소 구현**

```ts
export const typography = {
  title: { fontSize: 32, lineHeight: 40, fontWeight: '800' as const },
  section: { fontSize: 22, lineHeight: 30, fontWeight: '800' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
} as const;

export const layout = { contentMaxWidth: 720, mobileGutter: 20 } as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, touch: 44 } as const;
```

`SurfaceCard`는 흰 배경, 1px 중립 border, 플랫폼별 얕은 shadow만 제공하고 업무 의미를 갖지 않는다. `ScreenHeader`는 `title`, `subtitle?`, `actions?`만 받는다.

`CATEGORY_THEMES`는 현재 seed의 `일상/회사/관계/여행/돈/성장`과 작성 화면의 승인 카테고리를 명시적으로 매핑하고 `기타`를 기본값으로 쓴다. `SymbolView`에는 SDK 57 계약에 맞춰 `{ ios, android, web }` 이름과 텍스트 fallback을 함께 전달한다.

- [ ] **Step 4: 토큰·TypeScript·기존 접근성 테스트 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/design/design-tokens.test.ts __tests__/accessibility/interactive-controls.test.tsx && npm run typecheck`

Expected: PASS with zero TypeScript errors.

- [ ] **Step 5: 커밋**

```bash
git add mobile/src/design mobile/src/components/ui mobile/src/global.css mobile/__tests__/design
git commit -m "feat(ui): establish bright card design system"
```

### Task 1.5: Supabase 옵션 미디어 스키마와 읽기 RPC 계약

**Files:**
- Create: `mobile/supabase/migrations/202607150012_option_media.sql`
- Modify: `mobile/supabase/tests/database/schema.test.sql`
- Modify: `mobile/supabase/tests/database/functions.test.sql`
- Modify: `mobile/supabase/tests/upgrade-path.ps1`

**Interfaces:**
- Produces: nullable `question_options.image_url`, `question_options.image_alt`
- Produces: `image_url_a`, `image_alt_a`, `image_url_b`, `image_alt_b` from `get_daily_question`, `get_feed`, and the latest privacy-safe `get_shared_question`
- Preserves: `create_question(text...)` signature, feed cursor/session semantics, grants, RLS, block/moderation filters

- [ ] **Step 1: 실패하는 pgTAP 및 업그레이드 계약 작성**

검증 항목은 컬럼 존재, URL/alt 쌍 제약, 기존 011 데이터의 null 호환, 세 읽기 RPC의 네 미디어 필드, 기존 feed cursor와 shared-question privacy 동작이다. `create_question`은 이미지 인자를 받지 않으며 생성된 두 옵션의 미디어는 null이어야 한다.

- [ ] **Step 2: 012 없이 실패하는지 확인**

Run: `cd mobile && npx supabase db reset && npx supabase test db && npm run test:upgrade`

Expected: FAIL on missing option media columns/RPC fields or missing 012 upgrade assertion.

- [ ] **Step 3: nullable 컬럼, pair constraint, 최신 RPC 정의 구현**

`image_url`과 `image_alt`는 둘 다 null이거나, URL이 `https://`로 시작하고 trim한 alt가 1–160자여야 한다. PostgreSQL table-return 함수의 반환형 변경은 `CREATE OR REPLACE`로 처리할 수 없으므로 기존 signature를 drop한 뒤 002의 `get_daily_question/get_feed`와 005의 최신 privacy-safe `get_shared_question` 본문을 기준으로 재생성하고 기존 execute grant를 복구한다. 기존 feed snapshot/cursor/advisory-lock, block, stage, close-time 조건은 한 줄도 약화하지 않는다.

승인된 원격 자산이 준비되지 않은 기존 질문에는 placeholder URL을 넣지 않는다. 오늘의 질문 게시 전 검수 게이트가 A/B URL과 alt 존재를 확인하고, repository/UI는 과거 null 행을 fallback으로 안전하게 처리한다.

- [ ] **Step 4: DB 전체·업그레이드 검증**

Run: `cd mobile && npx supabase db reset && npx supabase test db && npx supabase db lint && npm run test:upgrade`

Expected: all pgTAP and upgrade-path checks pass; lint has zero findings; old rows remain readable.

- [ ] **Step 5: 커밋**

```bash
git add mobile/supabase
git commit -m "feat(db): add optional question media contract"
```

### Task 2: 질문 미디어 모델과 안전한 fallback

**Files:**
- Modify: `mobile/src/features/play/domain/question.ts`
- Modify: `mobile/src/features/play/data/LocalQuestionRepository.ts`
- Modify: `mobile/src/features/play/data/SupabaseQuestionRepository.ts`
- Modify: `mobile/src/seed/questions.ko.json`
- Create: `mobile/src/features/play/ui/QuestionMedia.tsx`
- Test: `mobile/__tests__/play/question-media.test.tsx`
- Test: `mobile/__tests__/play/local-question-repository.test.ts`
- Test: `mobile/__tests__/play/supabase-repository.test.ts`
- Verify only: `mobile/src/features/play/data/QuestionRepository.ts`

**Interfaces:**
- Produces: `QuestionOptionMedia = { imageUrl: string | null; alt: string | null }`
- Produces: `QuestionMedia({ media, category, side })`
- Consumes: `Question`, category string, `side: 'A' | 'B'`

- [ ] **Step 1: 이미지와 fallback 동작의 실패 테스트 작성**

```tsx
test('renders accessible image when URL and alt are present', async () => {
  const view = await render(
    <QuestionMedia media={{ imageUrl: 'https://cdn.example/ramen.webp', alt: '김이 나는 라면' }} category="일상" side="A" />,
  );
  expect(view.getByLabelText('김이 나는 라면')).toBeTruthy();
});

test('renders category fallback without an empty image control', async () => {
  const view = await render(<QuestionMedia media={{ imageUrl: null, alt: null }} category="회사" side="B" />);
  expect(view.getByLabelText('회사 선택지 기본 이미지')).toBeTruthy();
  expect(view.queryByRole('image')).toBeNull();
});
```

- [ ] **Step 2: 컴포넌트와 미디어 필드가 없어 실패하는지 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/play/question-media.test.tsx`

Expected: FAIL because `QuestionMedia` and option media fields do not exist.

- [ ] **Step 3: 선택적 미디어 타입과 렌더러 구현**

```ts
export interface QuestionOptionMedia {
  imageUrl: string | null;
  alt: string | null;
}

export interface Question {
  id: string;
  optionA: string;
  optionB: string;
  description: string | null;
  category: string;
  visibility: QuestionVisibility;
  closesAt: string | null;
  isDaily: boolean;
  stage: DistributionStage;
  weightsA: OptionWeights;
  weightsB: OptionWeights;
  mediaA: QuestionOptionMedia;
  mediaB: QuestionOptionMedia;
}
```

원격 URL은 `https:`만 허용하고 잘못된 URL, 빈 alt, 로딩 실패는 중앙 `getCategoryTheme()` fallback으로 전환한다. 오늘의 질문 seed에는 A/B 이미지 URL과 구체적인 alt를 모두 넣는다. UGC 생성 RPC는 바꾸지 않으며 생성 응답에 미디어 필드가 없거나 null이면 repository가 `{ imageUrl: null, alt: null }`로 정규화한다. `QuestionRepository` 메서드 signature는 변경하지 않고 `npm run typecheck`로 기존 소비자가 확장된 `Question`을 올바르게 받는지만 확인한다.

- [ ] **Step 4: domain/repository/media 테스트 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/play/question-media.test.tsx __tests__/play/local-question-repository.test.ts __tests__/play/supabase-repository.test.ts`

Expected: PASS; old questions without media normalize to null media.

- [ ] **Step 5: 커밋**

```bash
git add mobile/src/features/play mobile/src/seed mobile/__tests__/play
git commit -m "feat(feed): add optional question media"
```

### Task 3: 오늘의 질문 hero와 일반 질문 compact card

> **후속 통합 기준:** 이 작업의 공통 A/B 기반, 결과 경계, 상세·공유 연결은 `docs/superpowers/plans/2026-07-15-balance-card-integration.md`의 Tasks 1–5를 먼저 따른다. 이 절의 compact 카드 요구사항은 그 후 이어서 구현한다.

**Files:**
- Create: `mobile/src/features/play/ui/HeroBalanceCard.tsx`
- Create: `mobile/src/features/play/ui/BalanceChoicePanel.tsx`
- Create: `mobile/src/features/play/ui/CompactBalanceCard.tsx`
- Create: `mobile/src/features/play/ui/VoteSplitBar.tsx`
- Modify: `mobile/src/features/play/ui/QuestionCard.tsx`
- Modify: `mobile/src/features/play/ui/ResultOverlay.tsx`
- Test: `mobile/__tests__/play/hero-balance-card.test.tsx`
- Test: `mobile/__tests__/play/compact-balance-card.test.tsx`
- Test: `mobile/__tests__/play/vote-split-bar.test.tsx`
- Modify: `mobile/__tests__/play/question-card.test.tsx`

**Interfaces:**
- Produces: `HeroBalanceCard({ question, result, disabled, onVote, onSkip })`
- Produces: `BalanceChoicePanel` discriminated union with `readOnly` and `votable` modes
- Produces: `CompactBalanceCard({ question, result?, onOpen })`
- Produces: `VoteSplitBar({ percentA, percentB, selected })`
- Consumes: `Question`, `VoteResult`, `VoteChoice`

- [ ] **Step 1: 결과 비공개와 접근성 순서의 실패 테스트 작성**

```tsx
test('keeps percentages hidden until a real vote result exists', async () => {
  const view = await render(<HeroBalanceCard question={question} result={null} disabled={false} onVote={jest.fn()} onSkip={jest.fn()} />);
  expect(view.queryByText(/%/)).toBeNull();
  expect(view.getAllByRole('button').map(node => node.props.accessibilityLabel)).toEqual([
    `A 선택: ${question.optionA}`, `B 선택: ${question.optionB}`, '질문 패스',
  ]);
});

test('announces the selected option and exact inline result after voting', async () => {
  const view = await render(<VoteSplitBar percentA={64} percentB={36} selected="A" />);
  expect(view.getByLabelText('A 64퍼센트, B 36퍼센트, 내가 선택한 답 A')).toBeTruthy();
});
```

- [ ] **Step 2: 새 컴포넌트가 없어 실패하는지 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/play/hero-balance-card.test.tsx __tests__/play/vote-split-bar.test.tsx`

Expected: FAIL on missing modules.

- [ ] **Step 3: hero, compact, split bar 구현**

Hero는 badge → 질문 문구 → A/B media tiles → 결과 또는 안내 → pass 순서다. compact 카드는 category → 질문 → 선택 상태/요약 → 실제 참여 수 순서며 댓글·공감·저장 수는 렌더링하지 않는다. `ResultOverlay`는 흰 모달 overlay 대신 hero 내부의 지속되는 결과 panel로 바꾼다. 결과 panel은 800ms 타이머로 사라지거나 다음 질문을 강제하지 않으며, 다음 질문 이동은 사용자의 compact 카드 선택 또는 명시적 `다음 질문` 행동으로만 발생한다.

- [ ] **Step 4: 카드 테스트와 기존 빠른 연속 입력 방지 테스트 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/play/hero-balance-card.test.tsx __tests__/play/compact-balance-card.test.tsx __tests__/play/vote-split-bar.test.tsx __tests__/play/question-card.test.tsx __tests__/play/play-screen.test.tsx`

Expected: PASS; one physical press still produces at most one vote request and the inline result remains visible until the user navigates.

- [ ] **Step 5: 커밋**

```bash
git add mobile/src/features/play/ui mobile/__tests__/play
git commit -m "feat(feed): add hero and compact balance cards"
```

### Task 4: 피드 화면과 탭 셸 재구성

**Files:**
- Modify: `mobile/src/features/play/state/useDeckStore.ts`
- Modify: `mobile/src/features/play/ui/PlayScreen.tsx`
- Modify: `mobile/src/components/app-tabs.tsx`
- Modify: `mobile/src/components/app-tabs.web.tsx`
- Create: `mobile/src/components/AppFrame.tsx`
- Create: `mobile/src/components/AppFrame.web.tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx`
- Modify: `mobile/app/(tabs)/index.tsx`
- Modify: `mobile/src/global.css`
- Modify: `mobile/__tests__/play/play-screen.test.tsx`
- Modify: `mobile/__tests__/routing/tab-shell.test.tsx`
- Create: `mobile/__tests__/routing/app-frame.test.tsx`

**Interfaces:**
- Produces: `useDeckStore().activateSource(sourceKey)`, `goTo(index)`, `rememberScrollOffset(offset)`, `recordResult(questionId, result)`
- Produces: root `AppFrame` with native `flex: 1` and Web-only 720px centered viewport
- Consumes: `HeroBalanceCard`, `CompactBalanceCard`, existing query/retry/queue APIs

- [ ] **Step 1: 피드 계층과 탭명 실패 테스트 작성**

```tsx
test('renders one daily hero before compact feed items', async () => {
  const view = await render(<PlayScreen repository={repository} userId="guest-1" />);
  expect(await view.findByLabelText('오늘의 밸런스')).toBeTruthy();
  expect(view.getAllByLabelText(/일반 밸런스 카드/)).toHaveLength(9);
});

test('uses the approved tab labels', () => {
  expect(readTabSource()).toEqual(expect.stringContaining("title: '피드'"));
  expect(readTabSource()).toEqual(expect.stringContaining("title: '작성'"));
  expect(readTabSource()).toEqual(expect.stringContaining("title: '나의 뇌'"));
  expect(readTabSource()).toEqual(expect.stringContaining("title: '마이'"));
});

test('keeps feed position when the same source remounts', async () => {
  const first = await renderFeed({ repository, userId: 'guest-1' });
  await openCompactCard(first, 4);
  rememberScrollOffset(640);
  first.unmount();
  const second = await renderFeed({ repository, userId: 'guest-1' });
  expect(useDeckStore.getState()).toMatchObject({ index: 4, scrollOffset: 640 });
  second.unmount();
});

test('does not auto-advance 800ms after a successful vote', async () => {
  jest.useFakeTimers();
  const view = await renderFeed({ repository, userId: 'guest-1' });
  await voteA(view);
  jest.advanceTimersByTime(800);
  expect(useDeckStore.getState().index).toBe(0);
  expect(view.getByLabelText(/내가 선택한 답 A/)).toBeTruthy();
});
```

- [ ] **Step 2: 기존 단일 카드 deck에서 실패하는지 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/play/play-screen.test.tsx __tests__/routing/tab-shell.test.tsx`

Expected: FAIL because compact cards, approved labels, source-aware state, and the root AppFrame are absent; the current vote timer still advances after 800ms.

- [ ] **Step 3: 피드와 탭 셸 구현**

`PlayScreen`의 쿼리·투표·오프라인 큐 로직은 유지하고 렌더링을 `ScrollView`의 daily hero와 compact list로 교체한다. compact 카드를 누르면 `goTo(index)` 후 해당 질문 hero로 스크롤한다. 결과는 store의 `resultsByQuestionId`에 보존하고 성공 직후 submission lock을 해제하되, 800ms timer와 자동 `advance()`는 제거한다.

store의 `sourceKey`는 repository source + user ID를 결합한다. 같은 key로 재마운트할 때 index/scroll offset을 유지하고 effect cleanup에서는 reset하지 않는다. source key가 바뀌거나 사용자가 `새로고침`을 명시했을 때만 index, result map, scroll offset을 초기화한다. 스크롤 복원은 콘텐츠가 준비된 뒤 한 번만 `scrollTo({ y: scrollOffset, animated: false })`로 수행한다.

`AppFrame`은 Native에서 `flex: 1`만 제공한다. `.web.tsx`와 `global.css`는 라우트 헤더·콘텐츠·하단 탭을 하나의 `width: 100%; max-width: 720px; margin-inline: auto` 셸 안에 둔다. 높이는 Web CSS의 `min-height: 100vh` fallback 뒤 `min-height: 100dvh`를 선언하며 이 문자열을 공용 React Native `ViewStyle`에 넣지 않는다.

- [ ] **Step 4: 피드·라우팅·Web export 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/play/play-screen.test.tsx __tests__/routing/tab-shell.test.tsx __tests__/routing/app-frame.test.tsx && npx expo export --platform web`

Expected: PASS, 12 static routes exported, and the generated Web shell constrains header/content/tabs together.

- [ ] **Step 5: 커밋**

```bash
git add mobile/src/features/play mobile/src/components mobile/app mobile/src/global.css mobile/__tests__
git commit -m "feat(feed): compose daily hero and question list"
```

### Task 5: 상세 화면을 1차 기능에 맞게 정돈

> **2026-07-15 실행 메모:** 사용자 요청으로 Task 1–4보다 먼저 기존 토큰 위에서 상세/공유 계층, active 결과 비공개, 딥링크 복구, 공유 큐 회귀를 구현했다. `HeroBalanceCard`/`VoteSplitBar` 통합과 상단 more 메뉴는 선행 Task 3 완료 후 수행하며, 현재 전용 카드에 가짜 more 액션을 추가하지 않는다.
>
> **후속 연결 메모:** `HeroBalanceCard` 자체를 상세·공유에 넣지 않는다. `docs/superpowers/plans/2026-07-15-balance-card-integration.md`의 `BalanceChoicePanel`과 `VoteSplitBar`만 연결해 피드 전용 패스·badge가 route로 새지 않게 한다.

**Files:**
- Modify: `mobile/app/question/[id].tsx`
- Modify: `mobile/app/share/[id].tsx`
- Modify: `mobile/__tests__/routing/share-route.test.tsx`
- Create: `mobile/__tests__/routing/question-detail-ui.test.tsx`
- Modify: `mobile/src/design/tokens.ts`
- Create: `mobile/__tests__/design/semantic-colors.test.ts`

**Interfaces:**
- Consumes: `BalanceChoicePanel`, `VoteSplitBar`, `ReasonChips`, report/block/share actions
- Produces: 상세 화면 header, 결과 panel, 이유 칩, 신고·차단, 공유

- [ ] **Step 1: 가짜 소셜 액션 방지 테스트 작성**

```tsx
test('shows only implemented detail actions in phase one', async () => {
  const view = await renderDetail(question);
  expect(view.getByRole('button', { name: '공유하기' })).toBeTruthy();
  expect(view.getByRole('button', { name: '신고하기' })).toBeTruthy();
  expect(view.queryByRole('button', { name: /댓글|공감|저장|비슷한 사람/ })).toBeNull();
});
```

- [ ] **Step 2: 레퍼런스용 placeholder를 넣지 않은 상태와 새 구조가 불일치해 실패하는지 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/routing/question-detail-ui.test.tsx`

Expected: FAIL because the approved detail hierarchy is not present.

- [ ] **Step 3: 상세 화면 구현**

상단 back/share/more, 질문 hero, 실제 결과, 한 줄 근거, 이유 칩, 신고·차단 순서로 구성한다. 댓글 영역 자체를 만들지 않으며 2차 출시 전까지 빈 댓글 박스나 임의 count를 표시하지 않는다.

- [ ] **Step 4: 상세·공유·잘못된 ID 복구 테스트 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/routing/question-detail-ui.test.tsx __tests__/routing/share-route.test.tsx __tests__/routing/invalid-detail-route.test.tsx __tests__/routing/invalid-share-route.test.tsx`

Expected: PASS with retry and back controls preserved.

- [ ] **Step 5: 커밋**

```bash
git add mobile/app/question mobile/app/share mobile/__tests__/routing
git commit -m "feat(detail): align balance detail hierarchy"
```

### Task 6: 질문 작성 화면을 카드형 폼으로 개편

**Files:**
- Create: `mobile/src/features/ask/ui/CategoryChipGroup.tsx`
- Create: `mobile/src/features/ask/ui/SettingRow.tsx`
- Create: `mobile/src/features/ask/domain/questionCategories.ts`
- Create: `mobile/src/features/ask/domain/deadlinePresets.ts`
- Modify: `mobile/src/features/ask/ui/AskScreen.tsx`
- Create: `mobile/__tests__/ask/category-chip-group.test.tsx`
- Create: `mobile/__tests__/ask/deadline-presets.test.ts`
- Modify: `mobile/__tests__/ask/ask-screen.test.tsx`

**Interfaces:**
- Produces: `CategoryChipGroup({ value, options, onChange, disabled })`
- Produces: `SettingRow({ icon, label, value, control, disabled })`
- Produces: canonical `QUESTION_CATEGORIES` and `deadlineToIso('none' | '24h' | '3d' | '7d')`
- Consumes: existing `normalizeCreateQuestion`, repository `create`, notification opt-in flow

- [ ] **Step 1: 단일 선택과 입력 보존 실패 테스트 작성**

```tsx
test('category chips expose one checked option and update selection', async () => {
  const view = await render(<CategoryChipGroup value="일상" options={['일상', '회사', '관계', '여행', '돈', '성장']} onChange={onChange} />);
  expect(view.getByRole('radio', { name: '일상' })).toHaveProp('accessibilityState', { checked: true });
  await fireEvent.press(view.getByRole('radio', { name: '회사' }));
  expect(onChange).toHaveBeenCalledWith('회사');
});
```

- [ ] **Step 2: 새 카테고리 컴포넌트 부재로 실패하는지 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/ask/category-chip-group.test.tsx`

Expected: FAIL on missing module.

- [ ] **Step 3: 작성 화면 구현**

화면 순서는 header → A/B 입력 section → category chips → 선택 설명 → 공개 범위/마감 setting rows → 게시하기다. 카테고리는 seed/분석과 같은 `일상/회사/관계/여행/돈/성장` canonical 값만 쓴다. 마감 기본값은 기존 의미를 보존한 `마감 없음`이며 `24시간/3일/7일` preset 선택 시에만 ISO close time을 만든다. 1차에서는 이미지 업로드를 제공하지 않는다. UGC 미디어는 null이며, 서버 실패 시 기존 입력과 선택된 카테고리·공개 범위·마감 preset을 그대로 유지한다. 권한이 없거나 제출 중이면 category/visibility/deadline control을 실제 native disabled와 접근성 disabled 상태로 잠근다.

- [ ] **Step 4: 작성 전체 회귀 테스트 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/ask/category-chip-group.test.tsx __tests__/ask/deadline-presets.test.ts __tests__/ask/ask-screen.test.tsx __tests__/ask/create-question.test.ts __tests__/session/mutation-guard.test.tsx __tests__/session/ask-route-session.test.tsx __tests__/notifications/notifications.test.ts`

Expected: PASS including duplicate-option prevention, rapid-submit lock, retry, and notification sequencing.

- [ ] **Step 5: 커밋**

```bash
git add mobile/src/features/ask mobile/__tests__/ask
git commit -m "feat(ask): redesign balance creation form"
```

### Task 7: 나의 뇌 지도와 근거 인사이트 구현

**Files:**
- Modify: `mobile/package.json`
- Modify: `mobile/package-lock.json`
- Create: `mobile/src/features/brain/ui/BrainMap.tsx`
- Create: `mobile/src/features/brain/ui/BrainInsightCards.tsx`
- Modify: `mobile/src/features/brain/ui/BrainScreen.tsx`
- Create: `mobile/__tests__/brain/brain-map.test.tsx`
- Modify: `mobile/__tests__/brain/brain-screen.test.tsx`

**Interfaces:**
- Produces: `BrainMap({ summary, openAxis, onAxisPress })`
- Produces: `BrainInsightCards({ summary })`
- Consumes: `BrainSummary`, existing `evidenceIds`, progressive stages `awakening | axes | type | context`

- [ ] **Step 1: 8축 지도와 progressive disclosure 실패 테스트 작성**

```tsx
test('shows eight accessible axes only after the type stage unlocks', async () => {
  const locked = await render(<BrainMap summary={calculateBrain(votes(9))} openAxis={null} onAxisPress={jest.fn()} />);
  expect(locked.queryByLabelText(/가치 축/)).toBeNull();

  const unlocked = await render(<BrainMap summary={calculateBrain(votes(20))} openAxis={null} onAxisPress={jest.fn()} />);
  expect(unlocked.getAllByRole('button')).toHaveLength(8);
});
```

- [ ] **Step 2: 지도 컴포넌트 부재로 실패하는지 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/brain/brain-map.test.tsx`

Expected: FAIL on missing module.

- [ ] **Step 3: SVG 연결선과 접근 가능한 축 노드 구현**

Run first: `cd mobile && npx expo install react-native-svg`

중앙 `나의 선택`과 8개 축을 연결하되 점수는 면적이 아니라 선 강조와 node ring으로 표현한다. 화면 읽기 사용자는 중앙 장식 요소를 건너뛰고 축 버튼 목록을 점수순으로 읽는다. 인사이트 문구는 `최근 선택에서 자유와 효율이 자주 나타났어요`처럼 관찰형으로 제한한다.

`react-native-svg`가 Web 호환 계층을 제공한다는 사실만으로 완료 처리하지 않는다. `BrainMap`은 `Svg/Line/Circle` 같은 지원 요소만 사용하고, Web export 후 실제 Chromium 390×844와 1280×900에서 8개 연결선과 노드가 clipping·좌표 이탈 없이 보이는지 캡처로 확인한다.

- [ ] **Step 4: 뇌 계산·화면·분석 회귀 테스트 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/brain/brain.test.ts __tests__/brain/brain-map.test.tsx __tests__/brain/brain-screen.test.tsx __tests__/analytics/analytics.test.ts && npx expo export --platform web`

Expected: PASS; evidence IDs never enter analytics payloads and the Web bundle contains no SVG compatibility error.

- [ ] **Step 5: 커밋**

```bash
git add mobile/package.json mobile/package-lock.json mobile/src/features/brain mobile/__tests__/brain
git commit -m "feat(brain): add progressive value map"
```

### Task 8: 반응형·접근성·모션 마감

**Files:**
- Modify: `mobile/src/global.css`
- Modify: `mobile/src/design/tokens.ts`
- Modify: UI files changed in Tasks 3–7 only where audit finds a violation
- Modify: `mobile/__tests__/accessibility/interactive-controls.test.tsx`
- Create: `mobile/__tests__/accessibility/ui-refresh-accessibility.test.tsx`
- Create: `mobile/maestro/ui-refresh-primary-flow.yaml`

**Interfaces:**
- Consumes: all Phase 1 screens
- Produces: one automated accessibility contract and one device flow

- [ ] **Step 1: touch target, focus, reduced-motion 실패 테스트 작성**

```tsx
test.each(['A 선택', 'B 선택', '질문 패스', '게시하기', '공유하기'])('%s has a 44 point target', async (label) => {
  const node = renderRefreshFixture().getByRole('button', { name: new RegExp(label) });
  const style = StyleSheet.flatten(node.props.style);
  expect(style.minHeight).toBeGreaterThanOrEqual(44);
  expect(style.minWidth).toBeGreaterThanOrEqual(44);
});
```

- [ ] **Step 2: 누락된 control에서 실패하는지 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/accessibility/ui-refresh-accessibility.test.tsx`

Expected: FAIL on at least one missing minimum target or semantic state before audit fixes.

- [ ] **Step 3: 접근성·반응형 위반만 수정**

Web `:focus-visible`은 3px primary outline을 사용한다. `prefers-reduced-motion: reduce`에서는 transition과 decorative animation을 제거한다. 긴 한국어 선택지는 줄 수를 강제 제한하지 않고 카드가 세로로 확장되게 한다.

- [ ] **Step 4: 전체 접근성 테스트와 Web/Android export 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/accessibility/interactive-controls.test.tsx __tests__/accessibility/ui-refresh-accessibility.test.tsx && npx expo export --platform web && npx expo export --platform android`

Expected: PASS; Web exports 12 routes and Android bundle completes.

- [ ] **Step 5: 커밋**

```bash
git add mobile/src mobile/__tests__/accessibility mobile/maestro
git commit -m "fix(ui): harden responsive accessibility"
```

### Task 9: Phase 1 전체 검증과 출시 게이트

**Files:**
- Modify: `docs/superpowers/reports/2026-07-14-gate-1-user-test.md`
- Create: `docs/superpowers/reports/2026-07-15-ui-refresh-review.md`
- Modify: `mobile/README.md`

**Interfaces:**
- Consumes: Phase 1 implementation and existing Gate 1 procedure
- Produces: review evidence, known gaps, Phase 2 go/no-go decision

- [ ] **Step 1: 자동 검증 실행**

Run:

```powershell
cd mobile
npx supabase db reset
npx supabase test db
npx supabase db lint
npm run test:upgrade
npm run verify
npx expo export --platform web
npx expo export --platform android
```

Expected: all pgTAP tests including new 012 contracts pass, DB lint returns zero findings, all Jest suites pass, Expo Doctor reports all checks passing, and both exports succeed. 고정 테스트 개수는 새 assertion 추가로 변하므로 성공 기준으로 사용하지 않는다.

- [ ] **Step 2: 실제 화면 검토**

검토 크기:

- iPhone-equivalent: 390×844
- small Android: 360×800
- large text: 200%
- Web narrow: 390×844
- Web desktop: 1280×900 with one 720px centered app shell containing header, content, and tabs

각 크기에서 피드 첫 질문, 투표 후 지속되는 인라인 결과, compact list, 작성 입력, 뇌 지도, 상세 공유를 캡처한다. Web desktop에서는 헤더·본문·탭 좌우 경계가 동일해야 한다. 탭 왕복 후 피드 위치가 유지되어야 하며 clipping, horizontal scroll, 가려진 CTA, 겹친 bottom tab, SVG 연결선 이탈이 없어야 한다.

- [ ] **Step 3: 대표 흐름 실행**

Run when a device or emulator is available:

```bash
maestro test maestro/ui-refresh-primary-flow.yaml
maestro test maestro/vote-create-brain.yaml
maestro test maestro/shared-question.yaml
```

Expected: 첫 질문 투표 → 결과 확인 → 일반 질문 선택 → 질문 작성 → 나의 뇌 진행 → 공유 딥링크 복귀가 중단 없이 완료된다.

- [ ] **Step 4: 사용자 검증 기준 기록**

Phase 1 통과 기준:

- 15명 중 12명 이상이 설명 없이 첫 투표 완료
- 15명 중 10명 이상이 자발적으로 10개 이상 투표
- 첫 투표 중앙값 7초 이하
- 10개 투표 완료율이 기존 Gate 1 기준보다 악화되지 않음
- 질문 작성 완료율 70% 이상
- 나의 뇌가 전문 심리 진단으로 오해된 참가자 0명

- [ ] **Step 5: 최종 검토 커밋**

```bash
git add mobile/README.md docs/superpowers/reports
git commit -m "docs(ui): record refresh verification"
```

## Phase 2 Social Expansion Gate

Phase 1의 사용자 검증을 통과한 뒤에만 별도 계획을 작성한다. 아래 항목은 이번 계획에서 구현하지 않는다.

1. **댓글:** pagination, 작성·삭제, 신고, 숨김, rate limit, 작성자 차단, 운영 moderation queue가 함께 준비되어야 한다.
2. **공감과 저장:** 사용자별 unique constraint, 낙관적 UI rollback, 비공개 저장 목록, 실제 count 집계가 필요하다.
3. **검색과 랭킹:** 검색 품질, 인기 점수 시간 감쇠, 신규 질문 최소 노출, 조작 방지 정책이 필요하다.
4. **유사 사용자:** 최소 공통 투표 수, 비공개 기본값, 프로필 공개 동의, 연령·직업 같은 추정 정보 비노출 원칙이 필요하다.
5. **소셜 알림:** opt-in, 빈도 제한, 신고·차단 반영, 계정 삭제와 token revocation이 필요하다.

Phase 2 계획 시작 조건:

- Phase 1 검증 보고서 승인
- 운영 가능한 새 Supabase 프로젝트 연결
- 계정·데이터 삭제 UI 완료
- 댓글 moderation SLA와 관리자 책임자 지정
- 개인정보 처리 문구와 공개 프로필 동의 UX 승인

## Self-Review Result

- 레퍼런스의 네 화면은 피드, 상세, 작성, 나의 뇌 작업에 모두 연결했다.
- 오늘의 이미지 필수와 일반 질문 이미지 선택 정책을 Task 1.5, Task 2, Task 3에 걸쳐 DB 읽기 계약부터 UI fallback까지 연결했다.
- 의견서 중 실제 코드로 확인된 reset/800ms 전환/Web 셸/SVG 위험만 반영하고 Phase 1과 충돌하는 UGC 이미지 RPC 확장은 제외했다.
- 현재 없는 소셜 기능은 가짜 UI 없이 Phase 2로 분리했다.
- 기존 익명·오프라인·재시도·공유·신고·분석 회귀 검증을 각 작업에 포함했다.
- 모든 구현 작업은 실패 테스트 → 최소 구현 → 회귀 테스트 → 커밋 순서를 따른다.
