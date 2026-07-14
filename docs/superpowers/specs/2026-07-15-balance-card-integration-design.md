# Balance Card Integration Design

**Date:** 2026-07-15

**Status:** Proposed for implementation planning

**Scope:** Task 3 공통 카드 구현과 이미 완료된 standalone Task 5 상세·공유 화면의 후속 통합

## 의견서 검증 판정

`2026-07-15-balance-card-integration-design-opinion.md`를 현재 TypeScript 구현, 로컬 결과 계산, Supabase RPC·pgTAP 계약, React Native 0.86 및 React Native Web 0.21 접근성 동작과 대조했다.

- **수용:** `selected` 상태는 선택 항목에 2px `colors.primary` 테두리, 옅은 primary 배경, 체크 아이콘과 `선택됨` 텍스트를 함께 표시한다. 비선택 항목은 임의로 `opacity: 0.6`을 적용하지 않으며 실제 `disabled`일 때만 disabled 스타일을 쓴다.
- **수용:** discriminated union 구현은 최상위 매개변수에서 `onVote`·`disabled`를 구조분해하지 않고 `props.mode`로 좁힌 뒤 votable 전용 필드를 읽는다.
- **부분 수용:** read-only 카드는 하나의 명시적 `accessibilityLabel`로 질문·A·B·카테고리를 묶는다. `summary`는 앱 현재 상태의 빠른 요약 역할이므로 질문 카드에는 사용하지 않고 정적 `text` 의미를 사용한다.
- **부분 수용:** 잘못된 투표 비율이 전체 화면 오류로 번지지 않게 결과 막대 안에서 비차단 fallback을 표시하고, 무투표 마감 결과 `0/0`은 `아직 투표가 없어요` 상태로 분리한다. 현재 로컬 계산과 Supabase RPC가 `percentB = 100 - percentA`를 보장하므로 의견서의 임의 `95–105` 재정규화는 적용하지 않는다.
- **기각:** Web `Pressable`에 `focusable={true}`를 강제하지 않는다. React Native Web 0.21의 `Pressable`은 활성 상태에서 `tabIndex=0`을 만들고 `focusable`은 deprecated이므로, button 역할·disabled 상태와 실제 키보드 포커스 링을 테스트한다.

## 목적

피드, 상세, 공유 화면의 A/B 선택 시각 구조를 하나의 작은 공통 단위로 통일한다. 피드 전용 행동인 `패스`를 상세·공유에 노출하지 않고, 상세의 읽기 전용 상태와 공유의 오프라인 투표 상태를 그대로 보존한다.

## 확정 접근

`BalanceChoicePanel`을 시각·접근성 기반 컴포넌트로 만들고 화면별 wrapper가 각자의 행동과 상태를 소유한다.

```text
BalanceChoicePanel
├─ HeroBalanceCard: 오늘의 badge, media, 투표, 패스, inline result
├─ QuestionDetailRoute: read-only 선택지, closed result, 안전 도구
└─ ShareRoute: 투표, pending queue, retry, ownership conflict, result

VoteSplitBar
├─ HeroBalanceCard
├─ QuestionDetailRoute (closedResult만)
├─ ShareRoute (VoteReceipt 이후만)
└─ ResultOverlay 호환 wrapper
```

`HeroBalanceCard` 자체를 상세·공유에서 직접 재사용하지 않는다. `HeroBalanceCard`의 `onSkip`과 오늘의 badge는 피드 의미이므로, 이를 optional prop이나 `mode` 분기로 확장하면 화면별 책임이 섞인다.

## 컴포넌트 계약

### `BalanceChoicePanel`

```ts
interface BalanceChoicePanelProps {
  question: Question;
  mode: 'readOnly' | 'votable';
  disabled?: boolean;
  selected?: VoteChoice | null;
  onVote?: (choice: VoteChoice) => boolean | void;
  showMedia?: boolean;
  accessibilityLabel?: string;
}
```

- 질문 제목과 A/B 선택지 순서를 일관되게 렌더링한다.
- `readOnly`에서는 선택지를 버튼으로 만들지 않고 읽기 가능한 그룹으로 표시한다.
- `votable`에서는 A/B만 버튼이 되며 각각 `A 선택: ...`, `B 선택: ...` 이름을 제공한다.
- `selected` 선택지는 2px primary 테두리, 옅은 primary 배경, 체크 아이콘과 `선택됨` 텍스트를 함께 사용한다. 비선택 선택지는 disabled가 아닌 한 원래 대비와 조작 가능성을 유지한다.
- `mode='votable'`일 때 `onVote`가 없으면 개발 환경에서 명확히 실패하도록 타입을 discriminated union으로 구현한다.
- 구현 함수는 `props` 전체를 받고 `props.mode === 'votable'` 분기 안에서만 `onVote`, `disabled`, `selected`를 구조분해한다.
- `readOnly` 루트는 `accessible`, 정적 text 역할, `질문: …, A: …, B: …, 카테고리: …` 형식의 명시 라벨을 제공하며 자식 선택지를 접근 가능한 버튼으로 만들지 않는다.
- `showMedia`가 `true`이고 유효한 미디어가 있을 때만 미디어를 표시한다. 미디어가 없거나 유효하지 않으면 Task 2의 카테고리 fallback을 사용한다. Task 2가 아직 미완료인 동안에는 텍스트 선택지만 렌더링하고 임시 이미지 URL을 만들지 않는다.
- 패스, 결과, 신고, 공유, 네트워크 오류를 소유하지 않는다.

실제 TypeScript 타입은 잘못된 조합을 막기 위해 다음 union을 사용한다.

```ts
type BalanceChoicePanelProps =
  | {
      question: Question;
      mode: 'readOnly';
      showMedia?: boolean;
      accessibilityLabel?: string;
    }
  | {
      question: Question;
      mode: 'votable';
      disabled: boolean;
      selected?: VoteChoice | null;
      onVote(choice: VoteChoice): boolean | void;
      showMedia?: boolean;
      accessibilityLabel?: string;
    };
```

### `VoteSplitBar`

```ts
interface VoteSplitBarProps {
  percentA: number;
  percentB: number;
  selected?: VoteChoice | null;
  label?: string;
}
```

- 서버 또는 repository가 반환한 실제 결과만 소비한다.
- `percentA`와 `percentB`는 정수이고 각각 0–100 범위이며 합이 정확히 100이어야 한다. 유효하지 않은 쌍은 반올림하거나 재정규화하지 않고 `결과를 표시할 수 없어요`라는 비차단 fallback으로 대체하며 개발 환경에는 진단 로그를 남긴다.
- `countA + countB === 0`인 마감 질문은 `VoteSplitBar`를 호출하지 않고 `아직 투표가 없어요`를 표시한다. 이는 현재 `get_closed_question_result`가 반환할 수 있는 유효한 `0/0` 빈 결과다.
- 화면 읽기 이름은 `A 64퍼센트, B 36퍼센트`이며 선택이 있으면 `내가 선택한 답 A`를 덧붙인다.
- 색상만으로 선택을 구분하지 않고 텍스트·아이콘 상태를 함께 제공한다.

### `HeroBalanceCard`

```ts
interface HeroBalanceCardProps {
  question: Question;
  result: VoteResult | null;
  disabled: boolean;
  onVote(choice: VoteChoice): boolean;
  onSkip(): void;
  onNext(): void;
}
```

- `BalanceChoicePanel mode='votable'`을 조합한다.
- `question.isDaily === true`일 때만 오늘의 질문 badge를 표시하고, 피드 전용 `질문 패스`를 소유한다.
- 일반 피드 질문의 `category`와 선택 맥락인 `description`을 유지한다.
- `result === null`이면 비율을 렌더링하지 않는다.
- 결과는 `VoteSplitBar`로 inline 유지하며 타이머로 사라지거나 자동으로 다음 질문으로 이동하지 않는다. 결과 상태에서는 명시적인 `onNext` CTA를 제공한다.

### `ResultOverlay`

기존 import를 깨지 않도록 한 단계 동안 유지한다. 내부에서는 `VoteSplitBar`만 렌더링하며 absolute overlay나 자동 전환을 포함하지 않는다. 모든 소비자가 새 컴포넌트로 전환된 뒤 별도 정리 작업에서 제거할 수 있다.

## 화면별 데이터 흐름

### 피드

1. `PlayScreen`이 현재 질문과 repository 투표 상태를 소유한다.
2. `HeroBalanceCard`가 사용자 선택을 `onVote`로 전달한다.
3. repository 성공 응답만 `VoteSplitBar`로 표시한다.
4. 오프라인 큐 저장 메시지는 결과처럼 위장하지 않는다.
5. 성공 후 800ms 자동 `advance()`를 호출하지 않고, 사용자의 명시적인 다음 질문 동작에서만 한 번 전환한다.

### 상세

1. active 질문은 `BalanceChoicePanel mode='readOnly'`만 표시한다.
2. `getClosedResult`가 반환한 마감 질문에서만 `VoteSplitBar`를 표시한다.
3. 사용자 선택값을 신뢰성 있게 알 수 없으므로 closed detail의 `selected`는 기본적으로 null이다.
4. 한 줄 인사이트, 이유 칩, 신고·차단·공유와 딥링크 복구는 현재 구현을 유지한다.

### 공유

1. `ShareRoute`가 `BalanceChoicePanel mode='votable'`에 기존 `vote()` callback을 전달한다.
2. pending action enqueue, action ID 재사용, 완료 receipt 보존, owner quarantine는 route가 계속 소유한다.
3. pending vote가 있으면 해당 선택의 selected 상태를 표시하지만 실제 비율은 숨긴다.
4. `VoteReceipt`가 확인된 뒤에만 `VoteSplitBar`를 표시한다.
5. 결과 확인 후 `다른 밸런스도 보기` 행동은 유지한다.

## 오류·상태 원칙

- 투표 전 또는 pending 상태에서는 결과 비율을 공개하지 않는다.
- disabled 상태는 native `disabled`와 `accessibilityState.disabled`를 함께 설정한다.
- 활성 `Pressable`은 button 역할로 Web 키보드 탭 순서에 들어가야 하고 disabled 선택지는 탭 순서에서 제외되어야 한다. deprecated `focusable` prop은 추가하지 않는다.
- 빠른 연속 입력은 기존 submission/vote lock으로 한 번만 처리한다.
- repository 교체, 사용자 교체, route ID 변경 후 이전 질문·결과를 노출하지 않는다.
- 잘못된 ID, 마감·숨김 질문, 네트워크 오류의 retry/back 제어는 공통 카드 안으로 이동하지 않는다.
- 공유 route의 분석 이벤트에는 선택지 본문이나 설명을 포함하지 않는다.

## 접근성·반응형

- 모든 투표·패스 control은 최소 44×44pt다.
- 읽기 순서는 질문 → A → B → 결과 → 보조 행동이다.
- read-only 선택지는 버튼이나 disabled 버튼으로 가장하지 않는다.
- 긴 한국어 선택지는 줄 수를 제한하지 않고 카드 높이가 확장된다.
- 200% 글자 크기에서 고정 높이, absolute result overlay, 가려진 CTA가 없어야 한다.
- Web 390×844와 1280×900에서 horizontal scroll 없이 동작해야 한다.

## 테스트 전략

1. `BalanceChoicePanel`: read-only/votable semantic 차이, 명시적인 grouped label, A/B 순서, 선택 체크·텍스트·테두리, disabled, 긴 문구, union narrowing을 검증한다.
2. `VoteSplitBar`: 정확한 비율, 선택 announcement, 무투표 상태, 잘못된 계약값의 비차단 fallback, 임의 보정 금지를 검증한다.
3. `HeroBalanceCard`: 결과 사전 노출 금지, 패스가 hero에만 존재, inline result 유지, 빠른 연속 입력을 검증한다.
4. 상세: active 결과 비공개, closed result 표시, 기존 공유·신고·차단·뒤로가기를 검증한다.
5. 공유: action ID 재사용, restart 복구, owner quarantine, provider race, pending 결과 비공개를 검증한다.
6. 전체: TypeScript, 200% 접근성 계약, Web Tab/Enter/Space 및 `:focus-visible`, 전체 Jest, Expo Doctor, Web export 12 routes를 실행한다.

## 마이그레이션 순서

1. `BalanceChoicePanel`과 단위 테스트
2. `VoteSplitBar`와 `ResultOverlay` 호환 wrapper
3. `HeroBalanceCard` 및 `QuestionCard` 호환 전환
4. `PlayScreen` 연결은 기존 Task 4 상태 보존 작업과 함께 수행
5. 상세 화면 read-only/closed-result 통합
6. 공유 화면 투표/pending/result 통합
7. 전체 회귀 후 중복 상세·공유 카드 스타일 제거

## 범위 제외

- 댓글, 공감, 저장, 유사 사용자, 검색, 랭킹
- 사용자 질문 이미지 업로드
- active 상세 결과를 위한 새 repository/RPC
- 의미 없는 top `more` 버튼
- Task 4의 피드 스크롤 상태 구현 자체

## 완료 기준

- 피드·상세·공유가 동일한 A/B 선택 기반 컴포넌트를 사용한다.
- 패스는 피드 hero에만 존재한다.
- active 상세와 투표 전 공유 화면에 결과가 노출되지 않는다.
- 기존 공유 큐·재시도·분석·moderation 회귀 테스트가 모두 통과한다.
- TypeScript, 전체 Jest, Expo Doctor 20/20, Web 12 routes export가 통과한다.
