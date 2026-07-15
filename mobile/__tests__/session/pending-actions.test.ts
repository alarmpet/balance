import {
  DuplicateVoteError,
  RetryableTransportError,
  mapPostgresVoteError,
  type QuestionRepository,
} from '@/src/features/play/data/QuestionRepository';
import {
  createPendingActionQueue,
  createPendingActionSender,
  PendingQueueFlushInProgressError,
  PendingActionStorageError,
} from '@/src/features/session/data/pendingActions';
import {
  getOrCreateGuestSession,
  SessionStorageError,
} from '@/src/features/session/data/session';

function repository(): QuestionRepository {
  return {
    getDaily: jest.fn(),
    getFeed: jest.fn(),
    getById: jest.fn(),
    getVoteEvidence: jest.fn(),
    vote: jest.fn(),
    skip: jest.fn(),
    create: jest.fn(),
    report: jest.fn(),
  };
}

test('flushes actions in order and keeps a failed action', async () => {
  const storage = new Map<string, string>();
  const queue = createPendingActionQueue(storage);
  await queue.enqueue({
    id: '10000000-0000-0000-0000-000000000001',
    type: 'vote',
    questionId: 'q1',
    choice: 'A',
  });
  await queue.enqueue({
    id: '10000000-0000-0000-0000-000000000002',
    type: 'skip',
    questionId: 'q2',
  });
  const send = jest
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new RetryableTransportError('offline'));

  await expect(queue.flush(send)).rejects.toThrow('offline');

  expect(send.mock.calls.map(([action]) => action.id)).toEqual([
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
  ]);
  expect((await queue.list()).map((item) => item.id)).toEqual([
    '10000000-0000-0000-0000-000000000002',
  ]);
});

test('persists actions for a later queue instance and removes by id', async () => {
  const storage = new Map<string, string>();
  const firstQueue = createPendingActionQueue(storage);
  const action = {
    id: '10000000-0000-0000-0000-000000000003',
    type: 'vote' as const,
    questionId: 'q3',
    choice: 'B' as const,
  };
  await firstQueue.enqueue(action);

  const laterQueue = createPendingActionQueue(storage);
  expect(await laterQueue.list()).toEqual([action]);

  await laterQueue.remove(action.id);
  expect(await firstQueue.list()).toEqual([]);
});

test('removes an already-applied replay while preserving its action id', async () => {
  const storage = new Map<string, string>();
  const queue = createPendingActionQueue(storage);
  const action = {
    id: '10000000-0000-0000-0000-000000000004',
    type: 'vote' as const,
    questionId: 'q4',
    choice: 'A' as const,
  };
  await queue.enqueue(action);
  const send = jest.fn().mockResolvedValue({ applyStatus: 'already_applied' });

  await queue.flush(send);

  expect(send).toHaveBeenCalledWith(action);
  expect(await queue.list()).toEqual([]);
});

test('surfaces a coded duplicate vote for reconciliation without retrying it forever', async () => {
  const storage = new Map<string, string>();
  const queue = createPendingActionQueue(storage);
  await queue.enqueue({
    id: '10000000-0000-0000-0000-000000000005',
    type: 'vote',
    questionId: 'q5',
    choice: 'A',
  });
  const duplicate = { code: 'duplicate_vote', questionId: 'q5' };

  await expect(queue.flush(async () => Promise.reject(duplicate))).rejects.toBe(duplicate);

  expect(await queue.list()).toEqual([]);
});

test('does not classify an unrelated PostgreSQL unique violation as a duplicate vote', async () => {
  const storage = new Map<string, string>();
  const queue = createPendingActionQueue(storage);
  const action = {
    id: '10000000-0000-0000-0000-000000000015',
    type: 'vote' as const,
    questionId: 'q15',
    choice: 'A' as const,
  };
  await queue.enqueue(action);
  const unrelated = { code: '23505', constraint: 'profiles_username_key' };

  await expect(queue.flush(async () => Promise.reject(unrelated))).rejects.toBe(unrelated);

  expect(await queue.list()).toEqual([]);
});

test('maps only the stable cast_vote PostgREST error to DuplicateVoteError', () => {
  const mapped = mapPostgresVoteError({
    code: 'P0001',
    message: 'DUPLICATE_VOTE',
  });
  const unrelated = { code: 'P0001', message: 'SOME_OTHER_FAILURE' };

  expect(mapped).toBeInstanceOf(DuplicateVoteError);
  expect(mapPostgresVoteError(unrelated)).toBe(unrelated);
});

test('sender callbacks can inspect and mutate the queue without deadlocking flush', async () => {
  const storage = new Map<string, string>();
  const queue = createPendingActionQueue(storage);
  const action = {
    id: '10000000-0000-0000-0000-000000000016',
    type: 'skip' as const,
    questionId: 'q16',
  };
  await queue.enqueue(action);

  const flush = queue.flush(async (pending) => {
    expect(await queue.list()).toEqual([action]);
    const temporary = {
      id: '10000000-0000-0000-0000-000000000017',
      type: 'skip' as const,
      questionId: 'q17',
    };
    await queue.enqueue(temporary);
    await queue.remove(temporary.id);
    expect(pending).toEqual(action);
  });

  await expect(
    Promise.race([
      flush,
      new Promise((_, reject) => setTimeout(() => reject(new Error('flush deadlocked')), 100)),
    ]),
  ).resolves.toBeUndefined();
  expect(await queue.list()).toEqual([]);
});

test('separate queues sharing storage dispatch a pending action only once', async () => {
  const storage = new Map<string, string>();
  const first = createPendingActionQueue(storage);
  const second = createPendingActionQueue(storage);
  await first.enqueue({
    id: '10000000-0000-0000-0000-000000000018',
    type: 'skip',
    questionId: 'q18',
  });
  let release!: () => void;
  const sending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const send = jest.fn(async () => sending);

  const firstFlush = first.flush(send);
  const secondFlush = second.flush(send);
  await Promise.resolve();
  await Promise.resolve();
  expect(send).toHaveBeenCalledTimes(1);

  await expect(secondFlush).rejects.toBeInstanceOf(PendingQueueFlushInProgressError);
  release();
  await firstFlush;
  expect(send).toHaveBeenCalledTimes(1);
});

test('rejects a reentrant flush promptly instead of awaiting itself', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  await queue.enqueue({
    id: '10000000-0000-0000-0000-000000000025',
    type: 'skip',
    questionId: 'q25',
  });

  await queue.flush(async () => {
    await expect(queue.flush(async () => undefined)).rejects.toBeInstanceOf(
      PendingQueueFlushInProgressError,
    );
  });

  expect(await queue.list()).toEqual([]);
});

test('rejects malformed persisted pending actions with a typed storage error', async () => {
  const storage = new Map<string, string>([
    ['balance_pending_actions', JSON.stringify([{ id: 7, type: 'vote' }])],
  ]);

  await expect(createPendingActionQueue(storage).list()).rejects.toBeInstanceOf(
    PendingActionStorageError,
  );
});

test('maps pending action ids exactly through the repository sender adapter', async () => {
  const target = repository();
  (target.vote as jest.Mock).mockResolvedValue({ applyStatus: 'already_applied' });
  (target.skip as jest.Mock).mockResolvedValue(undefined);
  const send = createPendingActionSender(target, 'guest-user');

  await send({
    id: '10000000-0000-0000-0000-000000000019',
    type: 'vote',
    questionId: 'q19',
    choice: 'B',
  });
  await send({
    id: '10000000-0000-0000-0000-000000000020',
    type: 'skip',
    questionId: 'q20',
  });

  expect(target.vote).toHaveBeenCalledWith({
    actionId: '10000000-0000-0000-0000-000000000019',
    choice: 'B',
    questionId: 'q19',
    userId: 'guest-user',
  });
  expect(target.skip).toHaveBeenCalledWith({ questionId: 'q20', userId: 'guest-user' });
});

test('persists a completed vote across queue instances and consumes it exactly once', async () => {
  const storage = new Map<string, string>();
  const queue = createPendingActionQueue(storage);
  await queue.enqueue({
    id: '10000000-0000-0000-0000-000000000030',
    type: 'vote', questionId: 'q30', choice: 'B', ownerId: 'anonymous-user',
  });
  const receipt = {
    applyStatus: 'applied' as const, selected: 'B' as const, countA: 4, countB: 6,
    percentA: 40, percentB: 60, label: '다수파', axisScores: {},
  };

  await queue.flush(jest.fn().mockResolvedValue(receipt), 'anonymous-user');
  const restarted = createPendingActionQueue(storage);

  await expect(restarted.peekVoteOutcome('q30', 'anonymous-user'))
    .resolves.toMatchObject({ actionId: '10000000-0000-0000-0000-000000000030', receipt });
  await expect(restarted.peekVoteOutcome('q30', 'anonymous-user')).resolves.not.toBeNull();
  await restarted.acknowledgeVoteOutcome('10000000-0000-0000-0000-000000000030');
  await expect(restarted.peekVoteOutcome('q30', 'anonymous-user')).resolves.toBeNull();
});

test('claims only the offline guest owners actions and preserves guest provenance', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  await queue.enqueue({
    id: '10000000-0000-0000-0000-000000000031', type: 'skip', questionId: 'q31',
    ownerId: 'guest_10000000-0000-0000-0000-000000000031',
  });
  await queue.enqueue({
    id: '10000000-0000-0000-0000-000000000032', type: 'skip', questionId: 'q32',
    ownerId: 'other-owner',
  });

  await queue.claimOwner('guest_10000000-0000-0000-0000-000000000031', 'anonymous-user');

  expect(await queue.list()).toEqual([
    expect.objectContaining({ ownerId: 'anonymous-user', localGuestId: 'guest_10000000-0000-0000-0000-000000000031' }),
    expect.objectContaining({ ownerId: 'other-owner' }),
  ]);
  expect((await queue.list())[1]).not.toHaveProperty('localGuestId');
});

test('creates one persistent guest identity and reuses it on later launches', async () => {
  const storage = new Map<string, string>();
  const createId = jest.fn().mockReturnValue('10000000-0000-0000-0000-000000000006');

  const first = await getOrCreateGuestSession(storage, createId);
  const later = await getOrCreateGuestSession(storage, createId);

  expect(first).toEqual({ userId: 'guest_10000000-0000-0000-0000-000000000006' });
  expect(later).toEqual(first);
  expect(createId).toHaveBeenCalledTimes(1);
});

test('rejects a malformed persisted guest identity with a typed storage error', async () => {
  const storage = new Map<string, string>([['balance_guest_id', 'local-user']]);

  await expect(getOrCreateGuestSession(storage)).rejects.toBeInstanceOf(SessionStorageError);
});

test('does not persist a malformed generated guest identity', async () => {
  const storage = new Map<string, string>();

  await expect(getOrCreateGuestSession(storage, () => 'not-a-uuid')).rejects.toBeInstanceOf(
    SessionStorageError,
  );
  expect(storage.has('balance_guest_id')).toBe(false);
});
