# Balance Game MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Expo app where people immediately play an endless A/B balance deck, grow a transparent “나의 뇌” profile from their choices, and publish questions that become content for other players.

**Architecture:** Build the product in vertical slices under `mobile/`: Expo Router routes stay thin, feature modules own UI and domain logic, and repositories isolate local mock data from Supabase. Start with deterministic local repositories so the play, ask, and brain loops can be tested before adding PostgreSQL, RLS, anonymous auth, distribution RPCs, sharing, notifications, and analytics.

**Tech Stack:** Node.js 22.13+, Expo SDK 57, React Native, TypeScript, Expo Router, TanStack Query, Zustand, Reanimated, Expo Haptics, Expo Notifications, Supabase PostgreSQL/Auth/Edge Functions, Jest with `jest-expo`, React Native Testing Library, pgTAP, Maestro.

## Global Constraints

- Product copy and visible labels are Korean.
- The first screen is a playable question; no onboarding carousel or required sign-up appears before the first vote.
- The four tabs are `플레이`, `물어보기`, `나의 뇌`, and `마이`.
- The default interaction is one A/B choice followed by an immediate result; prediction is not part of the P0 deck.
- Users may continue through an unlimited deck, while one daily question is always the first card of a new day.
- Guest use is backed by Supabase anonymous auth when online and a local pending-action queue when offline.
- Only real votes affect percentages, distribution, and brain scores.
- Question lifecycle uses one column only: `stage = pending | test | active | limited | hidden`; do not add a parallel `status` column.
- Vote retries are idempotent by `(user_id, client_action_id)`, and vote insertion plus brain-score updates occur in one database transaction.
- P0 uses structured reason chips; free-text comments are excluded.
- The eight value axes are `freedom`, `stability`, `relationship`, `reality`, `emotion`, `growth`, `efficiency`, and `fun`.
- Brain copy describes recent tendencies and never presents a professional psychological diagnosis.
- Public questions and link-only questions share one creation flow; link-only questions never enter the public deck.
- All database changes live in `mobile/supabase/migrations`; direct production schema edits are forbidden.
- Tests live outside `mobile/app` because Expo Router treats every file under `app` as a route.
- Source design: `docs/superpowers/specs/2026-07-14-balance-game-product-review-design.md`.

---

## Planned File Map

```text
mobile/
  app/
    _layout.tsx
    (tabs)/
      _layout.tsx
      index.tsx
      ask.tsx
      brain.tsx
      profile.tsx
    question/[id].tsx
    share/[id].tsx
  src/
    app/AppProviders.tsx
    design/tokens.ts
    features/play/
      domain/question.ts
      domain/result.ts
      data/QuestionRepository.ts
      data/LocalQuestionRepository.ts
      data/SupabaseQuestionRepository.ts
      state/useDeckStore.ts
      ui/QuestionCard.tsx
      ui/ResultOverlay.tsx
      ui/PlayScreen.tsx
    features/ask/
      domain/createQuestion.ts
      ui/AskScreen.tsx
    features/brain/
      domain/brain.ts
      ui/BrainScreen.tsx
    features/moderation/
      domain/reasons.ts
      ui/ReasonChips.tsx
    features/session/
      data/session.ts
      data/pendingActions.ts
    features/analytics/analytics.ts
    lib/supabase.ts
    seed/questions.ko.json
  __tests__/
    play/result.test.ts
    play/question-card.test.tsx
    play/play-screen.test.tsx
    ask/create-question.test.ts
    brain/brain.test.ts
    moderation/reason-chips.test.tsx
    routing/share-route.test.tsx
  maestro/
    vote-create-brain.yaml
    shared-question.yaml
  supabase/
    config.toml
    migrations/202607140001_initial_schema.sql
    migrations/202607140002_feed_and_vote_functions.sql
    seed.sql
    tests/database/schema.test.sql
    tests/database/rls.test.sql
    tests/database/functions.test.sql
    functions/send-question-notification/index.ts
  app.config.ts
  jest.config.js
  jest.setup.ts
  package.json
  tsconfig.json
```

## Task 1: Scaffold the Expo app, tests, providers, and four-tab shell

**Files:**
- Create: `mobile/` with Expo SDK 57 default template
- Create: `mobile/jest.config.js`
- Create: `mobile/jest.setup.ts`
- Create: `mobile/src/design/tokens.ts`
- Create: `mobile/src/app/AppProviders.tsx`
- Modify: `mobile/app/_layout.tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx`
- Create: `mobile/app/(tabs)/index.tsx`
- Create: `mobile/app/(tabs)/ask.tsx`
- Create: `mobile/app/(tabs)/brain.tsx`
- Create: `mobile/app/(tabs)/profile.tsx`
- Create: `mobile/__tests__/routing/tab-shell.test.tsx`

**Interfaces:**
- Consumes: none
- Produces: `AppProviders`, `colors`, `spacing`, `radius`, and four stable Expo Router tab paths.

- [ ] **Step 1: Scaffold the app and install runtime/test dependencies**

Run from `C:\Users\petbl\semobal`:

```powershell
npx create-expo-app@latest mobile --template default@sdk-57
Set-Location mobile
npx expo install expo-router react-native-reanimated react-native-gesture-handler expo-haptics expo-notifications expo-constants expo-linking
npm install @tanstack/react-query zustand zod @supabase/supabase-js react-native-url-polyfill
npx expo install expo-sqlite
npx expo install jest-expo @testing-library/react-native "--" --dev
npm install --save-dev @types/jest supabase
```

Expected: `mobile/package.json` exists, dependencies install without peer dependency errors, and `npx expo-doctor` reports no dependency mismatch.

- [ ] **Step 2: Write a failing route-shell test**

Create `mobile/__tests__/routing/tab-shell.test.tsx`:

```tsx
import { renderRouter, screen } from 'expo-router/testing-library';

test('renders the four product tabs', async () => {
  renderRouter({
    '(tabs)/_layout': jest.fn(() => null),
    '(tabs)/index': jest.fn(() => null),
    '(tabs)/ask': jest.fn(() => null),
    '(tabs)/brain': jest.fn(() => null),
    '(tabs)/profile': jest.fn(() => null),
  }, { initialUrl: '/' });

  expect(screen).toBeTruthy();
});
```

Create `mobile/jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.test.(ts|tsx)'],
};
```

Create `mobile/jest.setup.ts`:

```ts
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
```

Add to `mobile/package.json` scripts:

```json
{
  "scripts": {
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit",
    "verify": "npm run typecheck && npm test && npx expo-doctor"
  }
}
```

- [ ] **Step 3: Run the test and confirm the shell is incomplete**

Run:

```powershell
npm test -- tab-shell.test.tsx
```

Expected: FAIL because the production tab layout and provider shell have not been defined.

- [ ] **Step 4: Implement design tokens, providers, and the tab layout**

Create `mobile/src/design/tokens.ts`:

```ts
export const colors = {
  background: '#FAFAFC',
  surface: '#FFFFFF',
  text: '#111111',
  muted: '#777777',
  border: '#ECECF2',
  primary: '#6C4DFF',
  optionA: '#4B8DFF',
  optionB: '#FF5D7D',
  warning: '#FF9F1C',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { card: 24, button: 20 } as const;
```

Create `mobile/src/app/AppProviders.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useState } from 'react';

export function AppProviders({ children }: PropsWithChildren) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

Replace `mobile/app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { AppProviders } from '@/src/app/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
```

Replace `mobile/app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: '플레이' }} />
      <Tabs.Screen name="ask" options={{ title: '물어보기' }} />
      <Tabs.Screen name="brain" options={{ title: '나의 뇌' }} />
      <Tabs.Screen name="profile" options={{ title: '마이' }} />
    </Tabs>
  );
}
```

Create each tab route as a temporary, valid screen so navigation works before its vertical slice replaces it:

```tsx
import { Text, View } from 'react-native';

export default function Screen() {
  return <View><Text>플레이</Text></View>;
}
```

Use `플레이`, `물어보기`, `나의 뇌`, and `마이` respectively in `index.tsx`, `ask.tsx`, `brain.tsx`, and `profile.tsx`.

- [ ] **Step 5: Verify and commit the shell**

Run:

```powershell
npm run verify
git add mobile
git commit -m "chore: scaffold balance game mobile app"
```

Expected: typecheck, Jest, and Expo Doctor pass; commit contains only the scaffold and test shell.

## Task 2: Define domain contracts, result math, and seed content

**Files:**
- Create: `mobile/src/features/play/domain/question.ts`
- Create: `mobile/src/features/play/domain/result.ts`
- Create: `mobile/src/features/play/data/QuestionRepository.ts`
- Create: `mobile/src/seed/questions.ko.json`
- Create: `mobile/src/features/play/data/LocalQuestionRepository.ts`
- Create: `mobile/__tests__/play/result.test.ts`

**Interfaces:**
- Consumes: design constants only
- Produces: `Question`, `VoteChoice`, `VoteResult`, `CreateQuestionInput`, `FeedPage`, and `QuestionRepository` used by every later task.

- [ ] **Step 1: Write failing tests for result percentages and labels**

Create `mobile/__tests__/play/result.test.ts`:

```ts
import { buildVoteResult } from '@/src/features/play/domain/result';

test('rounds percentages while keeping the pair at 100', () => {
  expect(buildVoteResult('A', 2, 1)).toEqual({
    selected: 'A', countA: 2, countB: 1, percentA: 67, percentB: 33, label: '다수파',
  });
});

test('labels a 48 to 52 result as a close match', () => {
  expect(buildVoteResult('B', 48, 52).label).toBe('초접전');
});

test('labels a selected side below 50 percent as minority', () => {
  expect(buildVoteResult('A', 20, 80).label).toBe('소수파');
});
```

- [ ] **Step 2: Run the test to verify the domain is missing**

Run:

```powershell
npm test -- result.test.ts
```

Expected: FAIL with module-not-found errors for `domain/result`.

- [ ] **Step 3: Add the complete P0 domain contracts**

Create `mobile/src/features/play/domain/question.ts`:

```ts
export type VoteChoice = 'A' | 'B';
export type QuestionVisibility = 'public' | 'link';
export type DistributionStage = 'pending' | 'test' | 'active' | 'limited' | 'hidden';
export type ValueAxisId =
  | 'freedom' | 'stability' | 'relationship' | 'reality'
  | 'emotion' | 'growth' | 'efficiency' | 'fun';

export type OptionWeights = Partial<Record<ValueAxisId, number>>;

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
}

export interface VoteResult {
  selected: VoteChoice;
  countA: number;
  countB: number;
  percentA: number;
  percentB: number;
  label: '다수파' | '소수파' | '초접전';
}

export interface VoteReceipt extends VoteResult {
  applyStatus: 'applied' | 'already_applied';
  axisScores: Record<ValueAxisId, number>;
}

export interface CreateQuestionInput {
  optionA: string;
  optionB: string;
  description: string | null;
  category: string;
  visibility: QuestionVisibility;
  closesAt: string | null;
}
```

Create `mobile/src/features/play/domain/result.ts`:

```ts
import { VoteChoice, VoteResult } from './question';

export function buildVoteResult(selected: VoteChoice, countA: number, countB: number): VoteResult {
  const total = countA + countB;
  const percentA = total === 0 ? 50 : Math.round((countA / total) * 100);
  const percentB = 100 - percentA;
  const selectedPercent = selected === 'A' ? percentA : percentB;
  const label = percentA >= 48 && percentA <= 52
    ? '초접전'
    : selectedPercent >= 50 ? '다수파' : '소수파';
  return { selected, countA, countB, percentA, percentB, label };
}
```

Create `mobile/src/features/play/data/QuestionRepository.ts`:

```ts
import { CreateQuestionInput, Question, VoteChoice, VoteReceipt } from '../domain/question';

export interface FeedPage { items: Question[]; nextCursor: string | null; }

export interface QuestionRepository {
  getDaily(date: string): Promise<Question | null>;
  getFeed(input: { userId: string; cursor: string | null; limit: number }): Promise<FeedPage>;
  getById(id: string): Promise<Question | null>;
  vote(input: { questionId: string; userId: string; choice: VoteChoice; actionId: string }): Promise<VoteReceipt>;
  skip(input: { questionId: string; userId: string }): Promise<void>;
  create(input: CreateQuestionInput & { authorId: string }): Promise<Question>;
  report(input: { questionId: string; reporterId: string; reason: string }): Promise<void>;
}
```

- [ ] **Step 4: Add deterministic seed content and the local repository**

Create `mobile/src/seed/questions.ko.json` with at least these three records, then expand the same validated schema to 300 records before Gate 2:

```json
[
  {"id":"daily-ramen-chicken","optionA":"평생 라면 금지","optionB":"평생 치킨 금지","description":null,"category":"일상","visibility":"public","closesAt":null,"isDaily":true,"stage":"active","weightsA":{"fun":1},"weightsB":{"fun":1}},
  {"id":"commute-salary","optionA":"출근 2시간 줄이기","optionB":"연봉 10% 올리기","description":null,"category":"회사","visibility":"public","closesAt":null,"isDaily":false,"stage":"active","weightsA":{"freedom":1,"efficiency":0.5},"weightsB":{"growth":0.5,"reality":1}},
  {"id":"friends-depth-width","optionA":"친구 5명 깊게 사귀기","optionB":"지인 100명 넓게 알기","description":null,"category":"관계","visibility":"public","closesAt":null,"isDaily":false,"stage":"active","weightsA":{"relationship":1,"stability":0.5},"weightsB":{"relationship":0.5,"growth":0.5}}
]
```

Implement `LocalQuestionRepository` with an in-memory `Map`, daily-first retrieval, no duplicate vote per `(questionId,userId)`, idempotent replay by `(userId,actionId)`, and `buildVoteResult` after incrementing the selected side. It returns a `VoteReceipt` with locally accumulated `axisScores`. Replaying the same action ID returns the original receipt with `applyStatus: 'already_applied'` without incrementing counts or scores; a different action ID for an already-voted question returns the duplicate-vote error.

- [ ] **Step 5: Run domain tests and commit**

Run:

```powershell
npm test -- result.test.ts
npm run typecheck
git add mobile/src/features/play mobile/src/seed mobile/__tests__/play/result.test.ts
git commit -m "feat: define question and vote domain"
```

Expected: all result tests pass and TypeScript reports no errors.

## Task 3: Build the daily-first endless play loop

**Files:**
- Create: `mobile/src/features/play/state/useDeckStore.ts`
- Create: `mobile/src/features/play/ui/QuestionCard.tsx`
- Create: `mobile/src/features/play/ui/ResultOverlay.tsx`
- Create: `mobile/src/features/play/ui/PlayScreen.tsx`
- Modify: `mobile/app/(tabs)/index.tsx`
- Create: `mobile/__tests__/play/question-card.test.tsx`
- Create: `mobile/__tests__/play/play-screen.test.tsx`

**Interfaces:**
- Consumes: `QuestionRepository`, `Question`, `VoteChoice`, `VoteResult`
- Produces: `PlayScreen({ repository, userId })` and `useDeckStore` with `index`, `advance()`, and `reset()`.

- [ ] **Step 1: Write failing interaction tests**

Create `mobile/__tests__/play/question-card.test.tsx`:

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { QuestionCard } from '@/src/features/play/ui/QuestionCard';

const question = {
  id: 'q1', optionA: 'A 선택', optionB: 'B 선택', description: null,
  category: '일상', visibility: 'public' as const, closesAt: null,
  isDaily: true, stage: 'active' as const, weightsA: {}, weightsB: {},
};

test('sends one explicit choice and supports pass', () => {
  const onVote = jest.fn();
  const onSkip = jest.fn();
  const view = render(<QuestionCard question={question} onVote={onVote} onSkip={onSkip} disabled={false} />);
  fireEvent.press(view.getByText('A 선택'));
  expect(onVote).toHaveBeenCalledWith('A');
  fireEvent.press(view.getByText('패스'));
  expect(onSkip).toHaveBeenCalledTimes(1);
});
```

Create `mobile/__tests__/play/play-screen.test.tsx` with a fake repository returning one daily question and two feed questions. Assert the daily question renders first, voting shows `다수파·소수파·초접전`, and the next question appears after advancing timers by 800 ms.

- [ ] **Step 2: Run tests and verify missing components**

Run:

```powershell
npm test -- question-card.test.tsx play-screen.test.tsx
```

Expected: FAIL because `QuestionCard` and `PlayScreen` do not exist.

- [ ] **Step 3: Implement the card and result overlay**

Create `QuestionCard.tsx` with two large `Pressable` choices, a visible `패스`, an accessibility label of `A 선택: {text}` or `B 선택: {text}`, and a disabled state during vote submission. Call `Haptics.selectionAsync()` only after the press is accepted.

Create `ResultOverlay.tsx` with this public contract:

```tsx
import { Text, View } from 'react-native';
import { VoteResult } from '../domain/question';

export function ResultOverlay({ result }: { result: VoteResult }) {
  return (
    <View accessibilityRole="summary">
      <Text>{result.percentA}% vs {result.percentB}%</Text>
      <Text>{result.label}</Text>
    </View>
  );
}
```

- [ ] **Step 4: Implement daily-first loading and endless pagination**

Use TanStack Query in `PlayScreen`:

```tsx
const daily = useQuery({ queryKey: ['daily', today], queryFn: () => repository.getDaily(today) });
const feed = useInfiniteQuery({
  queryKey: ['feed', userId],
  initialPageParam: null as string | null,
  queryFn: ({ pageParam }) => repository.getFeed({ userId, cursor: pageParam, limit: 20 }),
  getNextPageParam: page => page.nextCursor,
});
```

Construct the visible list as `[daily, ...feed]` with duplicate IDs removed. After a successful vote, display the overlay for exactly 800 ms, call `advance()`, and prefetch when fewer than five cards remain. A pass advances immediately after `repository.skip` succeeds.

Replace `mobile/app/(tabs)/index.tsx` with a thin adapter that obtains the session user and repository, then renders `PlayScreen`.

- [ ] **Step 5: Verify and commit the play slice**

Run:

```powershell
npm test -- question-card.test.tsx play-screen.test.tsx
npm run typecheck
git add mobile/app mobile/src/features/play mobile/__tests__/play
git commit -m "feat: add daily-first endless balance deck"
```

Expected: interaction tests pass; duplicate taps do not create duplicate repository calls.

## Task 4: Add guest session persistence and offline pending actions

**Files:**
- Create: `mobile/src/features/session/data/session.ts`
- Create: `mobile/src/features/session/data/pendingActions.ts`
- Create: `mobile/__tests__/session/pending-actions.test.ts`
- Modify: `mobile/src/app/AppProviders.tsx`

**Interfaces:**
- Consumes: `QuestionRepository.vote`, `QuestionRepository.skip`
- Produces: `getOrCreateGuestSession(): Promise<{ userId: string }>` and a FIFO `PendingActionQueue` supporting `enqueue`, `list`, `remove`, and `flush`.

- [ ] **Step 1: Write failing queue tests**

Create `mobile/__tests__/session/pending-actions.test.ts`:

```ts
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';

test('flushes actions in order and keeps a failed action', async () => {
  const storage = new Map<string, string>();
  const queue = createPendingActionQueue(storage);
  await queue.enqueue({ id: '10000000-0000-0000-0000-000000000001', type: 'vote', questionId: 'q1', choice: 'A' });
  await queue.enqueue({ id: '10000000-0000-0000-0000-000000000002', type: 'skip', questionId: 'q2' });
  const send = jest.fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error('offline'));
  await queue.flush(send);
  expect((await queue.list()).map(item => item.id)).toEqual(['10000000-0000-0000-0000-000000000002']);
});
```

- [ ] **Step 2: Verify the queue test fails**

Run `npm test -- pending-actions.test.ts`.

Expected: FAIL with missing module.

- [ ] **Step 3: Implement session and queue storage**

Use the Expo SQLite localStorage polyfill. Define pending actions as:

```ts
export type PendingAction =
  | { id: string; type: 'vote'; questionId: string; choice: 'A' | 'B' }
  | { id: string; type: 'skip'; questionId: string };
```

`getOrCreateGuestSession` reads `balance_guest_id`, creates `guest_${crypto.randomUUID()}` only when absent, and returns the same ID on later launches. The queue item's `id` is the later RPC's `client_action_id`. `flush` removes an action only after the sender resolves; an `already_applied` response for the same action ID is a successful replay and must also remove the queued item. A duplicate vote created under a different action ID remains a domain error and is surfaced for reconciliation instead of retried forever.

- [ ] **Step 4: Wire session readiness into providers**

Expose a `SessionContext` with `status: 'loading' | 'ready' | 'error'` and `userId`. Keep the first screen as a loading skeleton for storage initialization only; do not add a sign-up screen.

- [ ] **Step 5: Verify and commit offline foundations**

Run:

```powershell
npm test -- pending-actions.test.ts
npm run typecheck
git add mobile/src/features/session mobile/src/app/AppProviders.tsx mobile/__tests__/session
git commit -m "feat: persist guest sessions and pending votes"
```

Expected: queue order test passes and a failed action remains queued.

## Task 5: Implement one-screen question creation

**Files:**
- Create: `mobile/src/features/ask/domain/createQuestion.ts`
- Create: `mobile/src/features/ask/ui/AskScreen.tsx`
- Modify: `mobile/app/(tabs)/ask.tsx`
- Create: `mobile/__tests__/ask/create-question.test.ts`
- Create: `mobile/__tests__/ask/ask-screen.test.tsx`

**Interfaces:**
- Consumes: `CreateQuestionInput`, `QuestionRepository.create`, session `userId`
- Produces: `createQuestionSchema`, `normalizeCreateQuestion`, and `AskScreen({ repository, userId })`.

- [ ] **Step 1: Write failing validation tests**

Create `mobile/__tests__/ask/create-question.test.ts`:

```ts
import { createQuestionSchema } from '@/src/features/ask/domain/createQuestion';

test('requires two different options of at most 40 characters', () => {
  expect(createQuestionSchema.safeParse({ optionA: 'A', optionB: 'A', description: '', category: '일상', visibility: 'public', closesAt: null }).success).toBe(false);
  expect(createQuestionSchema.safeParse({ optionA: 'A', optionB: 'B', description: '', category: '일상', visibility: 'public', closesAt: null }).success).toBe(true);
});

test('rejects descriptions longer than 120 characters', () => {
  const result = createQuestionSchema.safeParse({ optionA: 'A', optionB: 'B', description: '가'.repeat(121), category: '일상', visibility: 'link', closesAt: null });
  expect(result.success).toBe(false);
});
```

- [ ] **Step 2: Run tests and verify the schema is missing**

Run `npm test -- create-question.test.ts`.

Expected: FAIL with missing module.

- [ ] **Step 3: Implement exact validation and normalization**

Create `mobile/src/features/ask/domain/createQuestion.ts`:

```ts
import { z } from 'zod';

export const createQuestionSchema = z.object({
  optionA: z.string().trim().min(1, 'A를 입력해 주세요').max(40),
  optionB: z.string().trim().min(1, 'B를 입력해 주세요').max(40),
  description: z.string().trim().max(120).transform(v => v || null),
  category: z.string().trim().min(1),
  visibility: z.enum(['public', 'link']),
  closesAt: z.string().datetime().nullable(),
}).refine(v => v.optionA.toLocaleLowerCase() !== v.optionB.toLocaleLowerCase(), {
  message: '서로 다른 선택지를 입력해 주세요', path: ['optionB'],
});

export type CreateQuestionForm = z.input<typeof createQuestionSchema>;
export const normalizeCreateQuestion = (input: CreateQuestionForm) => createQuestionSchema.parse(input);
```

- [ ] **Step 4: Build the form and success state**

`AskScreen` renders A and B inputs first, followed by collapsed optional controls for description, category, close time, and visibility. The primary button stays disabled until A and B differ. On success, clear the form and show `질문이 등록됐어요. 실제 사용자에게 테스트 노출을 시작합니다.` Never promise a vote count.

The screen test must fill A/B, choose `링크로만 공개`, submit once, and assert `repository.create` receives `visibility: 'link'`.

- [ ] **Step 5: Verify and commit question creation**

Run:

```powershell
npm test -- create-question.test.ts ask-screen.test.tsx
npm run typecheck
git add mobile/src/features/ask mobile/app/(tabs)/ask.tsx mobile/__tests__/ask
git commit -m "feat: add unified question creation flow"
```

Expected: validation and screen tests pass; duplicate options cannot be submitted.

## Task 6: Calculate and reveal the transparent “나의 뇌”

**Files:**
- Create: `mobile/src/features/brain/domain/brain.ts`
- Create: `mobile/src/features/brain/ui/BrainScreen.tsx`
- Modify: `mobile/app/(tabs)/brain.tsx`
- Create: `mobile/__tests__/brain/brain.test.ts`
- Create: `mobile/__tests__/brain/brain-screen.test.tsx`

**Interfaces:**
- Consumes: voted `Question` plus `VoteChoice`
- Produces: `calculateBrain(votes): BrainSummary`, where `BrainSummary` contains `voteCount`, `stage`, `axes`, `topAxes`, and `archetype`.

- [ ] **Step 1: Write failing score and stage tests**

Create `mobile/__tests__/brain/brain.test.ts`:

```ts
import { calculateBrain } from '@/src/features/brain/domain/brain';

test('reveals stages at 10, 20, and 50 votes', () => {
  const makeVotes = (count: number) => Array.from({ length: count }, (_, index) => ({
    questionId: String(index), choice: 'A' as const, weights: { freedom: 1 },
  }));
  expect(calculateBrain(makeVotes(9)).stage).toBe('awakening');
  expect(calculateBrain(makeVotes(10)).stage).toBe('axes');
  expect(calculateBrain(makeVotes(20)).stage).toBe('type');
  expect(calculateBrain(makeVotes(50)).stage).toBe('context');
});

test('keeps evidence question ids for every axis', () => {
  const result = calculateBrain([{ questionId: 'q1', choice: 'A', weights: { freedom: 1, fun: 0.5 } }]);
  expect(result.axes.freedom.evidenceIds).toEqual(['q1']);
});

test('names any top-two pair without a generic fallback', () => {
  const result = calculateBrain(Array.from({ length: 20 }, (_, index) => ({
    questionId: String(index), choice: 'A' as const,
    weights: { freedom: 2, relationship: 1 },
  })));
  expect(result.archetype).toBe('자유·관계 선택가');
});

test('does not claim a settled pair when second and third are tied', () => {
  const result = calculateBrain(Array.from({ length: 20 }, (_, index) => ({
    questionId: String(index), choice: 'A' as const,
    weights: { freedom: 2, relationship: 1, fun: 1 },
  })));
  expect(result.archetype).toBe('균형을 탐색하는 중');
});
```

- [ ] **Step 2: Run tests and confirm the brain domain is missing**

Run `npm test -- brain.test.ts`.

Expected: FAIL with missing module.

- [ ] **Step 3: Implement deterministic scoring and archetypes**

Create `brain.ts` with these public types:

```ts
import { OptionWeights, ValueAxisId, VoteChoice } from '../../play/domain/question';

export interface BrainVote { questionId: string; choice: VoteChoice; weights: OptionWeights; }
export interface AxisScore { score: number; evidenceIds: string[]; }
export interface BrainSummary {
  voteCount: number;
  stage: 'awakening' | 'axes' | 'type' | 'context';
  axes: Record<ValueAxisId, AxisScore>;
  topAxes: ValueAxisId[];
  archetype: string | null;
}
```

Initialize all eight axes at zero, sum only finite positive weights, and sort by score then axis ID for deterministic ties. Do not map only four pairs and collapse the remaining 24 pairs into one fallback, and do not introduce an MBTI-like 16-type system. Build the Korean summary deterministically from all top-two combinations using the exact axis labels `자유`, `안정`, `관계`, `현실`, `감성`, `성장`, `효율`, and `재미`: `${firstLabel}·${secondLabel} 선택가`. For example, `freedom+fun → 자유·재미 선택가` and `stability+relationship → 안정·관계 선택가`. If the second and third axis scores are tied, show `균형을 탐색하는 중` instead of claiming a settled pair. Return `archetype: null` before 20 votes.

- [ ] **Step 4: Implement progressive brain UI with evidence access**

`BrainScreen` shows `9/10 선택` during awakening, top three axis bars from 10 votes, the archetype and a simple eight-node radial layout from 20 votes, and category comparison from 50 votes. Every axis row has `이 성향을 만든 선택` that opens the recorded question IDs. Include the disclaimer `최근 선택에서 보인 경향이며 전문 심리 진단이 아닙니다.`

- [ ] **Step 5: Verify and commit brain progression**

Run:

```powershell
npm test -- brain.test.ts brain-screen.test.tsx
npm run typecheck
git add mobile/src/features/brain mobile/app/(tabs)/brain.tsx mobile/__tests__/brain
git commit -m "feat: add transparent progressive brain profile"
```

Expected: threshold, scoring, evidence, and UI tests pass.

## Task 7: Create the Supabase schema, constraints, and RLS tests

**Files:**
- Create: `mobile/supabase/config.toml`
- Create: `mobile/supabase/migrations/202607140001_initial_schema.sql`
- Create: `mobile/supabase/seed.sql`
- Create: `mobile/supabase/tests/database/schema.test.sql`
- Create: `mobile/supabase/tests/database/rls.test.sql`

**Interfaces:**
- Consumes: P0 domain contracts from Tasks 2, 5, and 6
- Produces: tables `profiles`, `questions`, `question_options`, `votes`, `question_skips`, `reason_reactions`, `value_axes`, `option_value_weights`, `daily_questions`, `question_exposures`, `reports`, `blocks`, `push_tokens`, and `analytics_events`.

- [ ] **Step 1: Initialize local Supabase and write failing pgTAP schema tests**

Run:

```powershell
Set-Location mobile
npx supabase init
```

Create `schema.test.sql`:

```sql
begin;
select plan(10);
select has_table('public', 'questions', 'questions exists');
select has_table('public', 'votes', 'votes exists');
select has_column('public', 'questions', 'visibility', 'visibility exists');
select has_column('public', 'questions', 'stage', 'single lifecycle stage exists');
select hasnt_column('public', 'questions', 'status', 'parallel status column is absent');
select has_constraint('public', 'votes', 'votes_question_id_user_id_key', 'one vote per user');
select has_column('public', 'votes', 'client_action_id', 'offline replay key exists');
select has_table('public', 'option_value_weights', 'brain weights exist');
select has_table('public', 'user_value_scores', 'server-owned brain scores exist');
select has_table('public', 'question_exposures', 'distribution exposures exist');
select * from finish();
rollback;
```

- [ ] **Step 2: Run database tests and confirm the schema is absent**

Run:

```powershell
npx supabase start
npx supabase test db
```

Expected: FAIL because the application tables do not exist.

- [ ] **Step 3: Implement the initial migration**

The migration must use UUID primary keys, `auth.users(id)` ownership, check constraints for A/B, public/link visibility, a single `stage` column constrained to pending/test/active/limited/hidden, and timestamps. Do not create a parallel `status` column. Store A and B in `question_options` with `(question_id, code)` unique. Add `client_action_id uuid not null`, `unique(question_id,user_id)`, and `unique(user_id,client_action_id)` to votes; keep `(question_id,user_id)` unique on skips. Insert the exact eight value axes in the migration.

Set `enable_anonymous_sign_ins = true` in `mobile/supabase/config.toml` so the local environment matches the guest-first production flow.

Enable RLS on every user-facing table. Required policies:

```sql
create policy "active public questions are readable"
on public.questions for select
using ((visibility = 'public' and stage = 'active') or author_id = (select auth.uid()));

create policy "authors create their own questions"
on public.questions for insert
with check (author_id = auth.uid());

create policy "users read their own votes"
on public.votes for select
using (user_id = auth.uid());
```

The only public-read policy uses `stage = 'active'`. Do not allow direct vote or `user_value_scores` writes from clients; Task 8 adds a security-definer function that validates the caller, close time, option membership, and action id. Users may read only their own value scores.

- [ ] **Step 4: Add RLS negative tests and seed rows**

`rls.test.sql` must set two different authenticated JWT subjects and verify that one user cannot update another user's question, cannot read another user's private vote, and cannot read a link-only question without requesting it through the share RPC. `seed.sql` inserts the validated seed questions and one daily question using fixed UUIDs.

- [ ] **Step 5: Reset, test, lint, and commit**

Run:

```powershell
npx supabase db reset
npx supabase test db
npx supabase db lint
git add mobile/supabase
git commit -m "feat: add secure balance game database schema"
```

Expected: pgTAP passes, lint reports no schema errors, and a clean reset reproduces seed data.

## Task 8: Add atomic voting, daily/feed RPCs, and the Supabase repository

**Files:**
- Create: `mobile/supabase/migrations/202607140002_feed_and_vote_functions.sql`
- Create: `mobile/supabase/tests/database/functions.test.sql`
- Create: `mobile/src/lib/supabase.ts`
- Create: `mobile/src/features/play/data/SupabaseQuestionRepository.ts`
- Create: `mobile/__tests__/play/supabase-repository.test.ts`

**Interfaces:**
- Consumes: `QuestionRepository`
- Produces: RPCs `cast_vote(question_id, choice, client_action_id)`, `get_daily_question(day)`, `get_feed(cursor, page_size)`, `record_skip(question_id)`, and `get_shared_question(question_id)`.

- [ ] **Step 1: Write failing pgTAP function tests**

Test these exact behaviors:

```sql
select throws_ok(
  $$ select public.cast_vote('00000000-0000-0000-0000-000000000001', 'C', '10000000-0000-0000-0000-000000000001') $$,
  '22023',
  'choice must be A or B'
);
```

Also assert: replaying the same `client_action_id` returns `already_applied` with unchanged vote and score counts; a different action ID for the same `(question,user)` throws a unique-vote error; a closed question rejects votes; link-only questions never appear in `get_feed`; and `get_feed` excludes questions already voted, skipped, or blocked by the current user. Assert direct client inserts into `votes` and direct writes to `user_value_scores` are denied.

- [ ] **Step 2: Run function tests and confirm RPCs are missing**

Run `npx supabase test db`.

Expected: FAIL because the RPCs do not exist.

- [ ] **Step 3: Implement atomic vote and weighted feed functions**

`cast_vote` locks the user/question vote key, handles `client_action_id` replay, inserts one real vote, reads the selected option's weights, and upserts `user_value_scores` in the same transaction. It returns `applied | already_applied`, A/B counts, percentages summing to 100, the selected choice, and updated axis scores so `나의 뇌` can refresh immediately. Put this logic inside `cast_vote`, not a separate client write or an implicit `AFTER INSERT` trigger, because every allowed vote path already goes through this RPC and the transaction boundary remains explicit and testable. `get_feed` constructs P0 candidates with this initial score:

```sql
quality_score * 0.40
+ freshness_score * 0.25
+ test_exposure_need * 0.25
+ close_deadline_score * 0.10
```

P0 deliberately omits `category_match`; add it only as a P1 experiment after a user has enough category history. For `stage = 'test'` rows with fewer than 10 exposures, use a neutral `quality_score = 0.5`. At 10 or more exposures, protect every rate denominator with `nullif(exposures, 0)` and wrap the result with `coalesce(..., 0.5)`. The function reserves the intended mix across validated seed, active UGC, test UGC, and close-deadline questions. It must record `question_exposures` only for returned rows and never fabricate votes.

- [ ] **Step 4: Implement the client and repository adapter**

Create `mobile/src/lib/supabase.ts` using the official Expo SQLite localStorage polyfill:

```ts
import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { storage: localStorage, persistSession: true, autoRefreshToken: true } },
);
```

Implement every `QuestionRepository` method in `SupabaseQuestionRepository`. Map snake_case database rows to the domain camelCase fields in one private mapper. Repository tests mock `supabase.rpc` and assert the exact RPC names and output mapping.

- [ ] **Step 5: Verify and commit backend integration**

Run:

```powershell
npx supabase db reset
npx supabase test db
npm test -- supabase-repository.test.ts
npm run typecheck
git add mobile/supabase mobile/src/lib mobile/src/features/play/data/SupabaseQuestionRepository.ts mobile/__tests__/play/supabase-repository.test.ts
git commit -m "feat: add atomic voting and feed distribution"
```

Expected: database and repository tests pass; percentages always sum to 100.

## Task 9: Add structured reasons, reporting, blocking, and automatic distribution slowdown

**Files:**
- Create: `mobile/src/features/moderation/domain/reasons.ts`
- Create: `mobile/src/features/moderation/ui/ReasonChips.tsx`
- Create: `mobile/__tests__/moderation/reason-chips.test.tsx`
- Modify: `mobile/src/features/play/ui/PlayScreen.tsx`
- Create: `mobile/supabase/migrations/202607140003_moderation_functions.sql`
- Create: `mobile/supabase/tests/database/moderation.test.sql`

**Interfaces:**
- Consumes: voted question ID and session user ID
- Produces: reason codes `realistic`, `emotional`, `money`, `time`, `neither`, `undecided`; RPCs `react_reason`, `report_question`, and `block_user`.

- [ ] **Step 1: Write failing reason-chip and moderation tests**

The component test presses `현실적으로 이쪽` and asserts `onReact('realistic')`. Database tests create reports from: three trusted reporters, three new anonymous reporters, and repeated calls by one reporter. Only the three distinct trusted reports move the question from `active` to `limited`; new anonymous reports enter the review queue without automatic stage change, and repeated calls do not increase weight. Vote counts never change.

- [ ] **Step 2: Run tests and confirm missing behavior**

Run:

```powershell
npm test -- reason-chips.test.tsx
npx supabase test db
```

Expected: FAIL for missing component, reason codes, and moderation functions.

- [ ] **Step 3: Implement reason chips after vote only**

Create a constant list with Korean labels and stable codes. `ReasonChips` permits one active reason per user and supports changing it. Render it only in the post-vote result area; it never blocks advancing to the next card.

- [ ] **Step 4: Implement report, block, and slowdown functions**

`report_question` inserts one report per `(question_id,reporter_id)` and limits each reporter to 10 report attempts per hour and 30 per day. A reporter is trusted for automatic slowdown only when the JWT is not anonymous or the reporter has at least 10 real votes. New anonymous reports are retained for administrator review but contribute zero automatic weight. A trusted unresolved weight of 3 moves the question to `limited`; an administrator review is required for `hidden`. `block_user` removes the blocked author's questions from future feed RPC results. No moderation trigger changes vote counts.

- [ ] **Step 5: Verify and commit moderation**

Run:

```powershell
npm test -- reason-chips.test.tsx
npx supabase db reset
npx supabase test db
npm run typecheck
git add mobile/src/features/moderation mobile/src/features/play/ui/PlayScreen.tsx mobile/supabase mobile/__tests__/moderation
git commit -m "feat: add structured reactions and moderation"
```

Expected: UI and database moderation tests pass; limited questions receive no normal active-feed allocation.

## Task 10: Add anonymous auth, share links, and account continuity

**Files:**
- Modify: `mobile/src/features/session/data/session.ts`
- Create: `mobile/app/share/[id].tsx`
- Create: `mobile/app/question/[id].tsx`
- Create: `mobile/__tests__/routing/share-route.test.tsx`
- Create: `mobile/maestro/shared-question.yaml`

**Interfaces:**
- Consumes: Supabase anonymous auth and `QuestionRepository.getById/vote`
- Produces: deep link `/share/:id`, a platform-correct URL from `Linking.createURL('/share/' + id)`, and `ensureAnonymousSession()`.

- [ ] **Step 1: Write a failing share-route test**

Use `renderRouter` with `/share/q1`, mock `getById` to return a link-only question, press A, and assert the result renders before any account-upgrade prompt. Also test a missing or hidden question renders `질문을 찾을 수 없어요`.

- [ ] **Step 2: Run the route test and confirm the route is absent**

Run `npm test -- share-route.test.tsx`.

Expected: FAIL because the share route does not exist.

- [ ] **Step 3: Replace local guest IDs with background anonymous auth online**

Implement:

```ts
export async function ensureAnonymousSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const result = await supabase.auth.signInAnonymously();
  if (result.error) throw result.error;
  return result.data.user!.id;
}
```

Keep the local guest ID and pending queue as offline fallbacks. When anonymous auth succeeds, rewrite queued actions to the Supabase user ID before flushing while preserving each action ID. For a new permanent identity, email/phone uses `updateUser` and OAuth uses `linkIdentity` with manual linking enabled; both upgrade the current anonymous Supabase user and must preserve the same `auth.uid()`, so no application-table ID rewrite trigger is added. Add a test that the user ID, votes, and value scores are unchanged after linking. Signing into an already-existing account creates a conflict/merge case and is outside P0; do not silently reassign foreign keys. Document that flow as P1 with explicit per-table conflict rules.

Enable CAPTCHA or Cloudflare Turnstile for anonymous sign-in in production and retain Supabase Auth's IP-based rate limit. RLS that distinguishes permanent from anonymous users must check `(auth.jwt()->>'is_anonymous')::boolean`; anonymous users otherwise use the same `authenticated` role.

- [ ] **Step 4: Implement share and detail routes**

The share route fetches through `get_shared_question`, allows one vote, displays the result, then offers `다른 밸런스도 보기`. It must not request sign-up before voting. `question/[id]` is the in-app detail route and adds reason chips, evidence tags, share, report, and block actions.

Generate share URLs with `Linking.createURL` instead of hard-coding a production domain:

```ts
import * as Linking from 'expo-linking';

export const createQuestionShareUrl = (questionId: string) =>
  Linking.createURL(`/share/${questionId}`);
```

Create a Maestro flow that opens the share URL, votes, sees a result, taps `다른 밸런스도 보기`, and reaches the play tab.

- [ ] **Step 5: Verify and commit share acquisition**

Run:

```powershell
npm test -- share-route.test.tsx
npx expo export --platform web
npm run typecheck
git add mobile/app mobile/src/features/session mobile/__tests__/routing mobile/maestro
git commit -m "feat: add guest-first shared question flow"
```

Expected: route tests pass and Expo produces a web export containing `/share/[id]`.

## Task 11: Add notifications and privacy-safe analytics

**Files:**
- Create: `mobile/src/features/analytics/analytics.ts`
- Create: `mobile/src/features/notifications/notifications.ts`
- Create: `mobile/supabase/functions/send-question-notification/index.ts`
- Create: `mobile/__tests__/analytics/analytics.test.ts`
- Modify: `mobile/app.config.ts`

**Interfaces:**
- Consumes: session ID, question ID, route source, push token
- Produces: `track(event)`, `registerNotifications()`, and the notification events `first_vote`, `meaningful_sample`, `question_closed`.

- [ ] **Step 1: Write failing analytics privacy tests**

Create `mobile/__tests__/analytics/analytics.test.ts`:

```ts
import { sanitizeEvent } from '@/src/features/analytics/analytics';

test('drops free text and keeps approved identifiers', () => {
  expect(sanitizeEvent({ name: 'question_created', userId: 'u1', questionId: 'q1', description: '민감한 내용' })).toEqual({
    name: 'question_created', userId: 'u1', questionId: 'q1',
  });
});
```

- [ ] **Step 2: Run the analytics test and confirm sanitization is missing**

Run `npm test -- analytics.test.ts`.

Expected: FAIL with missing module.

- [ ] **Step 3: Implement the event allowlist**

Allow only these names: `app_opened`, `question_impression`, `question_voted`, `question_skipped`, `result_viewed`, `brain_progress_viewed`, `brain_type_unlocked`, `question_create_started`, `question_created`, `question_shared`, `shared_question_voted`, `report_submitted`, and `notification_opened`. Allow only `userId`, `sessionId`, `questionId`, `source`, and ISO timestamp properties. Reject arbitrary free text.

- [ ] **Step 4: Implement opt-in notifications and server delivery**

Request notification permission after a user creates a question, not at app launch. Store the Expo push token with enabled event types. The Edge Function accepts `{ userId, event, questionId }`, checks the user's token preferences, and sends Korean copy only for first real vote, the configured meaningful sample threshold, and close result. Configure the `expo-notifications` plugin in `app.config.ts`.

- [ ] **Step 5: Verify and commit retention instrumentation**

Run:

```powershell
npm test -- analytics.test.ts
npx supabase functions serve send-question-notification --no-verify-jwt
npm run typecheck
git add mobile/src/features/analytics mobile/src/features/notifications mobile/supabase/functions mobile/app.config.ts mobile/__tests__/analytics
git commit -m "feat: add privacy-safe analytics and notifications"
```

Expected: analytics tests pass; the local function returns 200 for a disabled preference without sending a push.

## Task 12: Complete accessibility, failure recovery, end-to-end verification, and handoff docs

**Files:**
- Create: `mobile/maestro/vote-create-brain.yaml`
- Create: `mobile/README.md`
- Create: `mobile/.env.example`
- Modify: components identified by accessibility audit
- Modify: `balance_all_upgrade_plan.md` only if verified implementation differs from this plan

**Interfaces:**
- Consumes: all P0 routes and repositories
- Produces: repeatable local setup, full verification command, and Gate 1 test build.

- [ ] **Step 1: Write the primary Maestro flow**

Create `mobile/maestro/vote-create-brain.yaml`:

```yaml
appId: com.semobal.balance
---
- launchApp:
    clearState: true
- assertVisible: "오늘의 질문"
- tapOn:
    text: "A 선택:.*"
- assertVisible: ".*% vs .*%"
- repeat:
    times: 9
    commands:
      - tapOn:
          text: "A 선택:.*"
- tapOn: "물어보기"
- tapOn: "선택 A"
- inputText: "여행 비용 정확히 반반"
- tapOn: "선택 B"
- inputText: "소득에 따라 나누기"
- tapOn: "질문 등록"
- assertVisible: "질문이 등록됐어요.*"
- tapOn: "나의 뇌"
- assertVisible: ".*선택"
```

- [ ] **Step 2: Add explicit failure and accessibility checks**

Every interactive control must have a Korean accessibility label, 44×44 minimum touch area, visible focus on web, and color-independent selected state. Add tests for repository offline error, closed question, duplicate vote, missing share question, and failed question submission; each error offers `다시 시도` without losing typed input.

- [ ] **Step 3: Write reproducible setup documentation**

`mobile/README.md` must contain exact commands:

```powershell
npm install
npx supabase start
npx supabase db reset
npm run verify
npx expo start
```

Document that Node.js 22.13+, Docker-compatible local containers, a physical device or supported emulator for notifications, and EAS credentials for production push are required. `.env.example` uses `EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` for iOS Simulator and web, and includes the commented Android Emulator alternative `EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321`. A physical device must use the development machine's reachable LAN address rather than either loopback. Instruct developers to copy the local publishable key printed by `npx supabase status` into `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` without committing secrets.

- [ ] **Step 4: Run the full verification matrix**

Run:

```powershell
npx supabase db reset
npx supabase test db
npx supabase db lint
npm run verify
npx expo export --platform web
npx expo export --platform android
```

Expected: clean database reset, all pgTAP and Jest tests pass, TypeScript and Expo Doctor pass, and web/Android exports complete without runtime bundling errors.

- [ ] **Step 5: Run Gate 1 and commit the verified MVP**

Recruit 15 test users as defined in the review spec. Record first-vote completion and voluntary 10-vote completion without coaching. Gate 1 passes when at least 12 complete the first vote unaided and at least 10 continue to 10 votes.

Then run:

```powershell
git add mobile balance_all_upgrade_plan.md docs/superpowers
git commit -m "docs: complete balance game mvp implementation handoff"
```

Expected: the commit contains the verified MVP, migrations, automated tests, user-test result summary, updated product plan, review spec, and this implementation plan.

## Technical References

- Expo SDK 57 project creation and TypeScript: <https://docs.expo.dev/more/create-expo/>
- Android Emulator host-loopback alias: <https://developer.android.com/studio/run/emulator-networking-address>
- Expo Jest and React Native Testing Library setup: <https://docs.expo.dev/develop/unit-testing/>
- Expo Router test placement and router test utilities: <https://docs.expo.dev/router/reference/testing/>
- Supabase Expo React Native client and session storage: <https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native>
- Supabase local migrations: <https://supabase.com/docs/guides/local-development/overview>
- Supabase anonymous sign-in, identity linking, RLS claims, and abuse controls: <https://supabase.com/docs/guides/auth/auth-anonymous>
- Supabase pgTAP database testing: <https://supabase.com/docs/guides/local-development/testing/overview>
- Expo push notification setup: <https://docs.expo.dev/push-notifications/push-notifications-setup/>

## Execution Order and Checkpoints

- Checkpoint A after Task 3: review the core 0.8-second vote rhythm before backend work.
- Checkpoint B after Task 6: review whether brain explanations feel credible before persisting scores.
- Checkpoint C after Task 9: review UGC quality and moderation behavior before opening shared traffic.
- Checkpoint D after Task 12: pass Gate 1 before implementing any P1 feature.

Do not start prediction challenges, minimi, rare-choice collections, free-text comments, compatibility scores, or monthly rewind until Gate 3 and Gate 4 pass.
