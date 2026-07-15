# Balance Card Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 피드·상세·공유 화면이 동일한 A/B 선택 기반을 사용하도록 통합하면서 투표 전 결과 비공개, 공유 오프라인 큐, 상세 안전 도구를 그대로 보존한다.

**Architecture:** `BalanceChoicePanel`은 A/B 시각·접근성만 담당하고 `HeroBalanceCard`, 상세 route, 공유 route가 각자의 행동과 비동기 상태를 소유한다. `VoteSplitBar`는 검증된 실제 결과만 표시하며 무투표와 잘못된 결과는 차단 오류가 아닌 명시적인 비결과 상태로 처리한다. 기존 `QuestionCard`와 `ResultOverlay`는 한 단계 동안 호환 wrapper로 남긴다.

**Tech Stack:** Expo SDK 57, React Native 0.86, React Native Web 0.21, Expo Router, TypeScript 6, Jest, React Native Testing Library

## Global Constraints

- `HeroBalanceCard`의 오늘의 badge와 패스는 피드에만 존재한다.
- active 상세와 투표 전·pending 공유 화면에는 퍼센트를 노출하지 않는다.
- 현재 local 계산과 Supabase RPC의 `percentB = 100 - percentA` 계약을 유지하며 95–105 같은 임의 재정규화는 추가하지 않는다.
- 마감 결과의 `countA + countB === 0`은 오류가 아니라 `아직 투표가 없어요` 상태다.
- 선택 표시는 색상만 사용하지 않고 2px primary 테두리, 체크 아이콘, `선택됨` 텍스트를 함께 제공한다.
- read-only 선택지는 버튼이나 disabled 버튼으로 가장하지 않고 하나의 명시적인 정적 접근성 라벨을 제공한다.
- Web `Pressable`에는 deprecated `focusable`을 추가하지 않는다. button 역할, disabled 탭 제외, Tab/Enter/Space, `:focus-visible`을 실제로 검증한다.
- 모든 터치 대상은 최소 44×44pt이고 긴 한국어와 200% 글자 크기에서 고정 높이·잘림을 만들지 않는다.
- 공유의 pending action ID 재사용, 완료 receipt, owner quarantine, provider race, 분석 payload 계약을 변경하지 않는다.
- 의견서 원본 `docs/superpowers/specs/2026-07-15-balance-card-integration-design-opinion.md`는 읽기 전용으로 유지한다.

## Opinion Review Disposition

- **수용:** selected 시각 규칙, `props.mode` 이후 union narrowing.
- **부분 수용:** read-only grouping은 채택하지만 질문 카드에 부적절한 `summary` 역할 대신 정적 text 의미를 사용한다.
- **부분 수용:** 잘못된 비율은 비차단 fallback으로 처리하지만 현재 생산자 계약을 숨기는 95–105 자동 보정은 하지 않는다.
- **기각:** React Native Web 0.21에서 deprecated인 `focusable={true}` 강제. 활성 `Pressable`은 자체적으로 `tabIndex=0`을 생성한다.

검증 근거:

- 로컬: `mobile/src/features/play/domain/result.ts`는 `percentB = 100 - percentA`로 계산한다.
- DB: `mobile/supabase/migrations/202607140002_feed_and_vote_functions.sql`과 `202607140007_notification_review_fixes.sql`도 B를 `100 - A`로 반환하며, `mobile/supabase/tests/database/functions.test.sql`이 합계 100을 검증한다. 단, 무투표 마감은 의도적으로 `0/0`을 반환한다.
- 공식: [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)는 React Native 0.86과 React Native Web 0.21 조합을 명시한다.
- 공식: [React Native View accessibility](https://reactnative.dev/docs/view.html)에서 `summary`는 앱 현재 상태의 빠른 요약 역할이며, `accessible`은 명시 라벨을 가진 하나의 접근성 요소를 만든다.
- 공식: [React Native Web 0.21 accessibility](https://necolas.github.io/react-native-web/docs/accessibility/)는 Web 포커스에 `tabIndex`를 사용하고 native `focusable`을 사용하지 말라고 명시하며, [Pressable](https://necolas.github.io/react-native-web/docs/pressable/)은 키보드 상호작용을 지원한다.

## File Structure

### Create

- `mobile/src/features/play/ui/BalanceChoicePanel.tsx`: read-only/votable A/B 프리미티브
- `mobile/src/features/play/ui/VoteSplitBar.tsx`: 결과 검증과 접근 가능한 비율 막대
- `mobile/src/features/play/ui/HeroBalanceCard.tsx`: 피드 전용 badge·패스·인라인 결과 조합
- `mobile/__tests__/play/balance-choice-panel.test.tsx`: union별 의미·선택 상태 테스트
- `mobile/__tests__/play/vote-split-bar.test.tsx`: 실제 비율·fallback 테스트
- `mobile/__tests__/play/hero-balance-card.test.tsx`: 피드 전용 행동과 결과 공개 테스트

### Modify

- `mobile/src/features/play/ui/QuestionCard.tsx`: `HeroBalanceCard` 호환 wrapper
- `mobile/src/features/play/ui/ResultOverlay.tsx`: `VoteSplitBar` 호환 wrapper
- `mobile/src/features/play/ui/PlayScreen.tsx`: hero에 결과와 기존 callback 연결
- `mobile/app/question/[id].tsx`: read-only panel과 마감 결과 통합
- `mobile/app/share/[id].tsx`: votable panel과 receipt 결과 통합
- `mobile/__tests__/play/question-card.test.tsx`: wrapper 회귀
- `mobile/__tests__/play/play-screen.test.tsx`: 투표 전 비공개·인라인 지속 결과
- `mobile/__tests__/routing/question-detail-ui.test.tsx`: active/closed/empty 상세
- `mobile/__tests__/routing/share-route.test.tsx`: pending 선택 표시와 receipt 결과
- `mobile/__tests__/accessibility/interactive-controls.test.tsx`: Web focus 계약

---

### Task 1: `BalanceChoicePanel` 계약 고정

**Files:**
- Create: `mobile/src/features/play/ui/BalanceChoicePanel.tsx`
- Create: `mobile/__tests__/play/balance-choice-panel.test.tsx`

**Interfaces:**
- Consumes: `Question`, `VoteChoice`, `colors`, `radius`, `spacing`
- Produces: `BalanceChoicePanel(props: BalanceChoicePanelProps)`
- Produces: exported discriminated union `BalanceChoicePanelProps`

- [ ] **Step 1: 실패하는 의미·선택 상태 테스트 작성**

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { BalanceChoicePanel } from '@/src/features/play/ui/BalanceChoicePanel';
import type { Question } from '@/src/features/play/domain/question';

const question: Question = {
  id: '00000000-0000-4000-8000-000000000001', optionA: '바로 자기', optionB: '두 시간 쉬기',
  description: '퇴근 후 선택', category: '일상', visibility: 'public', closesAt: null,
  isDaily: true, stage: 'active', weightsA: {}, weightsB: {},
};

test('groups a read-only question without exposing fake buttons', () => {
  const view = render(<BalanceChoicePanel question={question} mode="readOnly" />);
  expect(view.getByLabelText('질문: 퇴근 후 선택, A: 바로 자기, B: 두 시간 쉬기, 카테고리: 일상')).toBeTruthy();
  expect(view.queryAllByRole('button')).toHaveLength(0);
});

test('marks the selected choice with semantic and visible text', () => {
  const onVote = jest.fn();
  const view = render(<BalanceChoicePanel question={question} mode="votable" disabled selected="A" onVote={onVote} />);
  const selected = view.getByRole('button', { name: 'A 선택: 바로 자기, 선택됨' });
  expect(selected).toHaveProp('accessibilityState', { disabled: true, selected: true });
  expect(view.getByText('선택됨')).toBeTruthy();
  fireEvent.press(selected);
  expect(onVote).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: 새 모듈 부재로 실패하는지 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/play/balance-choice-panel.test.tsx`

Expected: FAIL with `Cannot find module .../BalanceChoicePanel`.

- [ ] **Step 3: discriminated union과 최소 렌더링 구현**

```tsx
export type BalanceChoicePanelProps =
  | { question: Question; mode: 'readOnly'; showMedia?: boolean; accessibilityLabel?: string }
  | { question: Question; mode: 'votable'; disabled: boolean; selected?: VoteChoice | null; onVote(choice: VoteChoice): boolean | void; showMedia?: boolean; accessibilityLabel?: string };

export function BalanceChoicePanel(props: BalanceChoicePanelProps) {
  const { question } = props;
  if (props.mode === 'readOnly') {
    const label = props.accessibilityLabel ?? `질문: ${question.description ?? `${question.optionA} 대 ${question.optionB}`}, A: ${question.optionA}, B: ${question.optionB}, 카테고리: ${question.category}`;
    return <View accessible accessibilityLabel={label} accessibilityRole="text" style={styles.panel}>
      <Text style={styles.title}>{question.description ?? `${question.optionA} vs ${question.optionB}`}</Text>
      <View style={[styles.choice, styles.readOnlyChoice]}><Text style={styles.code}>A</Text><Text style={styles.choiceText}>{question.optionA}</Text></View>
      <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.vs}>VS</Text>
      <View style={[styles.choice, styles.readOnlyChoice]}><Text style={styles.code}>B</Text><Text style={styles.choiceText}>{question.optionB}</Text></View>
    </View>;
  }
  const { disabled, onVote, selected } = props;
  return (
    <View style={styles.panel}>
      <ChoiceButton choice="A" text={question.optionA} disabled={disabled} selected={selected === 'A'} onVote={onVote} />
      <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.vs}>VS</Text>
      <ChoiceButton choice="B" text={question.optionB} disabled={disabled} selected={selected === 'B'} onVote={onVote} />
    </View>
  );
}

function ChoiceButton({ choice, text, disabled, selected, onVote }: {
  choice: VoteChoice; text: string; disabled: boolean; selected: boolean;
  onVote(choice: VoteChoice): boolean | void;
}) {
  return <Pressable
    accessibilityLabel={`${choice} 선택: ${text}${selected ? ', 선택됨' : ''}`}
    accessibilityRole="button"
    accessibilityState={{ disabled, selected }}
    disabled={disabled}
    onPress={() => onVote(choice)}
    style={[styles.choice, selected && styles.selected, disabled && styles.disabled]}
  >
    <Text style={styles.code}>{choice}</Text><Text style={styles.choiceText}>{text}</Text>
    {selected ? <Text style={styles.selectedText}>✓ 선택됨</Text> : null}
  </Pressable>;
}

const styles = StyleSheet.create({
  panel: { gap: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  choice: { borderColor: colors.border, borderRadius: radius.card, borderWidth: 1, gap: spacing.xs, minHeight: 96, padding: spacing.md },
  readOnlyChoice: { backgroundColor: colors.surface },
  selected: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 2 },
  disabled: { opacity: 0.55 },
  code: { color: colors.muted, fontWeight: '800' },
  choiceText: { color: colors.text, fontSize: 20, fontWeight: '700' },
  selectedText: { color: colors.primary, fontWeight: '800' },
  vs: { color: colors.muted, fontWeight: '800', textAlign: 'center' },
});
```

파일 상단에서 `Pressable`, `StyleSheet`, `Text`, `View`, 디자인 토큰과 `Question`, `VoteChoice`를 import한다. 비선택 항목에는 opacity를 낮추지 않는다. `showMedia`는 유효한 Task 2 미디어가 연결되기 전까지 레이아웃 분기만 예약하고 임시 URL을 생성하지 않는다.

- [ ] **Step 4: 단위 테스트와 TypeScript 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/play/balance-choice-panel.test.tsx && npm run typecheck`

Expected: PASS; read-only branch에서 `onVote`·`disabled` 접근 오류가 없다.

- [ ] **Step 5: 커밋**

```bash
git add mobile/src/features/play/ui/BalanceChoicePanel.tsx mobile/__tests__/play/balance-choice-panel.test.tsx
git commit -m "feat(ui): add shared balance choice panel"
```

### Task 2: `VoteSplitBar`의 유효·빈·잘못된 결과 경계 구현

**Files:**
- Create: `mobile/src/features/play/ui/VoteSplitBar.tsx`
- Create: `mobile/__tests__/play/vote-split-bar.test.tsx`
- Modify: `mobile/src/features/play/ui/ResultOverlay.tsx`

**Interfaces:**
- Produces: `isValidVoteSplit(percentA: number, percentB: number): boolean`
- Produces: `VoteSplitBar({ percentA, percentB, selected, label })`
- Consumes: only non-empty result percentages; callers gate `countA + countB === 0`

- [ ] **Step 1: 정확한 결과와 비차단 fallback 실패 테스트 작성**

```tsx
test('announces an exact selected result', () => {
  const view = render(<VoteSplitBar percentA={64} percentB={36} selected="A" label="다수파" />);
  expect(view.getByLabelText('A 64퍼센트, B 36퍼센트, 내가 선택한 답 A')).toBeTruthy();
});

test.each([[50, 49], [-1, 101], [50.5, 49.5]])('does not normalize an invalid pair %p/%p', (percentA, percentB) => {
  const view = render(<VoteSplitBar percentA={percentA} percentB={percentB} />);
  expect(view.getByText('결과를 표시할 수 없어요')).toBeTruthy();
  expect(view.queryByText('50%')).toBeNull();
});
```

- [ ] **Step 2: 모듈 부재로 실패 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/play/vote-split-bar.test.tsx`

Expected: FAIL on missing module.

- [ ] **Step 3: 검증과 비율 막대 구현**

```tsx
interface VoteSplitBarProps {
  percentA: number;
  percentB: number;
  selected?: VoteChoice | null;
  label?: string;
}

export function isValidVoteSplit(percentA: number, percentB: number) {
  return Number.isInteger(percentA) && Number.isInteger(percentB)
    && percentA >= 0 && percentA <= 100 && percentB >= 0 && percentB <= 100
    && percentA + percentB === 100;
}

export function VoteSplitBar({ percentA, percentB, selected = null, label }: VoteSplitBarProps) {
  if (!isValidVoteSplit(percentA, percentB)) {
    if (__DEV__) console.warn('Invalid vote split', { percentA, percentB });
    return <Text accessibilityRole="alert" style={styles.fallback}>결과를 표시할 수 없어요</Text>;
  }
  const accessibilityLabel = `A ${percentA}퍼센트, B ${percentB}퍼센트${selected ? `, 내가 선택한 답 ${selected}` : ''}`;
  return (
    <View accessible accessibilityLabel={accessibilityLabel} accessibilityRole="summary" style={styles.container}>
      <View style={styles.labels}><Text>{percentA}%</Text><Text>{percentB}%</Text></View>
      <View style={styles.track}><View style={[styles.a, { flex: percentA }]} /><View style={[styles.b, { flex: percentB }]} /></View>
      {label ? <Text style={styles.resultLabel}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { borderRadius: radius.button, flexDirection: 'row', height: 12, overflow: 'hidden' },
  a: { backgroundColor: colors.optionA },
  b: { backgroundColor: colors.optionB },
  resultLabel: { color: colors.primary, fontWeight: '700', textAlign: 'center' },
  fallback: { color: colors.muted, textAlign: 'center' },
});
```

`0/100`과 `100/0`에서 0폭 segment가 레이아웃을 깨지 않도록 track에 고정 높이만 두고 segment에 최소 폭을 주지 않는다. `ResultOverlay`는 투표 성공 뒤의 `VoteResult`만 받으므로 그대로 `VoteSplitBar`를 렌더링한다. 무투표 `0/0` 분기는 `ClosedQuestionResult`를 받는 상세 route에서 처리한다.

- [ ] **Step 4: 결과·기존 domain 테스트 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/play/vote-split-bar.test.tsx __tests__/play/result.test.ts`

Expected: PASS; `buildVoteResult`와 RPC의 합계 100 계약을 변경하지 않는다.

- [ ] **Step 5: 커밋**

```bash
git add mobile/src/features/play/ui/VoteSplitBar.tsx mobile/src/features/play/ui/ResultOverlay.tsx mobile/__tests__/play/vote-split-bar.test.tsx
git commit -m "feat(ui): add resilient vote split bar"
```

### Task 3: 피드 hero와 호환 wrapper 연결

**Files:**
- Create: `mobile/src/features/play/ui/HeroBalanceCard.tsx`
- Create: `mobile/__tests__/play/hero-balance-card.test.tsx`
- Modify: `mobile/src/features/play/ui/QuestionCard.tsx`
- Modify: `mobile/src/features/play/ui/PlayScreen.tsx`
- Modify: `mobile/__tests__/play/question-card.test.tsx`
- Modify: `mobile/__tests__/play/play-screen.test.tsx`

**Interfaces:**
- Produces: `HeroBalanceCard({ question, result, disabled, onVote, onSkip, onNext })`
- Consumes: `BalanceChoicePanel`, `VoteSplitBar`, existing vote/skip locks

- [ ] **Step 1: 피드 전용 행동과 비공개 테스트 작성**

```tsx
test('keeps results hidden before repository success', () => {
  const view = render(<HeroBalanceCard question={question} result={null} disabled={false} onVote={jest.fn()} onSkip={jest.fn()} onNext={jest.fn()} />);
  expect(view.getByText('오늘의 밸런스')).toBeTruthy();
  expect(view.getByRole('button', { name: '질문 패스' })).toBeTruthy();
  expect(view.queryByText(/%/)).toBeNull();
});

test('keeps the result inline until explicit navigation', () => {
  const result = { selected: 'A' as const, countA: 7, countB: 3, percentA: 70, percentB: 30, label: '다수파' as const };
  const view = render(<HeroBalanceCard question={question} result={result} disabled onVote={jest.fn()} onSkip={jest.fn()} onNext={jest.fn()} />);
  expect(view.getByLabelText('A 70퍼센트, B 30퍼센트, 내가 선택한 답 A')).toBeTruthy();
});
```

- [ ] **Step 2: 새 hero 부재로 실패 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/play/hero-balance-card.test.tsx`

Expected: FAIL on missing module.

- [ ] **Step 3: hero와 기존 이름 호환 구현**

```tsx
interface HeroBalanceCardProps {
  question: Question;
  result: VoteResult | null;
  disabled: boolean;
  onVote(choice: VoteChoice): boolean;
  onSkip(): void;
  onNext(): void;
}

export function HeroBalanceCard({ question, result, disabled, onVote, onSkip, onNext }: HeroBalanceCardProps) {
  return (
    <View style={styles.card}>
      {question.isDaily ? <View accessible accessibilityLabel="오늘의 밸런스" style={styles.badge}><Text style={styles.badgeText}>오늘의 밸런스</Text></View> : null}
      <Text>{question.category}</Text>
      {question.description ? <Text>{question.description}</Text> : null}
      <BalanceChoicePanel question={question} mode="votable" disabled={disabled} selected={result?.selected} onVote={onVote} showMedia={question.isDaily} />
      {result ? <VoteSplitBar percentA={result.percentA} percentB={result.percentB} selected={result.selected} label={result.label} /> : null}
      {result
        ? <Pressable accessibilityLabel="다음 질문" accessibilityRole="button" onPress={onNext}><Text>다음 질문</Text></Pressable>
        : <Pressable accessibilityLabel="질문 패스" accessibilityRole="button" disabled={disabled} onPress={onSkip} style={styles.skip}><Text>패스</Text></Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, gap: spacing.md, padding: spacing.lg },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.button, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  badgeText: { color: colors.primary, fontWeight: '800' },
  skip: { alignItems: 'center', alignSelf: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44, paddingHorizontal: spacing.md },
});
```

`QuestionCard`는 동일한 기존 props를 받아 `HeroBalanceCard result={null}`을 렌더링한다. `PlayScreen`은 직접 `HeroBalanceCard`에 현재 `result`, `vote`, `skip`, lock 상태를 전달하고 기존 800ms `advance()` 타이머를 만들지 않는다.

- [ ] **Step 4: 피드 회귀 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/play/hero-balance-card.test.tsx __tests__/play/question-card.test.tsx __tests__/play/play-screen.test.tsx`

Expected: PASS; 한 번의 물리 입력은 한 번의 vote만 만들고 결과는 자동으로 사라지지 않는다.

- [ ] **Step 5: 커밋**

```bash
git add mobile/src/features/play/ui mobile/__tests__/play
git commit -m "feat(feed): connect shared hero balance card"
```

### Task 4: 상세 route를 read-only panel과 마감 결과로 전환

**Files:**
- Modify: `mobile/app/question/[id].tsx`
- Modify: `mobile/__tests__/routing/question-detail-ui.test.tsx`

**Interfaces:**
- Consumes: `BalanceChoicePanel`, `VoteSplitBar`, `ClosedQuestionResult`
- Preserves: share/report/block/back, reason chips, invalid ID and retry

- [ ] **Step 1: active·closed·empty 상세 테스트 추가**

```tsx
test('renders active detail as read-only without percentages', async () => {
  await renderDetail();
  await waitFor(() => expect(screen.getByLabelText(/질문: .* A: .* B:/)).toBeTruthy());
  expect(screen.queryByRole('button', { name: /A 선택|B 선택/ })).toBeNull();
  expect(screen.queryByText(/%/)).toBeNull();
});

test('renders an empty closed result without a broken 0\/0 bar', async () => {
  const closedQuestion = { ...question, closesAt: '2026-07-14T00:00:00.000Z' };
  await renderDetail({
    getById: jest.fn().mockResolvedValue(null),
    getClosedResult: jest.fn().mockResolvedValue({ question: closedQuestion, countA: 0, countB: 0, percentA: 0, percentB: 0, label: '결과 없음' }),
  });
  await waitFor(() => expect(screen.getByText('아직 투표가 없어요')).toBeTruthy());
  expect(screen.queryByText('0%')).toBeNull();
});
```

테스트 helper는 `async function renderDetail(overrides: Partial<QuestionRepository> = {})`로 바꾸고 `createRepository()` 결과에 `...overrides`를 마지막으로 병합한다. 기존 호출은 인자 없이 그대로 동작한다.

- [ ] **Step 2: 전용 카드가 남아 실패하는지 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/routing/question-detail-ui.test.tsx`

Expected: FAIL because the route still renders local `questionCard` and `result` styles.

- [ ] **Step 3: 렌더 영역만 공통 컴포넌트로 교체**

```tsx
<BalanceChoicePanel question={question} mode="readOnly" />
{closedResult
  ? closedResult.countA + closedResult.countB === 0
    ? <Text accessibilityRole="summary">아직 투표가 없어요</Text>
    : <VoteSplitBar percentA={closedResult.percentA} percentB={closedResult.percentB} label={closedResult.label} />
  : null}
```

route effect, `getClosedResult`, `ReasonChips`, 공유·신고·차단 함수와 오류 분기는 수정하지 않는다. 제거된 전용 `questionCard`, `optionCard`, `result` 스타일만 정리한다.

- [ ] **Step 4: 상세 전체 회귀 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/routing/question-detail-ui.test.tsx __tests__/routing/invalid-detail-route.test.tsx __tests__/routing/share-route.test.tsx`

Expected: PASS; active 결과는 숨고 closed 결과만 보이며 안전 도구와 딥링크 복구가 유지된다.

- [ ] **Step 5: 커밋**

```bash
git add 'mobile/app/question/[id].tsx' mobile/__tests__/routing/question-detail-ui.test.tsx
git commit -m "refactor(detail): use shared balance card primitives"
```

### Task 5: 공유 route를 votable panel과 receipt 결과로 전환

**Files:**
- Modify: `mobile/app/share/[id].tsx`
- Modify: `mobile/__tests__/routing/share-route.test.tsx`
- Test: `mobile/__tests__/routing/share-restart.test.tsx`
- Test: `mobile/__tests__/routing/provider-share-race.test.tsx`

**Interfaces:**
- Consumes: `BalanceChoicePanel`, `VoteSplitBar`, existing `vote(choice, savedAction)`
- Preserves: pending queue/action ID/receipt/owner quarantine/generation lock

- [ ] **Step 1: pending 선택과 receipt 공개 테스트 추가**

```tsx
test('shows pending selection but no percentages before receipt', async () => {
  await renderShare(repository(), async (queue) => {
    await queue.enqueue({ id: 'same-action', type: 'vote', questionId: question.id, choice: 'A', ownerId: '71000000-0000-0000-0000-000000000001' });
  });
  await waitFor(() => expect(screen.getByRole('button', { name: `A 선택: ${question.optionA}, 선택됨` })).toBeTruthy());
  expect(screen.queryByText(/%/)).toBeNull();
});

test('shows exact split only after a receipt', async () => {
  await renderShare(repository());
  await fireEvent.press(await screen.findByRole('button', { name: /A 선택/ }));
  await waitFor(() => expect(screen.getByLabelText('A 70퍼센트, B 30퍼센트, 내가 선택한 답 A')).toBeTruthy());
});
```

테스트 helper는 `async function renderShare(target, prepareQueue?: (queue: PendingActionQueue) => Promise<void>)`로 확장하고 `renderRouter` 호출 전에 `await prepareQueue?.(pendingActionQueue)`를 실행한다. `PendingActionQueue` 타입은 `createPendingActionQueue` 반환형으로 추론하거나 해당 모듈의 공개 타입을 import한다.

- [ ] **Step 2: 현재 route 전용 선택지와 결과에서 실패 확인**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/routing/share-route.test.tsx`

Expected: FAIL on the new selected label and shared split semantics.

- [ ] **Step 3: 렌더링만 공통 컴포넌트로 교체**

```tsx
const choiceDisabled = !canMutate || voting || receipt !== null || pendingVote !== null
  || Boolean(continuityConflict) || Boolean(ownershipConflict);

<BalanceChoicePanel
  question={question}
  mode="votable"
  disabled={choiceDisabled}
  selected={pendingVote?.choice ?? receipt?.selected ?? null}
  onVote={(choice) => vote(choice)}
/>
{receipt ? <VoteSplitBar percentA={receipt.percentA} percentB={receipt.percentB} selected={receipt.selected} label={receipt.label} /> : null}
```

`vote`, `generation`, `voteLocked`, enqueue/complete/acknowledge, retry button, conflict alerts와 `track` payload는 그대로 둔다. receipt가 존재할 때도 panel은 disabled selected 상태로 남고 `다른 밸런스도 보기`는 결과 다음에 유지한다.

- [ ] **Step 4: 공유 큐·재시작·race 회귀 실행**

Run: `cd mobile && npm test -- --runTestsByPath __tests__/routing/share-route.test.tsx __tests__/routing/share-restart.test.tsx __tests__/routing/provider-share-race.test.tsx __tests__/routing/invalid-share-route.test.tsx`

Expected: PASS; 재시도는 최초 action ID와 choice를 재사용하고 다른 owner의 pending vote는 전송되지 않는다.

- [ ] **Step 5: 커밋**

```bash
git add 'mobile/app/share/[id].tsx' mobile/__tests__/routing/share-route.test.tsx
git commit -m "refactor(share): use shared balance card primitives"
```

### Task 6: Web 키보드·전체 회귀 검증

**Files:**
- Modify: `mobile/__tests__/accessibility/interactive-controls.test.tsx`
- Modify after verified browser violations: `mobile/app/_layout.tsx`, `mobile/metro.config.js`, `mobile/src/features/play/ui/PlayScreen.tsx`
- Modify after fresh typed-route generation exposed a stale route: `mobile/src/components/app-tabs.web.tsx`
- Keep unchanged after verification: `mobile/src/global.css`

**Interfaces:**
- Verifies: enabled button tab stop, disabled exclusion, `:focus-visible`, Enter/Space activation
- Produces: no public runtime API; the play screen becomes vertically scrollable

Verified implementation notes:

- The focus CSS already contained the correct 3px rule, but the root layout did not import it. Import `@/global.css` from `app/_layout.tsx` and keep a regression test for that connection.
- Expo SDK 57 does not include `wasm` in Metro's default `assetExts`. Add `metro.config.js` so the `expo-sqlite` web worker resolves in the development server.
- Persistent inline results plus reason chips are unreachable at 200% zoom in a fixed `View`. Use a `ScrollView` with `flexGrow: 1`, and keep failed-reason recovery inline so it contributes to scroll height.
- A fresh Expo typed-route file excludes the removed `/explore` route. Point the compiled but currently unused starter tab file at the existing `/brain` route so `tsc --noEmit` remains truthful.

- [ ] **Step 1: 정적 계약 테스트 추가**

```tsx
test('keeps the shared choice controls in the web focus-ring selector', () => {
  const css = readFileSync(resolve(__dirname, '../../src/global.css'), 'utf8');
  expect(css).toContain("[role='button']:focus-visible");
  expect(css).toContain('outline: 3px solid');
});
```

- [ ] **Step 2: Jest·TypeScript·Expo Doctor 전체 실행**

Run: `cd mobile && npm run verify`

Expected: TypeScript exit 0, all Jest suites pass, Expo Doctor reports 20/20.

- [ ] **Step 3: Web export 실행**

Run: `cd mobile && npx expo export --platform web`

Expected: exit 0 and 12 static routes exported.

- [ ] **Step 4: 실제 Chromium 키보드 검증**

Run: `cd mobile && npx expo start --web`

Verify at 390×844 and 1280×900: Tab reaches A then B then pass on hero; disabled choices are skipped; Enter and Space each trigger one vote; the 3px primary focus ring is visible; no horizontal scroll appears; read-only detail choices do not enter the tab order.

- [ ] **Step 5: 최종 커밋**

```bash
git add mobile/__tests__/accessibility/interactive-controls.test.tsx mobile/src/global.css
git commit -m "test(ui): verify shared card accessibility"
```

## Self-Review Result

- 설계의 피드·상세·공유 데이터 흐름을 Tasks 3–5에 각각 연결했다.
- 무투표 `0/0`, 유효한 `0/100`, 잘못된 `50/49`를 서로 다른 상태로 테스트한다.
- `BalanceChoicePanelProps` 이름과 `showMedia`, `selected`, `onVote` 타입은 모든 작업에서 일치한다.
- 의견서의 타당한 selected·narrowing·grouped label은 포함했고, 현재 생산자 계약을 숨기는 자동 보정과 deprecated `focusable`은 제외했다.
- 기존 상세 안전 도구와 공유 큐 로직은 렌더링 교체 작업 밖에 두고 회귀 테스트로 고정했다.
- 각 구현 작업은 실패 테스트 → 최소 구현 → 관련 회귀 → 커밋 순서다.
