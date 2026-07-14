import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import ShareRoute from '../../app/share/[id]';
import { QuestionRepositoryContext, SessionContext } from '@/src/providers/AppProviders';
import type { QuestionRepository } from '@/src/features/play/data/QuestionRepository';
import type { Question } from '@/src/features/play/domain/question';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';

const questionId = '60000000-0000-0000-0000-000000000001';

test('restores an offline shared vote after restart and retries its original action id', async () => {
  const storage = new Map<string, string>();
  const beforeRestart = createPendingActionQueue(storage);
  const action = {
    id: '10000000-0000-4000-8000-000000000088',
    type: 'vote' as const,
    questionId,
    choice: 'B' as const,
    ownerId: 'anonymous-user',
  };
  await beforeRestart.enqueue(action);
  const afterRestart = createPendingActionQueue(storage);
  const question: Question = {
    id: questionId, optionA: 'A', optionB: 'B', description: null, category: '일상',
    visibility: 'public', closesAt: null, isDaily: true, stage: 'active', weightsA: {}, weightsB: {},
  };
  const vote = jest.fn().mockResolvedValue({
    applyStatus: 'already_applied', selected: 'B', countA: 4, countB: 6,
    percentA: 40, percentB: 60, label: '다수파', axisScores: {},
  });
  const repository = { getById: jest.fn().mockResolvedValue(question), vote } as unknown as QuestionRepository;
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QuestionRepositoryContext.Provider value={repository}>
        <SessionContext.Provider value={{ status: 'ready', userId: 'anonymous-user', canMutate: true, pendingActionQueue: afterRestart }}>
          {children}
        </SessionContext.Provider>
      </QuestionRepositoryContext.Provider>
    );
  }

  await renderRouter({ 'share/[id]': ShareRoute }, {
    initialUrl: `/share/${questionId}`,
    wrapper: Wrapper,
  });
  await waitFor(() => expect(screen.getByText('저장한 투표 다시 시도')).toBeTruthy());
  await fireEvent.press(screen.getByText('저장한 투표 다시 시도'));

  await waitFor(() => expect(screen.getByText('40% vs 60%')).toBeTruthy());
  expect(vote).toHaveBeenCalledWith(expect.objectContaining({ actionId: action.id, choice: 'B' }));
  expect(await afterRestart.list()).toEqual([]);
});

test('locks both choices to the persisted selection until that exact vote is retried', async () => {
  const storage = new Map<string, string>();
  const queue = createPendingActionQueue(storage);
  await queue.enqueue({
    id: '10000000-0000-4000-8000-000000000089', type: 'vote', questionId,
    choice: 'B', ownerId: 'anonymous-user',
  });
  const question: Question = {
    id: questionId, optionA: 'Alpha', optionB: 'Beta', description: null, category: 'life',
    visibility: 'public', closesAt: null, isDaily: true, stage: 'active', weightsA: {}, weightsB: {},
  };
  const vote = jest.fn().mockResolvedValue({
    applyStatus: 'already_applied', selected: 'B', countA: 1, countB: 1,
    percentA: 50, percentB: 50, label: '동률', axisScores: {},
  });
  const repository = { getById: jest.fn().mockResolvedValue(question), vote } as unknown as QuestionRepository;
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QuestionRepositoryContext.Provider value={repository}>
        <SessionContext.Provider value={{ status: 'ready', userId: 'anonymous-user', canMutate: true, pendingActionQueue: queue }}>
          {children}
        </SessionContext.Provider>
      </QuestionRepositoryContext.Provider>
    );
  }
  await renderRouter({ 'share/[id]': ShareRoute }, { initialUrl: `/share/${questionId}`, wrapper: Wrapper });
  await waitFor(() => expect(screen.getByText('Beta · 선택됨')).toBeTruthy());

  await fireEvent.press(screen.getByLabelText('A 선택: Alpha'));
  expect(vote).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByText('저장한 투표 다시 시도'));
  await waitFor(() => expect(vote).toHaveBeenCalledWith(expect.objectContaining({ choice: 'B' })));
});

test.each([
  ['another owner', 'owner-a'],
  ['legacy unowned', undefined],
] as const)('quarantines a %s pending vote when the route is opened as owner-b', async (_case, ownerId) => {
  const queue = createPendingActionQueue(new Map<string, string>());
  await queue.enqueue({
    id: '10000000-0000-4000-8000-000000000090', type: 'vote', questionId,
    choice: 'A', ...(ownerId ? { ownerId } : {}),
  });
  const sharedQuestion: Question = {
    id: questionId, optionA: 'Alpha', optionB: 'Beta', description: null, category: 'life',
    visibility: 'public', closesAt: null, isDaily: true, stage: 'active', weightsA: {}, weightsB: {},
  };
  const vote = jest.fn();
  const repository = { getById: jest.fn().mockResolvedValue(sharedQuestion), vote } as unknown as QuestionRepository;
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QuestionRepositoryContext.Provider value={repository}>
        <SessionContext.Provider value={{ status: 'ready', userId: 'owner-b', canMutate: true, pendingActionQueue: queue }}>
          {children}
        </SessionContext.Provider>
      </QuestionRepositoryContext.Provider>
    );
  }

  await renderRouter({ 'share/[id]': ShareRoute }, { initialUrl: `/share/${questionId}`, wrapper: Wrapper });

  await waitFor(() => expect(screen.getByText(/다른 사용자.*대기 투표|소유자를 확인할 수 없는 대기 투표/)).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('A 선택: Alpha'));
  expect(vote).not.toHaveBeenCalled();
  expect(await queue.list()).toHaveLength(1);
  expect(screen.queryByText('저장한 투표 다시 시도')).toBeNull();
});
