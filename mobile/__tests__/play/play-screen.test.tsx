import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import {
  ClosedQuestionError,
  DuplicateVoteError,
  RetryableTransportError,
  type QuestionRepository,
} from '@/src/features/play/data/QuestionRepository';
import type { Question, VoteReceipt } from '@/src/features/play/domain/question';
import { useDeckStore } from '@/src/features/play/state/useDeckStore';
import { PlayScreen } from '@/src/features/play/ui/PlayScreen';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }), { virtual: true });

const Crypto = jest.requireMock('expo-crypto') as { randomUUID: jest.Mock };

function question(id: string, optionA: string, isDaily = false): Question {
  return {
    id,
    optionA,
    optionB: `${optionA} alternative`,
    description: null,
    category: 'daily',
    visibility: 'public',
    closesAt: null,
    isDaily,
    stage: 'active',
    weightsA: {},
    weightsB: {},
  };
}

const daily = question('daily', 'Daily question', true);
const feedOne = question('feed-1', 'First feed question');
const feedTwo = question('feed-2', 'Second feed question');

function receipt(): VoteReceipt {
  return {
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
}

function fakeRepository(): QuestionRepository {
  return {
    getDaily: jest.fn().mockResolvedValue(daily),
    getFeed: jest.fn().mockResolvedValue({
      items: [daily, feedOne, feedTwo],
      nextCursor: null,
    }),
    getById: jest.fn(),
    getVoteEvidence: jest.fn().mockResolvedValue([]),
    vote: jest.fn().mockResolvedValue(receipt()),
    skip: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    report: jest.fn(),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function wrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  useDeckStore.getState().reset();
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('shows the daily first, reveals the result, then advances after 800 ms', async () => {
  const repository = fakeRepository();
  const view = await render(
    <PlayScreen
      repository={repository}
      userId="user-1"
      createActionId={() => 'action-1'}
    />,
    { wrapper: wrapper() },
  );

  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());
  jest.useRealTimers();

  const nativeSetTimeout = global.setTimeout;
  let finishOverlay: (() => void) | undefined;
  const timeout = jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay, ...args) => {
    if (delay === 800) {
      finishOverlay = () => callback(...args);
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }
    return nativeSetTimeout(callback, delay, ...args);
  });
  const choice = view.getByLabelText('A 선택: Daily question');
  await fireEvent.press(choice);
  await fireEvent.press(choice);

  expect(view.getByText('75% vs 25%')).toBeTruthy();
  expect(repository.vote).toHaveBeenCalledTimes(1);
  expect(repository.vote).toHaveBeenCalledWith({
    questionId: 'daily',
    userId: 'user-1',
    choice: 'A',
    actionId: 'action-1',
  });

  expect(timeout).toHaveBeenCalledWith(expect.any(Function), 800);
  expect(view.getByText('Daily question')).toBeTruthy();

  await act(async () => {
    finishOverlay?.();
  });
  expect(view.getByText('First feed question')).toBeTruthy();
});

test('offers an explicit retry when the question repository is offline', async () => {
  const repository = fakeRepository();
  (repository.getDaily as jest.Mock)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(daily);
  const view = await render(
    <PlayScreen repository={repository} userId="user-1" />,
    { wrapper: wrapper() },
  );

  await waitFor(() => expect(view.getByRole('alert')).toHaveTextContent('질문을 불러오지 못했어요.'));
  await fireEvent.press(view.getByRole('button', { name: '질문 다시 시도' }));

  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());
  expect(repository.getDaily).toHaveBeenCalledTimes(2);
});

test('tracks one impression and successful vote/result without question copy', async () => {
  const target = fakeRepository();
  const trackedQuestion = question('72000000-0000-0000-0000-000000000001', 'private option', true);
  (target.getDaily as jest.Mock).mockResolvedValue(trackedQuestion);
  (target.getFeed as jest.Mock).mockResolvedValue({ items: [trackedQuestion], nextCursor: null });
  const trackEvent = jest.fn().mockResolvedValue(undefined);
  const view = await render(
    <PlayScreen repository={target} userId="71000000-0000-0000-0000-000000000001" trackEvent={trackEvent} createActionId={() => 'action'} />,
    { wrapper: wrapper() },
  );
  await waitFor(() => expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({ name: 'question_impression' })));
  jest.useRealTimers();
  await fireEvent.press(view.getByLabelText('A 선택: private option'));
  await waitFor(() => expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({ name: 'question_voted' })));
  expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({ name: 'result_viewed' }));
  expect(JSON.stringify(trackEvent.mock.calls)).not.toContain('private option');
});

test('passes immediately after the repository accepts the skip', async () => {
  const repository = fakeRepository();
  const view = await render(
    <PlayScreen repository={repository} userId="user-1" />,
    { wrapper: wrapper() },
  );

  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());
  jest.useRealTimers();
  await fireEvent.press(view.getByText('패스'));

  await waitFor(() => expect(view.getByText('First feed question')).toBeTruthy());
  expect(repository.skip).toHaveBeenCalledWith({
    questionId: 'daily',
    userId: 'user-1',
  });
});

test('prefetches another page when fewer than five cards remain', async () => {
  const repository = fakeRepository();
  const getFeed = repository.getFeed as jest.MockedFunction<QuestionRepository['getFeed']>;
  getFeed
    .mockResolvedValueOnce({ items: [daily, feedOne], nextCursor: 'next' })
    .mockResolvedValueOnce({ items: [feedTwo], nextCursor: null });

  await render(<PlayScreen repository={repository} userId="user-1" />, {
    wrapper: wrapper(),
  });

  await waitFor(() => expect(getFeed).toHaveBeenCalledTimes(2));
  expect(getFeed).toHaveBeenLastCalledWith({
    userId: 'user-1',
    cursor: 'next',
    limit: 20,
  });
});

test('keeps the current card and shows a retry message when skip fails', async () => {
  const repository = fakeRepository();
  (repository.skip as jest.Mock).mockRejectedValue(new Error('offline'));
  const view = await render(
    <PlayScreen repository={repository} userId="user-1" />,
    { wrapper: wrapper() },
  );

  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());
  jest.useRealTimers();
  await fireEvent.press(view.getByText('패스'));

  await waitFor(() => {
    expect(view.getByRole('alert')).toHaveTextContent('패스하지 못했어요. 다시 시도해 주세요.');
  });
  expect(view.getByText('Daily question')).toBeTruthy();
  expect(useDeckStore.getState().index).toBe(0);
});

test('queues a failed vote with its original action id and shows offline feedback', async () => {
  const repository = fakeRepository();
  (repository.vote as jest.Mock).mockRejectedValue(new RetryableTransportError());
  const queue = createPendingActionQueue(new Map<string, string>());
  const actionId = '10000000-0000-0000-0000-000000000021';
  const view = await render(
    <PlayScreen
      createActionId={() => actionId}
      pendingActionQueue={queue}
      repository={repository}
      userId="user-1"
    />,
    { wrapper: wrapper() },
  );

  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());
  jest.useRealTimers();
  await fireEvent.press(view.getByLabelText('A 선택: Daily question'));

  await waitFor(() => {
    expect(view.getByRole('alert')).toHaveTextContent(
      '오프라인 상태예요. 투표를 저장했어요.',
    );
  });
  expect(await queue.list()).toEqual([
    { id: actionId, type: 'vote', questionId: 'daily', choice: 'A', ownerId: 'user-1' },
  ]);
  expect(view.queryByText(/% vs %/)).toBeNull();
  expect(useDeckStore.getState().index).toBe(0);
});

test('surfaces a closed vote without queueing it for retry', async () => {
  const repository = fakeRepository();
  (repository.vote as jest.Mock).mockRejectedValue(new ClosedQuestionError());
  const queue = createPendingActionQueue(new Map<string, string>());
  const view = await render(<PlayScreen createActionId={() => '10000000-0000-0000-0000-000000000099'} pendingActionQueue={queue} repository={repository} userId="user-1" />, { wrapper: wrapper() });
  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());
  jest.useRealTimers();
  await fireEvent.press(view.getAllByRole('button')[0]);
  await waitFor(() => expect(view.getByRole('alert')).toBeTruthy());
  expect(await queue.list()).toEqual([]);
});

test('shows an explicit refresh when the finite deck is exhausted', async () => {
  const repository = fakeRepository();
  (repository.getDaily as jest.Mock).mockResolvedValue(null);
  (repository.getFeed as jest.Mock).mockResolvedValue({ items: [], nextCursor: null });
  const view = await render(<PlayScreen repository={repository} userId="user-1" />, { wrapper: wrapper() });
  await waitFor(() => expect(view.getByText('새 질문을 모두 봤어요.')).toBeTruthy());
  expect(view.getByRole('button', { name: '질문 목록 새로고침' })).toBeTruthy();
});

test('queues a failed skip with its generated action id and shows offline feedback', async () => {
  const repository = fakeRepository();
  (repository.skip as jest.Mock).mockRejectedValue(new RetryableTransportError());
  const queue = createPendingActionQueue(new Map<string, string>());
  const actionId = '10000000-0000-0000-0000-000000000022';
  const view = await render(
    <PlayScreen
      createActionId={() => actionId}
      pendingActionQueue={queue}
      repository={repository}
      userId="user-1"
    />,
    { wrapper: wrapper() },
  );

  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());
  jest.useRealTimers();
  await fireEvent.press(view.getByText('패스'));

  await waitFor(() => {
    expect(view.getByRole('alert')).toHaveTextContent(
      '오프라인 상태예요. 건너뛰기를 저장했어요.',
    );
  });
  expect(await queue.list()).toEqual([
    { id: actionId, type: 'skip', questionId: 'daily', ownerId: 'user-1' },
  ]);
  expect(useDeckStore.getState().index).toBe(0);
});

test('surfaces a duplicate vote without adding a non-retryable pending action', async () => {
  const repository = fakeRepository();
  (repository.vote as jest.Mock).mockRejectedValue(new DuplicateVoteError());
  const queue = createPendingActionQueue(new Map<string, string>());
  const view = await render(
    <PlayScreen
      createActionId={() => '10000000-0000-0000-0000-000000000023'}
      pendingActionQueue={queue}
      repository={repository}
      userId="user-1"
    />,
    { wrapper: wrapper() },
  );

  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());
  jest.useRealTimers();
  await fireEvent.press(view.getByLabelText('A 선택: Daily question'));

  await waitFor(() => {
    expect(view.getByRole('alert')).toHaveTextContent('이미 이 질문에 투표했어요.');
  });
  expect(view.getByRole('button', { name: '투표 다시 시도' })).toBeTruthy();
  expect(await queue.list()).toEqual([]);
});

test('loads fresh questions when the repository source changes', async () => {
  const firstRepository = fakeRepository();
  const secondRepository = fakeRepository();
  const replacement = question('replacement', 'Replacement daily', true);
  (secondRepository.getDaily as jest.Mock).mockResolvedValue(replacement);
  (secondRepository.getFeed as jest.Mock).mockResolvedValue({
    items: [replacement],
    nextCursor: null,
  });
  const Wrapper = wrapper();
  const view = await render(
    <PlayScreen repository={firstRepository} userId="user-1" />,
    { wrapper: Wrapper },
  );
  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());

  await view.rerender(<PlayScreen repository={secondRepository} userId="user-1" />);

  await waitFor(() => expect(view.getByText('Replacement daily')).toBeTruthy());
  expect(secondRepository.getDaily).toHaveBeenCalledTimes(1);
  expect(secondRepository.getFeed).toHaveBeenCalledTimes(1);
});

test('ignores a vote result from an obsolete repository generation', async () => {
  const oldRepository = fakeRepository();
  const pendingVote = deferred<VoteReceipt>();
  (oldRepository.vote as jest.Mock).mockReturnValue(pendingVote.promise);
  const newRepository = fakeRepository();
  const replacement = question('replacement', 'Replacement daily', true);
  (newRepository.getDaily as jest.Mock).mockResolvedValue(replacement);
  (newRepository.getFeed as jest.Mock).mockResolvedValue({ items: [replacement], nextCursor: null });
  const view = await render(
    <PlayScreen repository={oldRepository} userId="user-1" />,
    { wrapper: wrapper() },
  );
  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());
  jest.useRealTimers();
  await fireEvent.press(view.getByLabelText('A 선택: Daily question'));

  await view.rerender(<PlayScreen repository={newRepository} userId="user-1" />);
  await waitFor(() => expect(view.getByText('Replacement daily')).toBeTruthy());
  const timeout = jest.spyOn(global, 'setTimeout');

  await act(async () => {
    pendingVote.resolve(receipt());
    await pendingVote.promise;
  });

  expect(view.queryByText('75% vs 25%')).toBeNull();
  expect(view.getByLabelText('A 선택: Replacement daily')).toBeEnabled();
  expect(timeout).not.toHaveBeenCalledWith(expect.any(Function), 800);
  expect(useDeckStore.getState().index).toBe(0);
});

test('ignores a completed skip from an obsolete repository generation', async () => {
  const oldRepository = fakeRepository();
  const pendingSkip = deferred<void>();
  (oldRepository.skip as jest.Mock).mockReturnValue(pendingSkip.promise);
  const newRepository = fakeRepository();
  const replacement = question('replacement', 'Replacement daily', true);
  (newRepository.getDaily as jest.Mock).mockResolvedValue(replacement);
  (newRepository.getFeed as jest.Mock).mockResolvedValue({ items: [replacement], nextCursor: null });
  const view = await render(
    <PlayScreen repository={oldRepository} userId="user-1" />,
    { wrapper: wrapper() },
  );
  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());
  jest.useRealTimers();
  await fireEvent.press(view.getByText('패스'));

  await view.rerender(<PlayScreen repository={newRepository} userId="user-1" />);
  await waitFor(() => expect(view.getByText('Replacement daily')).toBeTruthy());
  await act(async () => {
    pendingSkip.resolve();
    await pendingSkip.promise;
  });

  expect(view.getByText('Replacement daily')).toBeTruthy();
  expect(view.getByLabelText('A 선택: Replacement daily')).toBeEnabled();
  expect(useDeckStore.getState().index).toBe(0);
});

test('uses distinct Expo Crypto UUIDs for accepted votes', async () => {
  const firstId = '123e4567-e89b-42d3-a456-426614174000';
  const secondId = '123e4567-e89b-42d3-b456-426614174001';
  Crypto.randomUUID.mockReturnValueOnce(firstId).mockReturnValueOnce(secondId);
  const repository = fakeRepository();
  const view = await render(
    <PlayScreen repository={repository} userId="user-1" />,
    { wrapper: wrapper() },
  );
  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());
  jest.useRealTimers();
  const nativeSetTimeout = global.setTimeout;
  let finishOverlay: (() => void) | undefined;
  jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay, ...args) => {
    if (delay === 800) {
      finishOverlay = () => callback(...args);
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }
    return nativeSetTimeout(callback, delay, ...args);
  });

  await fireEvent.press(view.getByLabelText('A 선택: Daily question'));
  await waitFor(() => expect(repository.vote).toHaveBeenCalledTimes(1));
  await act(async () => finishOverlay?.());
  await fireEvent.press(view.getByLabelText('A 선택: First feed question'));
  await waitFor(() => expect(repository.vote).toHaveBeenCalledTimes(2));

  const actionIds = (repository.vote as jest.Mock).mock.calls.map(([input]) => input.actionId);
  expect(Crypto.randomUUID).toHaveBeenCalledTimes(2);
  expect(actionIds).toEqual([firstId, secondId]);
  expect(new Set(actionIds).size).toBe(2);
  for (const actionId of actionIds) {
    expect(actionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  }
});

test('blocks vote and skip calls when the session mutation guard is closed', async () => {
  const repository = fakeRepository();
  const view = await render(
    <PlayScreen canMutate={false} repository={repository} userId="server-user" />,
    { wrapper: wrapper() },
  );
  await waitFor(() => expect(view.getByText('Daily question')).toBeTruthy());

  await fireEvent.press(view.getByLabelText('A 선택: Daily question'));
  await fireEvent.press(view.getByText('패스'));

  expect(repository.vote).not.toHaveBeenCalled();
  expect(repository.skip).not.toHaveBeenCalled();
});
