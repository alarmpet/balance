import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import type { QuestionRepository } from '@/src/features/play/data/QuestionRepository';
import type { Question, VoteReceipt } from '@/src/features/play/domain/question';
import { useDeckStore } from '@/src/features/play/state/useDeckStore';
import { PlayScreen } from '@/src/features/play/ui/PlayScreen';
import { REASONS } from '@/src/features/moderation/domain/reasons';
import { ReasonChips } from '@/src/features/moderation/ui/ReasonChips';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => '10000000-0000-4000-8000-000000000001') }), { virtual: true });

const daily: Question = {
  id: 'daily',
  optionA: 'A 질문',
  optionB: 'B 질문',
  description: null,
  category: 'daily',
  visibility: 'public',
  closesAt: null,
  isDaily: true,
  stage: 'active',
  weightsA: {},
  weightsB: {},
};

const next: Question = { ...daily, id: 'next', optionA: '다음 질문', isDaily: false };

const receipt: VoteReceipt = {
  selected: 'A',
  countA: 3,
  countB: 1,
  percentA: 75,
  percentB: 25,
  label: '다수파',
  applyStatus: 'applied',
  axisScores: {
    freedom: 0,
    stability: 0,
    relationship: 0,
    reality: 0,
    emotion: 0,
    growth: 0,
    efficiency: 0,
    fun: 0,
  },
};

function repository(): QuestionRepository {
  return {
    getDaily: jest.fn().mockResolvedValue(daily),
    getFeed: jest.fn().mockResolvedValue({ items: [daily, next], nextCursor: null }),
    getById: jest.fn(),
    getVoteEvidence: jest.fn().mockResolvedValue([]),
    vote: jest.fn().mockResolvedValue(receipt),
    skip: jest.fn(),
    create: jest.fn(),
    report: jest.fn(),
    reactReason: jest.fn().mockResolvedValue(undefined),
  };
}

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  useDeckStore.getState().reset();
});

afterEach(() => {
  jest.useRealTimers();
});

test('uses stable codes and permits changing the one selected reason', async () => {
  const onReact = jest.fn();
  const view = await render(<ReasonChips onReact={onReact} />);

  await fireEvent.press(view.getByText('현실적으로 이쪽'));
  expect(onReact).toHaveBeenLastCalledWith('realistic');
  expect(view.getByLabelText('현실적으로 이쪽').props.accessibilityState).toEqual({ selected: true });

  await fireEvent.press(view.getByText('감정적으로 이쪽'));
  expect(onReact).toHaveBeenLastCalledWith('emotional');
  expect(view.getByLabelText('현실적으로 이쪽').props.accessibilityState).toEqual({ selected: false });
  expect(view.getByLabelText('감정적으로 이쪽').props.accessibilityState).toEqual({ selected: true });
  expect(REASONS.map(({ code }) => code)).toEqual([
    'realistic', 'emotional', 'money', 'time', 'neither', 'undecided',
  ]);
});

test('shows reasons only after a vote and reaction persistence never blocks advancing', async () => {
  const source = repository();
  const pendingReaction = new Promise<void>(() => undefined);
  (source.reactReason as jest.Mock).mockReturnValue(pendingReaction);
  const view = await render(<PlayScreen repository={source} userId="user-1" />, { wrapper: wrapper() });

  await waitFor(() => expect(view.getByText('A 질문')).toBeTruthy());
  expect(view.queryByText('현실적으로 이쪽')).toBeNull();
  await act(async () => {
    fireEvent.press(view.getByLabelText('A 선택: A 질문'));
    await Promise.resolve();
  });
  expect(view.getByText('현실적으로 이쪽')).toBeTruthy();
  await fireEvent.press(view.getByText('현실적으로 이쪽'));
  expect(source.reactReason).toHaveBeenCalledWith({
    questionId: 'daily', userId: 'user-1', reason: 'realistic',
  });

  await fireEvent.press(view.getByRole('button', { name: '다음 질문' }));
  expect(view.getByLabelText('A 선택: 다음 질문')).toBeTruthy();
  expect(view.queryByText('현실적으로 이쪽')).toBeNull();
});

test('serializes fast reason changes so the latest selection is persisted last without delaying advance', async () => {
  const source = repository();
  const firstSave = deferred<void>();
  const latestSave = deferred<void>();
  (source.reactReason as jest.Mock)
    .mockReturnValueOnce(firstSave.promise)
    .mockReturnValueOnce(latestSave.promise);
  const view = await render(<PlayScreen repository={source} userId="user-1" />, { wrapper: wrapper() });

  await waitFor(() => expect(view.getByText('A 질문')).toBeTruthy());
  await act(async () => {
    fireEvent.press(view.getByLabelText('A 선택: A 질문'));
    await Promise.resolve();
  });
  await fireEvent.press(view.getByLabelText('현실적으로 이쪽'));
  await fireEvent.press(view.getByLabelText('감정적으로 이쪽'));

  expect(source.reactReason).toHaveBeenCalledTimes(1);
  expect(source.reactReason).toHaveBeenNthCalledWith(1, {
    questionId: 'daily', userId: 'user-1', reason: 'realistic',
  });
  await fireEvent.press(view.getByRole('button', { name: '다음 질문' }));
  expect(view.getByLabelText('A 선택: 다음 질문')).toBeTruthy();

  await act(async () => {
    firstSave.resolve();
    await firstSave.promise;
    await Promise.resolve();
  });
  expect(source.reactReason).toHaveBeenCalledTimes(2);
  expect(source.reactReason).toHaveBeenNthCalledWith(2, {
    questionId: 'daily', userId: 'user-1', reason: 'emotional',
  });
  latestSave.resolve();
});

test('keeps each questions latest pending reason when play advances during a save', async () => {
  const source = repository();
  const firstSave = deferred<void>();
  const oldQuestionLatest = deferred<void>();
  const newQuestionSave = deferred<void>();
  (source.reactReason as jest.Mock)
    .mockReturnValueOnce(firstSave.promise)
    .mockReturnValueOnce(oldQuestionLatest.promise)
    .mockReturnValueOnce(newQuestionSave.promise);
  const view = await render(<PlayScreen repository={source} userId="user-1" />, { wrapper: wrapper() });

  await waitFor(() => expect(view.getByText('A 질문')).toBeTruthy());
  await act(async () => {
    fireEvent.press(view.getByLabelText('A 선택: A 질문'));
    await Promise.resolve();
  });
  await fireEvent.press(view.getByLabelText('현실적으로 이쪽'));
  await fireEvent.press(view.getByLabelText('감정적으로 이쪽'));
  await fireEvent.press(view.getByRole('button', { name: '다음 질문' }));
  expect(view.getByLabelText('A 선택: 다음 질문')).toBeTruthy();

  await act(async () => {
    fireEvent.press(view.getByLabelText('A 선택: 다음 질문'));
    await Promise.resolve();
  });
  await fireEvent.press(view.getByLabelText('돈이 더 중요'));
  firstSave.resolve();
  await act(async () => {
    await firstSave.promise;
    await Promise.resolve();
  });

  expect(source.reactReason).toHaveBeenNthCalledWith(2, {
    questionId: 'daily', userId: 'user-1', reason: 'emotional',
  });
  oldQuestionLatest.resolve();
  await act(async () => {
    await oldQuestionLatest.promise;
    await Promise.resolve();
  });
  expect(source.reactReason).toHaveBeenNthCalledWith(3, {
    questionId: 'next', userId: 'user-1', reason: 'money',
  });
  newQuestionSave.resolve();
});

test('hands a failed reason reaction to an explicit retry after the play loop advances', async () => {
  const source = repository();
  (source.reactReason as jest.Mock)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(undefined);
  const view = await render(<PlayScreen repository={source} userId="user-1" />, { wrapper: wrapper() });

  await waitFor(() => expect(view.getByText('A 질문')).toBeTruthy());
  await act(async () => {
    fireEvent.press(view.getByLabelText('A 선택: A 질문'));
    await Promise.resolve();
  });
  await fireEvent.press(view.getByLabelText('현실적으로 이쪽'));
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(view.getByRole('alert')).toHaveTextContent('선택 이유를 저장하지 못했어요.');
  await fireEvent.press(view.getByRole('button', { name: '다음 질문' }));
  expect(view.getByLabelText('A 선택: 다음 질문')).toBeTruthy();
  await fireEvent.press(view.getByRole('button', { name: '선택 이유 다시 시도' }));
  await waitFor(() => expect(source.reactReason).toHaveBeenCalledTimes(2));
  expect(source.reactReason).toHaveBeenLastCalledWith({
    questionId: 'daily', userId: 'user-1', reason: 'realistic',
  });
});

test('does not send a queued reason after the mutation guard closes during an in-flight save', async () => {
  const source = repository();
  const firstSave = deferred<void>();
  (source.reactReason as jest.Mock).mockReturnValueOnce(firstSave.promise);
  const Wrapper = wrapper();
  const view = await render(
    <PlayScreen canMutate repository={source} userId="user-1" />,
    { wrapper: Wrapper },
  );

  await waitFor(() => expect(view.getByText('A 질문')).toBeTruthy());
  await act(async () => {
    fireEvent.press(view.getByLabelText('A 선택: A 질문'));
    await Promise.resolve();
  });
  await fireEvent.press(view.getByLabelText('현실적으로 이쪽'));
  await fireEvent.press(view.getByLabelText('감정적으로 이쪽'));
  expect(source.reactReason).toHaveBeenCalledTimes(1);

  await view.rerender(<PlayScreen canMutate={false} repository={source} userId="user-1" />);
  await act(async () => {
    firstSave.resolve();
    await firstSave.promise;
    await Promise.resolve();
  });

  expect(source.reactReason).toHaveBeenCalledTimes(1);
  expect(view.queryByRole('button', { name: '선택 이유 다시 시도' })).toBeNull();
});

test('stale reason completion preserves and sends a newer generation reaction once', async () => {
  const oldSource = repository();
  const oldSave = deferred<void>();
  (oldSource.reactReason as jest.Mock).mockReturnValueOnce(oldSave.promise);
  const newSource = repository();
  const Wrapper = wrapper();
  const view = await render(
    <PlayScreen canMutate repository={oldSource} userId="old-user" />,
    { wrapper: Wrapper },
  );

  await waitFor(() => expect(view.getByText('A 질문')).toBeTruthy());
  await act(async () => {
    fireEvent.press(view.getByLabelText('A 선택: A 질문'));
    await Promise.resolve();
  });
  await fireEvent.press(view.getByLabelText('현실적으로 이쪽'));
  expect(oldSource.reactReason).toHaveBeenCalledTimes(1);

  await view.rerender(<PlayScreen canMutate repository={newSource} userId="new-user" />);
  await waitFor(() => expect(view.getByText('A 질문')).toBeTruthy());
  await act(async () => {
    fireEvent.press(view.getByLabelText('A 선택: A 질문'));
    await Promise.resolve();
  });
  await fireEvent.press(view.getByLabelText('감정적으로 이쪽'));
  expect(newSource.reactReason).not.toHaveBeenCalled();

  await act(async () => {
    oldSave.resolve();
    await oldSave.promise;
    await Promise.resolve();
  });

  expect(newSource.reactReason).toHaveBeenCalledTimes(1);
  expect(newSource.reactReason).toHaveBeenCalledWith({
    questionId: 'daily', userId: 'new-user', reason: 'emotional',
  });
});
