import {
  isDuplicateVoteError,
  isRetryableTransportError,
  type QuestionRepository,
} from '@/src/features/play/data/QuestionRepository';
import type { VoteReceipt } from '@/src/features/play/domain/question';

export type PendingAction =
  | {
      id: string;
      type: 'vote';
      questionId: string;
      choice: 'A' | 'B';
      ownerId?: string;
      localGuestId?: string;
    }
  | { id: string; type: 'skip'; questionId: string; ownerId?: string; localGuestId?: string };

export interface CompletedVote {
  actionId: string;
  questionId: string;
  choice: 'A' | 'B';
  ownerId: string;
  receipt: VoteReceipt;
}

export type PendingActionStorage =
  | Map<string, string>
  | Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface PendingActionQueue {
  enqueue(action: PendingAction): Promise<void>;
  list(): Promise<PendingAction[]>;
  remove(id: string): Promise<void>;
  claimOwner(fromOwnerId: string, toOwnerId: string): Promise<void>;
  completeVote(actionId: string, receipt: VoteReceipt): Promise<void>;
  peekVoteOutcome(questionId: string, ownerId: string): Promise<CompletedVote | null>;
  acknowledgeVoteOutcome(actionId: string): Promise<void>;
  subscribe(listener: () => void): () => void;
  flush(
    send: (action: PendingAction) => Promise<unknown>,
    ownerId?: string,
    shouldContinue?: () => boolean,
  ): Promise<void>;
}

const PENDING_ACTIONS_KEY = 'balance_pending_actions';
const COMPLETED_VOTES_KEY = 'balance_completed_votes';
const DEFAULT_STORAGE_IDENTITY = {};

interface SharedQueueState {
  operation: Promise<void>;
  flushPromise: Promise<void> | null;
  listeners: Set<() => void>;
}

const queueStates = new WeakMap<object, SharedQueueState>();

export class PendingActionStorageError extends Error {
  readonly code = 'invalid_pending_action_storage';

  constructor(message = 'Stored pending actions are malformed') {
    super(message);
    this.name = 'PendingActionStorageError';
  }
}

export class PendingQueueFlushInProgressError extends Error {
  readonly code = 'pending_queue_flush_in_progress';

  constructor() {
    super('A pending action flush is already in progress');
    this.name = 'PendingQueueFlushInProgressError';
  }
}

function defaultStorage(): Storage {
  if (!globalThis.localStorage) {
    require('expo-sqlite/localStorage/install');
  }
  return globalThis.localStorage;
}

function read(storage: PendingActionStorage, key: string): string | null {
  if (storage instanceof Map) return storage.get(key) ?? null;
  return storage.getItem(key);
}

function write(storage: PendingActionStorage, key: string, value: string): void {
  if (storage instanceof Map) {
    storage.set(key, value);
    return;
  }
  storage.setItem(key, value);
}

function removeKey(storage: PendingActionStorage, key: string): void {
  if (storage instanceof Map) {
    storage.delete(key);
    return;
  }
  storage.removeItem(key);
}

function isPendingAction(value: unknown): value is PendingAction {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  const common =
    typeof item.id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id) &&
    typeof item.questionId === 'string' &&
    item.questionId.length > 0 &&
    (item.ownerId === undefined || (typeof item.ownerId === 'string' && item.ownerId.length > 0)) &&
    (item.localGuestId === undefined || typeof item.localGuestId === 'string');
  if (!common) return false;
  if (item.type === 'skip') return true;
  return item.type === 'vote' && (item.choice === 'A' || item.choice === 'B');
}

function isCompletedVote(value: unknown): value is CompletedVote {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.actionId === 'string'
    && typeof item.questionId === 'string'
    && (item.choice === 'A' || item.choice === 'B')
    && typeof item.ownerId === 'string'
    && typeof item.receipt === 'object'
    && item.receipt !== null;
}

function parseCompletedVotes(serialized: string | null): CompletedVote[] {
  if (serialized === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new PendingActionStorageError('Stored completed votes are malformed');
  }
  if (!Array.isArray(parsed) || !parsed.every(isCompletedVote)) {
    throw new PendingActionStorageError('Stored completed votes are malformed');
  }
  return parsed;
}

function parseActions(serialized: string | null): PendingAction[] {
  if (serialized === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new PendingActionStorageError();
  }
  if (!Array.isArray(parsed) || !parsed.every(isPendingAction)) {
    throw new PendingActionStorageError();
  }
  return parsed;
}

function stateFor(identity: object): SharedQueueState {
  const existing = queueStates.get(identity);
  if (existing) return existing;
  const state = { operation: Promise.resolve(), flushPromise: null, listeners: new Set<() => void>() };
  queueStates.set(identity, state);
  return state;
}

export function createPendingActionQueue(
  providedStorage?: PendingActionStorage,
): PendingActionQueue {
  const identity = providedStorage ?? DEFAULT_STORAGE_IDENTITY;
  const state = stateFor(identity);

  function storage(): PendingActionStorage {
    return providedStorage ?? defaultStorage();
  }

  function actions(): PendingAction[] {
    return parseActions(read(storage(), PENDING_ACTIONS_KEY));
  }

  function replace(items: PendingAction[]): void {
    if (items.length === 0) {
      removeKey(storage(), PENDING_ACTIONS_KEY);
      return;
    }
    write(storage(), PENDING_ACTIONS_KEY, JSON.stringify(items));
  }

  function completedVotes(): CompletedVote[] {
    return parseCompletedVotes(read(storage(), COMPLETED_VOTES_KEY));
  }

  function replaceCompleted(items: CompletedVote[]): void {
    if (items.length === 0) {
      removeKey(storage(), COMPLETED_VOTES_KEY);
      return;
    }
    write(storage(), COMPLETED_VOTES_KEY, JSON.stringify(items));
  }

  function notify(): void {
    for (const listener of state.listeners) listener();
  }

  function complete(action: PendingAction, receipt: VoteReceipt): void {
    if (action.type !== 'vote') return;
    replaceCompleted([
      ...completedVotes().filter((item) => item.actionId !== action.id),
      { actionId: action.id, questionId: action.questionId, choice: action.choice, ownerId: action.ownerId ?? 'legacy_unowned', receipt },
    ]);
    replace(actions().filter((item) => item.id !== action.id));
  }

  function runExclusive<T>(operation: () => Promise<T> | T): Promise<T> {
    const result = state.operation.then(operation, operation);
    state.operation = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  return {
    enqueue(action) {
      return runExclusive(() => {
        if (!isPendingAction(action)) throw new PendingActionStorageError('Pending action is malformed');
        replace([...actions(), action]);
      });
    },
    list() {
      return runExclusive(actions);
    },
    remove(id) {
      return runExclusive(() => {
        replace(actions().filter((item) => item.id !== id));
      });
    },
    claimOwner(fromOwnerId, toOwnerId) {
      return runExclusive(() => {
        replace(actions().map((action) => action.ownerId === fromOwnerId
          ? { ...action, ownerId: toOwnerId, localGuestId: action.localGuestId ?? fromOwnerId }
          : action));
      });
    },
    completeVote(actionId, receipt) {
      return runExclusive(() => {
        const action = actions().find((item) => item.id === actionId);
        if (!action || action.type !== 'vote') return;
        complete(action, receipt);
        notify();
      });
    },
    peekVoteOutcome(questionId, ownerId) {
      return runExclusive(() => completedVotes().find(
        (item) => item.questionId === questionId && item.ownerId === ownerId,
      ) ?? null);
    },
    acknowledgeVoteOutcome(actionId) {
      return runExclusive(() => {
        replaceCompleted(completedVotes().filter((item) => item.actionId !== actionId));
      });
    },
    subscribe(listener) {
      state.listeners.add(listener);
      return () => state.listeners.delete(listener);
    },
    flush(send, ownerId, shouldContinue = () => true) {
      if (state.flushPromise) {
        return Promise.reject(new PendingQueueFlushInProgressError());
      }
      const activeFlush = (async () => {
        while (true) {
          if (!shouldContinue()) return;
          const action = await runExclusive(() => actions().find((item) => ownerId === undefined || item.ownerId === ownerId));
          if (!action) return;
          if (!shouldContinue()) return;
          try {
            const result = await send(action);
            if (action.type === 'vote') {
              await runExclusive(() => {
                complete(action, result as VoteReceipt);
                notify();
              });
              continue;
            }
          } catch (error) {
            if ((action.type === 'vote' && isDuplicateVoteError(error)) || !isRetryableTransportError(error)) {
              await runExclusive(() => {
                replace(actions().filter((item) => item.id !== action.id));
                notify();
              });
            }
            throw error;
          }
          await runExclusive(() => {
            replace(actions().filter((item) => item.id !== action.id));
            notify();
          });
        }
      })();
      const sharedFlush = activeFlush.finally(() => {
        if (state.flushPromise === sharedFlush) state.flushPromise = null;
      });
      state.flushPromise = sharedFlush;
      return sharedFlush;
    },
  };
}

export function createPendingActionSender(
  repository: QuestionRepository,
  userId: string,
): (action: PendingAction) => Promise<unknown> {
  return (action) => {
    if (action.type === 'vote') {
      return repository.vote({
        actionId: action.id,
        choice: action.choice,
        questionId: action.questionId,
        userId,
      });
    }
    return repository.skip({ questionId: action.questionId, userId });
  };
}

export const pendingActionQueue = createPendingActionQueue();
