import { act, render, waitFor } from '@testing-library/react-native';

import PlayRoute from '../../app/(tabs)/index';
import { AppProviders } from '@/src/providers/AppProviders';
import { PlayScreen } from '@/src/features/play/ui/PlayScreen';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';

jest.mock('@/src/features/play/ui/PlayScreen', () => ({
  PlayScreen: jest.fn(() => null),
}));

const MockPlayScreen = PlayScreen as jest.MockedFunction<typeof PlayScreen>;

test('passes the persistent guest identity and flushable queue to the play screen', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  await queue.enqueue({
    id: '10000000-0000-0000-0000-000000000024',
    type: 'skip',
    questionId: 'daily',
    ownerId: 'guest-persisted',
  });
  await render(
    <AppProviders
      loadSession={async () => ({ userId: 'guest-persisted' })}
      pendingActionQueue={queue}
    >
      <PlayRoute />
    </AppProviders>,
  );

  await waitFor(() => {
    expect(MockPlayScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        pendingActionQueue: queue,
        sourceId: 'local',
        userId: 'guest-persisted',
      }),
      undefined,
    );
  });
  await waitFor(async () => expect(await queue.list()).toEqual([]));
});

test('removes a replay duplicate and surfaces a reconciliation notice', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  await queue.enqueue({
    id: '10000000-0000-0000-0000-000000000026',
    type: 'vote',
    questionId: 'daily-ramen-chicken',
    choice: 'A',
    ownerId: 'guest-replay',
  });
  await queue.enqueue({
    id: '10000000-0000-0000-0000-000000000027',
    type: 'vote',
    questionId: 'daily-ramen-chicken',
    choice: 'B',
    ownerId: 'guest-replay',
  });

  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: 'guest-replay' })}
      pendingActionQueue={queue}
    >
      <PlayRoute />
    </AppProviders>,
  );

  await waitFor(() => {
    expect(view.getByLabelText('pending-action-reconciliation')).toHaveTextContent(
      '이미 처리된 질문의 투표를 정리했어요.',
    );
  });
  expect(await queue.list()).toEqual([]);
});

test('removes a terminal replay failure without showing reconciliation noise', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  const action = {
    id: '10000000-0000-0000-0000-000000000028',
    type: 'vote' as const,
    questionId: 'missing-question',
    choice: 'A' as const,
    ownerId: 'guest-offline',
  };
  await queue.enqueue(action);

  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: 'guest-offline' })}
      pendingActionQueue={queue}
    >
      <PlayRoute />
    </AppProviders>,
  );
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(await queue.list()).toEqual([]);
  expect(view.queryByLabelText('pending-action-reconciliation')).toBeNull();
});
