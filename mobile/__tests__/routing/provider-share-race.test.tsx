import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import ShareRoute from '../../app/share/[id]';
import { AppProviders } from '@/src/providers/AppProviders';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';
import type { QuestionRepository } from '@/src/features/play/data/QuestionRepository';
import type { Question } from '@/src/features/play/domain/question';

const questionId = '60000000-0000-0000-0000-000000000001';

test('shows a provider-recovered vote receipt after an app restart without losing it to the route race', async () => {
  const storage = new Map<string, string>();
  const beforeRestart = createPendingActionQueue(storage);
  await beforeRestart.enqueue({
    id: '10000000-0000-4000-8000-000000000110', type: 'vote', questionId,
    choice: 'A', ownerId: 'anonymous-user',
  });
  const afterRestart = createPendingActionQueue(storage);
  const acknowledge = jest.spyOn(afterRestart, 'acknowledgeVoteOutcome');
  const question: Question = {
    id: questionId, optionA: 'Alpha', optionB: 'Beta', description: null, category: 'life',
    visibility: 'public', closesAt: null, isDaily: true, stage: 'active', weightsA: {}, weightsB: {},
  };
  const receipt = {
    applyStatus: 'already_applied' as const, selected: 'A' as const, countA: 7, countB: 3,
    percentA: 70, percentB: 30, label: '다수파', axisScores: {},
  };
  const repository = {
    getDaily: jest.fn(), getFeed: jest.fn(), getById: jest.fn().mockResolvedValue(question),
    getVoteEvidence: jest.fn(), vote: jest.fn().mockResolvedValue(receipt), skip: jest.fn(),
    create: jest.fn(), report: jest.fn(),
  } as unknown as QuestionRepository;
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <AppProviders
        loadSession={async () => ({ userId: 'anonymous-user', isAnonymous: true, source: 'anonymous' })}
        pendingActionQueue={afterRestart}
        questionRepository={repository}
        subscribeSessionRetry={() => () => undefined}
      >
        {children}
      </AppProviders>
    );
  }

  await renderRouter({ 'share/[id]': ShareRoute }, { initialUrl: `/share/${questionId}`, wrapper: Wrapper });

  await waitFor(() => expect(screen.getByText('70% vs 30%')).toBeTruthy());
  expect(repository.vote).toHaveBeenCalledTimes(1);
  expect(await afterRestart.list()).toEqual([]);
  await waitFor(() => expect(acknowledge).toHaveBeenCalledTimes(1));
  await expect(afterRestart.peekVoteOutcome(questionId, 'anonymous-user')).resolves.toBeNull();
});

test('retains a recovered receipt when the route unmounts after its question fetch fails', async () => {
  const storage = new Map<string, string>();
  const queue = createPendingActionQueue(storage);
  const actionId = '10000000-0000-4000-8000-000000000111';
  await queue.enqueue({ type: 'vote', id: actionId, questionId, choice: 'B', ownerId: 'anonymous-user' });
  const receipt = {
    applyStatus: 'already_applied' as const, selected: 'B' as const, countA: 2, countB: 8,
    percentA: 20, percentB: 80, label: '다수파', axisScores: {},
  };
  await queue.flush(jest.fn().mockResolvedValue(receipt), 'anonymous-user');
  const restarted = createPendingActionQueue(storage);
  const repository = {
    getDaily: jest.fn(), getFeed: jest.fn(), getById: jest.fn().mockRejectedValue(new Error('fetch failed')),
    getVoteEvidence: jest.fn(), vote: jest.fn(), skip: jest.fn(), create: jest.fn(), report: jest.fn(),
  } as unknown as QuestionRepository;
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <AppProviders
        loadSession={async () => ({ userId: 'anonymous-user', isAnonymous: true, source: 'anonymous' })}
        pendingActionQueue={restarted}
        questionRepository={repository}
        subscribeSessionRetry={() => () => undefined}
      >
        {children}
      </AppProviders>
    );
  }
  const view = await renderRouter({ 'share/[id]': ShareRoute }, {
    initialUrl: `/share/${questionId}`, wrapper: Wrapper,
  });
  await waitFor(() => expect(screen.getByText('질문을 불러오지 못했어요.')).toBeTruthy());
  await view.unmount();

  await expect(restarted.peekVoteOutcome(questionId, 'anonymous-user'))
    .resolves.toMatchObject({ actionId, receipt });
});
