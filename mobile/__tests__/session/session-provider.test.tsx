import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppProviders, useSession } from '@/src/providers/AppProviders';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';
import { CaptchaUnavailableError, getOrCreateGuestSession } from '@/src/features/session/data/session';
import type { QuestionRepository } from '@/src/features/play/data/QuestionRepository';

function emptyPendingQueue() {
  return createPendingActionQueue(new Map<string, string>());
}

function SessionConsumer() {
  const session = useSession();
  return <Text>{`${session.status}:${session.userId ?? 'none'}`}</Text>;
}

function repository(): QuestionRepository {
  return {
    getDaily: jest.fn(), getFeed: jest.fn(), getById: jest.fn(), getVoteEvidence: jest.fn(),
    vote: jest.fn().mockResolvedValue({ applyStatus: 'already_applied' }),
    skip: jest.fn(), create: jest.fn(), report: jest.fn(),
  } as QuestionRepository;
}

test('shows storage initialization until the persistent guest session is ready', async () => {
  let resolveSession!: (session: { userId: string }) => void;
  const loadSession = jest.fn(
    () => new Promise<{ userId: string }>((resolve) => {
      resolveSession = resolve;
    }),
  );
  const view = await render(
    <AppProviders loadSession={loadSession} pendingActionQueue={emptyPendingQueue()}>
      <SessionConsumer />
    </AppProviders>,
  );

  expect(view.getByLabelText('session-loading')).toBeTruthy();
  expect(view.queryByText(/ready:/)).toBeNull();

  await act(async () => resolveSession({ userId: 'guest-persisted' }));

  await waitFor(() => expect(view.getByText('ready:guest-persisted')).toBeTruthy());
  expect(loadSession).toHaveBeenCalledTimes(1);
});

test('surfaces malformed guest identity storage without rendering the app', async () => {
  const storage = new Map<string, string>([['balance_guest_id', 'local-user']]);
  const view = await render(
    <AppProviders
      loadSession={() => getOrCreateGuestSession(storage)}
      pendingActionQueue={emptyPendingQueue()}
    >
      <SessionConsumer />
    </AppProviders>,
  );

  await waitFor(() => expect(view.getByLabelText('session-error')).toBeTruthy());
  expect(view.queryByText(/ready:/)).toBeNull();
});

test('surfaces malformed pending action storage during session initialization', async () => {
  const storage = new Map<string, string>([
    ['balance_pending_actions', JSON.stringify([{ type: 'skip' }])],
  ]);
  const queue = createPendingActionQueue(storage);
  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: 'guest-persisted' })}
      pendingActionQueue={queue}
    >
      <SessionConsumer />
    </AppProviders>,
  );

  await waitFor(() => expect(view.getByLabelText('session-error')).toBeTruthy());
  expect(view.queryByText('ready:guest-persisted')).toBeNull();
});

test('promotes an offline guest once and flushes preserved actions under the anonymous uid', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  const action = {
    id: '10000000-0000-4000-8000-000000000099',
    type: 'vote' as const,
    questionId: '60000000-0000-0000-0000-000000000001',
    choice: 'A' as const,
    ownerId: 'guest_10000000-0000-4000-8000-000000000001',
  };
  await queue.enqueue(action);
  const target = repository();
  let signalOnline!: () => void;
  const subscribeSessionRetry = jest.fn((listener: () => void) => {
    signalOnline = listener;
    return () => undefined;
  });
  let resolvePromotion!: (identity: { userId: string; isAnonymous: boolean }) => void;
  const promoteSession = jest.fn(() => new Promise<{ userId: string; isAnonymous: boolean }>((resolve) => {
    resolvePromotion = resolve;
  }));
  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: 'guest_10000000-0000-4000-8000-000000000001', source: 'offline' as const })}
      pendingActionQueue={queue}
      promoteSession={promoteSession}
      questionRepository={target}
      subscribeSessionRetry={subscribeSessionRetry}
    >
      <SessionConsumer />
    </AppProviders>,
  );
  await waitFor(() => expect(view.getByText(/ready:guest_/)).toBeTruthy());
  await waitFor(() => expect(subscribeSessionRetry).toHaveBeenCalledTimes(1));

  await act(async () => {
    signalOnline();
    signalOnline();
  });
  expect(promoteSession).toHaveBeenCalledTimes(1);
  await act(async () => resolvePromotion({ userId: 'anonymous-uid', isAnonymous: true }));

  await waitFor(() => expect(view.getByText('ready:anonymous-uid')).toBeTruthy());
  await waitFor(() => expect(target.vote).toHaveBeenCalledTimes(1));
  expect(target.vote).toHaveBeenCalledWith({
    actionId: action.id,
    choice: 'A',
    questionId: action.questionId,
    userId: 'anonymous-uid',
  });
  expect(await queue.list()).toEqual([]);
});

test('shows a fail-closed CAPTCHA error and retries session boot explicitly', async () => {
  const loadSession = jest.fn()
    .mockRejectedValueOnce(new CaptchaUnavailableError('보안 확인이 만료됐어요.'))
    .mockResolvedValueOnce({ userId: 'anonymous-after-refresh', source: 'anonymous' });
  const view = await render(
    <AppProviders loadSession={loadSession} pendingActionQueue={emptyPendingQueue()}>
      <SessionConsumer />
    </AppProviders>,
  );

  await waitFor(() => expect(view.getByText('보안 확인이 만료됐어요.')).toBeTruthy());
  await act(async () => fireEvent.press(view.getByText('다시 시도')));

  await waitFor(() => expect(view.getByText('ready:anonymous-after-refresh')).toBeTruthy());
  expect(loadSession).toHaveBeenCalledTimes(2);
});

test('does not flush guest-owned actions into an existing permanent account', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  await queue.enqueue({
    id: '10000000-0000-4000-8000-000000000100', type: 'vote',
    questionId: '60000000-0000-0000-0000-000000000001', choice: 'B',
    ownerId: 'guest_10000000-0000-4000-8000-000000000100',
  });
  const target = repository();
  function ConflictConsumer() {
    const value = useSession();
    return <Text>{value.continuityConflict ?? 'no-conflict'}</Text>;
  }

  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: 'existing-account', isAnonymous: false, source: 'permanent' as const })}
      pendingActionQueue={queue}
      questionRepository={target}
      subscribeSessionRetry={() => () => undefined}
    >
      <ConflictConsumer />
    </AppProviders>,
  );

  await waitFor(() => expect(view.getByText(/자동으로 합칠 수 없어요/)).toBeTruthy());
  expect(target.vote).not.toHaveBeenCalled();
  expect(await queue.list()).toHaveLength(1);
});

test('flushes exact-owner pending actions after a permanent-session restart', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  await queue.enqueue({
    id: '10000000-0000-4000-8000-000000000103', type: 'skip', questionId: 'q103',
    ownerId: 'permanent-user',
  });
  const target = repository();
  (target.skip as jest.Mock).mockResolvedValue(undefined);
  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: 'permanent-user', isAnonymous: false, source: 'permanent' as const })}
      pendingActionQueue={queue}
      questionRepository={target}
      subscribeSessionRetry={() => () => undefined}
    >
      <SessionConsumer />
    </AppProviders>,
  );

  await waitFor(() => expect(view.getByText('ready:permanent-user')).toBeTruthy());
  await waitFor(() => expect(target.skip).toHaveBeenCalledWith({ questionId: 'q103', userId: 'permanent-user' }));
  expect(await queue.list()).toEqual([]);
});

test('quarantines a legacy unowned action instead of binding it to the current account', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  await queue.enqueue({ id: '10000000-0000-4000-8000-000000000104', type: 'skip', questionId: 'q104' });
  const target = repository();
  function ConflictConsumer() {
    const value = useSession();
    return <Text>{value.continuityConflict ?? 'no-conflict'}</Text>;
  }
  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: 'anonymous-user', isAnonymous: true, source: 'anonymous' as const })}
      pendingActionQueue={queue}
      questionRepository={target}
      subscribeSessionRetry={() => () => undefined}
    >
      <ConflictConsumer />
    </AppProviders>,
  );

  await waitFor(() => expect(view.getByText(/소유자를 확인할 수 없는 대기 활동/)).toBeTruthy());
  expect(target.skip).not.toHaveBeenCalled();
  expect(await queue.list()).toHaveLength(1);
});

test('rejects a permanent identity returned while promoting an offline guest', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  await queue.enqueue({
    id: '10000000-0000-4000-8000-000000000101', type: 'skip', questionId: 'q101',
    ownerId: 'guest_10000000-0000-4000-8000-000000000101',
  });
  let signal!: () => void;
  const target = repository();
  function ConflictConsumer() {
    const value = useSession();
    return <Text>{value.continuityConflict ?? 'no-conflict'}</Text>;
  }
  const view = await render(
    <AppProviders
      loadSession={async () => ({
        userId: 'guest_10000000-0000-4000-8000-000000000101', isAnonymous: false, source: 'offline' as const,
      })}
      promoteSession={async () => ({ userId: 'existing-account', isAnonymous: false })}
      pendingActionQueue={queue}
      questionRepository={target}
      subscribeSessionRetry={(listener) => { signal = listener; return () => undefined; }}
    >
      <ConflictConsumer />
    </AppProviders>,
  );
  await waitFor(() => expect(signal).toBeDefined());
  await act(async () => signal());

  await waitFor(() => expect(view.getByText(/자동으로 합칠 수 없어요/)).toBeTruthy());
  expect(target.skip).not.toHaveBeenCalled();
  expect((await queue.list())[0]).toMatchObject({ ownerId: expect.stringMatching(/^guest_/) });
});

test('treats a permanent auth event as a conflict without invoking guest promotion', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  const guestId = 'guest_10000000-0000-4000-8000-000000000102';
  await queue.enqueue({
    id: '10000000-0000-4000-8000-000000000102', type: 'skip', questionId: 'q102', ownerId: guestId,
  });
  let signal!: (identity?: { userId: string; isAnonymous: boolean }) => void;
  const promoteSession = jest.fn();
  const target = repository();
  function ConflictConsumer() {
    const value = useSession();
    return <Text>{value.continuityConflict ?? 'no-conflict'}</Text>;
  }
  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: guestId, isAnonymous: false, source: 'offline' as const })}
      promoteSession={promoteSession}
      pendingActionQueue={queue}
      questionRepository={target}
      subscribeSessionRetry={(listener) => { signal = listener; return () => undefined; }}
    >
      <ConflictConsumer />
    </AppProviders>,
  );
  await waitFor(() => expect(signal).toBeDefined());
  await act(async () => signal({ userId: 'existing-account', isAnonymous: false }));

  await waitFor(() => expect(view.getByText(/자동으로 합칠 수 없어요/)).toBeTruthy());
  expect(promoteSession).not.toHaveBeenCalled();
  expect(target.skip).not.toHaveBeenCalled();
});

test('moves to the server uid and blocks writes when an anonymous auth event changes uid', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  const target = repository();
  let signal!: (identity?: { userId: string; isAnonymous: boolean }) => void;
  function IdentityConsumer() {
    const value = useSession();
    return <Text>{`${value.userId}:${value.source}:${value.continuityConflict ?? 'ok'}`}</Text>;
  }
  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: 'anonymous-a', isAnonymous: true, source: 'anonymous' as const })}
      pendingActionQueue={queue}
      questionRepository={target}
      subscribeSessionRetry={(listener) => { signal = listener; return () => undefined; }}
    >
      <IdentityConsumer />
    </AppProviders>,
  );
  await waitFor(() => expect(view.getByText('anonymous-a:anonymous:ok')).toBeTruthy());
  await queue.enqueue({
    id: '10000000-0000-4000-8000-000000000105', type: 'skip', questionId: 'q105', ownerId: 'anonymous-a',
  });
  await act(async () => signal({ userId: 'permanent-b', isAnonymous: false }));

  await waitFor(() => expect(view.getByText(/permanent-b:permanent:.*자동으로 합칠 수 없어요/)).toBeTruthy());
  expect(target.skip).not.toHaveBeenCalled();
  expect(await queue.list()).toHaveLength(1);
});

test('accepts a same-uid anonymous upgrade and flushes that owners pending work', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  const target = repository();
  (target.skip as jest.Mock).mockResolvedValue(undefined);
  let signal!: (identity?: { userId: string; isAnonymous: boolean }) => void;
  function IdentityConsumer() {
    const value = useSession();
    return <Text>{`${value.userId}:${value.source}:${value.continuityConflict ?? 'ok'}`}</Text>;
  }
  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: 'same-user', isAnonymous: true, source: 'anonymous' as const })}
      pendingActionQueue={queue}
      questionRepository={target}
      subscribeSessionRetry={(listener) => { signal = listener; return () => undefined; }}
    >
      <IdentityConsumer />
    </AppProviders>,
  );
  await waitFor(() => expect(view.getByText('same-user:anonymous:ok')).toBeTruthy());
  await queue.enqueue({
    id: '10000000-0000-4000-8000-000000000106', type: 'skip', questionId: 'q106', ownerId: 'same-user',
  });
  await act(async () => signal({ userId: 'same-user', isAnonymous: false }));

  await waitFor(() => expect(view.getByText('same-user:permanent:ok')).toBeTruthy());
  await waitFor(() => expect(target.skip).toHaveBeenCalledTimes(1));
  expect(await queue.list()).toEqual([]);
});

test('aligns context to a different permanent server uid and disables mutations', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  const target = repository();
  let signal!: (identity?: { userId: string; isAnonymous: boolean } | null) => void;
  function IdentityConsumer() {
    const value = useSession();
    return <Text>{`${value.userId}:${value.source}:${value.canMutate}:${value.continuityConflict ?? 'ok'}`}</Text>;
  }
  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: 'permanent-a', isAnonymous: false, source: 'permanent' as const })}
      pendingActionQueue={queue}
      questionRepository={target}
      subscribeSessionRetry={(listener) => { signal = listener; return () => undefined; }}
    >
      <IdentityConsumer />
    </AppProviders>,
  );
  await waitFor(() => expect(view.getByText('permanent-a:permanent:true:ok')).toBeTruthy());
  await queue.enqueue({
    id: '10000000-0000-4000-8000-000000000107', type: 'skip', questionId: 'q107', ownerId: 'permanent-a',
  });
  await act(async () => signal({ userId: 'permanent-b', isAnonymous: false }));

  await waitFor(() => expect(view.getByText(/permanent-b:permanent:false:.*자동으로 합칠 수 없어요/)).toBeTruthy());
  expect(target.skip).not.toHaveBeenCalled();
  expect(await queue.list()).toHaveLength(1);
});

test('moves to a signed-out error state and disables pending writes on a null auth event', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  const target = repository();
  let signal!: (identity?: { userId: string; isAnonymous: boolean } | null) => void;
  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: 'permanent-a', isAnonymous: false, source: 'permanent' as const })}
      pendingActionQueue={queue}
      questionRepository={target}
      subscribeSessionRetry={(listener) => { signal = listener; return () => undefined; }}
    >
      <SessionConsumer />
    </AppProviders>,
  );
  await waitFor(() => expect(view.getByText('ready:permanent-a')).toBeTruthy());
  await queue.enqueue({
    id: '10000000-0000-4000-8000-000000000108', type: 'skip', questionId: 'q108', ownerId: 'permanent-a',
  });
  await act(async () => signal(null));

  await waitFor(() => expect(view.getByLabelText('session-error')).toHaveTextContent(/로그아웃/));
  expect(target.skip).not.toHaveBeenCalled();
  expect(await queue.list()).toHaveLength(1);
});

test.each([
  ['a different uid', { userId: 'permanent-b', isAnonymous: false }],
  ['sign-out', null],
] as const)('stops an active owner-a flush before its second action after %s', async (_case, authEvent) => {
  const queue = createPendingActionQueue(new Map<string, string>());
  const firstId = '10000000-0000-4000-8000-000000000109';
  const secondId = '10000000-0000-4000-8000-000000000110';
  await queue.enqueue({ id: firstId, type: 'skip', questionId: 'q109', ownerId: 'permanent-a' });
  await queue.enqueue({ id: secondId, type: 'skip', questionId: 'q110', ownerId: 'permanent-a' });
  let releaseFirst!: () => void;
  const firstSend = new Promise<void>((resolve) => { releaseFirst = resolve; });
  const target = repository();
  (target.skip as jest.Mock)
    .mockImplementationOnce(() => firstSend)
    .mockResolvedValue(undefined);
  let signal!: (identity?: { userId: string; isAnonymous: boolean } | null) => void;
  const view = await render(
    <AppProviders
      loadSession={async () => ({ userId: 'permanent-a', isAnonymous: false, source: 'permanent' as const })}
      pendingActionQueue={queue}
      questionRepository={target}
      subscribeSessionRetry={(listener) => { signal = listener; return () => undefined; }}
    >
      <SessionConsumer />
    </AppProviders>,
  );
  await waitFor(() => expect(target.skip).toHaveBeenCalledTimes(1));
  expect(signal).toBeDefined();

  await act(async () => signal(authEvent));
  await act(async () => releaseFirst());

  await waitFor(async () => expect(await queue.list()).toEqual([
    expect.objectContaining({ id: secondId, ownerId: 'permanent-a' }),
  ]));
  expect(target.skip).toHaveBeenCalledTimes(1);
  if (authEvent) {
    expect(view.getByText('ready:permanent-b')).toBeTruthy();
  } else {
    expect(view.getByLabelText('session-error')).toHaveTextContent(/로그아웃/);
  }
});
