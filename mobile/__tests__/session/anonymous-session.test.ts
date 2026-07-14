import {
  AccountContinuityError,
  CaptchaUnavailableError,
  type AuthClient,
  ensureAnonymousSession,
  getOrCreateOnlineFirstSession,
  linkOAuthIdentity,
  upgradeAnonymousIdentity,
} from '@/src/features/session/data/session';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';

type MockAuthClient = AuthClient & {
  auth: AuthClient['auth'] & {
    getSession: jest.Mock;
    signInAnonymously: jest.Mock;
    updateUser: jest.Mock;
    linkIdentity: jest.Mock;
  };
};

function authClient(userId: string | null = null, isAnonymous = true): MockAuthClient {
  let currentUserId = userId;
  return {
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: currentUserId ? { user: { id: currentUserId, is_anonymous: isAnonymous } } : null },
        error: null,
      })),
      signInAnonymously: jest.fn(async () => {
        currentUserId = 'anonymous-user';
        return { data: { user: { id: currentUserId, is_anonymous: true } }, error: null };
      }),
      updateUser: jest.fn(async () => ({ data: { user: { id: currentUserId } }, error: null })),
      linkIdentity: jest.fn(async () => ({ data: {}, error: null })),
    },
  } as unknown as MockAuthClient;
}

test('boots concurrent callers through one anonymous sign-in', async () => {
  const client = authClient();
  let release!: () => void;
  client.auth.signInAnonymously.mockImplementation(async () => {
    await new Promise<void>((resolve) => { release = resolve; });
    return { data: { user: { id: 'anonymous-user' } }, error: null };
  });

  const first = ensureAnonymousSession(client);
  const second = ensureAnonymousSession(client);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  release();

  await expect(Promise.all([first, second])).resolves.toEqual([
    { userId: 'anonymous-user', isAnonymous: true },
    { userId: 'anonymous-user', isAnonymous: true },
  ]);
  expect(client.auth.signInAnonymously).toHaveBeenCalledTimes(1);
});

test('retries session boot after a transient anonymous sign-in failure', async () => {
  const client = authClient();
  client.auth.signInAnonymously
    .mockResolvedValueOnce({ data: { user: null }, error: new Error('offline') })
    .mockResolvedValueOnce({ data: { user: { id: 'anonymous-user' } }, error: null });

  await expect(ensureAnonymousSession(client)).rejects.toThrow('offline');
  await expect(ensureAnonymousSession(client)).resolves.toEqual({ userId: 'anonymous-user', isAnonymous: true });
  expect(client.auth.signInAnonymously).toHaveBeenCalledTimes(2);
});

test('falls back to the persistent local guest while offline', async () => {
  const client = authClient();
  client.auth.signInAnonymously.mockResolvedValue({
    data: { user: null },
    error: new Error('offline'),
  });
  const storage = new Map<string, string>();

  const session = await getOrCreateOnlineFirstSession({
    client,
    storage,
    createId: () => '10000000-0000-0000-0000-000000000001',
  });

  expect(session).toEqual({
    userId: 'guest_10000000-0000-0000-0000-000000000001',
    isAnonymous: false,
    source: 'offline',
  });
});

test('flushes queued actions under the anonymous uid without changing action ids', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  const action = {
    id: '10000000-0000-0000-0000-000000000002',
    type: 'vote' as const,
    questionId: 'q1',
    choice: 'A' as const,
  };
  await queue.enqueue(action);
  const sent = jest.fn();

  await queue.flush(async (pending) => sent({ ...pending, userId: 'anonymous-user' }));

  expect(sent).toHaveBeenCalledWith({ ...action, userId: 'anonymous-user' });
  expect(await queue.list()).toEqual([]);
});

test.each([
  ['email', { email: 'new@example.com', password: 'safe-password' }],
  ['phone', { phone: '+821012345678', password: 'safe-password' }],
] as const)('upgrades the current anonymous user with %s in place', async (_kind, attributes) => {
  const client = authClient('anonymous-user');

  await expect(upgradeAnonymousIdentity(attributes, client)).resolves.toBe('anonymous-user');

  expect(client.auth.updateUser).toHaveBeenCalledWith(attributes);
});

test('links OAuth to the current anonymous user while preserving auth.uid', async () => {
  const client = authClient('anonymous-user');

  await expect(linkOAuthIdentity('google', client)).resolves.toBe('anonymous-user');

  expect(client.auth.linkIdentity).toHaveBeenCalledWith({ provider: 'google' });
});

test('rejects a provider response that would silently merge into another account', async () => {
  const client = authClient('anonymous-user');
  client.auth.updateUser.mockResolvedValue({
    data: { user: { id: 'existing-user' } },
    error: null,
  });

  await expect(
    upgradeAnonymousIdentity({ email: 'existing@example.com' }, client),
  ).rejects.toBeInstanceOf(AccountContinuityError);
});

test('does not run an anonymous upgrade against an already permanent session', async () => {
  const client = authClient('permanent-user');
  client.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: 'permanent-user', is_anonymous: false } } },
    error: null,
  });

  await expect(
    upgradeAnonymousIdentity({ email: 'replacement@example.com' }, client),
  ).rejects.toBeInstanceOf(AccountContinuityError);
  expect(client.auth.updateUser).not.toHaveBeenCalled();
});

test('fails closed when production requires CAPTCHA but no provider is wired', async () => {
  await expect(getOrCreateOnlineFirstSession({
    client: authClient(),
    captchaRequired: true,
    storage: new Map<string, string>(),
  })).rejects.toBeInstanceOf(CaptchaUnavailableError);
});

test.each([
  ['anonymous', true, 'anonymous'],
  ['permanent', false, 'permanent'],
] as const)('reuses an existing %s session without requesting CAPTCHA', async (_kind, isAnonymous, source) => {
  const client = authClient('cached-user', isAnonymous);
  const tokenProvider = { getToken: jest.fn() };

  await expect(getOrCreateOnlineFirstSession({
    client, captchaRequired: true, captchaTokenProvider: tokenProvider,
  })).resolves.toEqual({ userId: 'cached-user', isAnonymous, source });

  expect(tokenProvider.getToken).not.toHaveBeenCalled();
  expect(client.auth.signInAnonymously).not.toHaveBeenCalled();
});

test('refreshes an expired CAPTCHA token before anonymous sign-in', async () => {
  const client = authClient();
  const tokenProvider = {
    getToken: jest.fn()
      .mockResolvedValueOnce({ token: 'expired', expiresAt: 1 })
      .mockResolvedValueOnce({ token: 'fresh', expiresAt: 20_000 }),
  };

  await expect(getOrCreateOnlineFirstSession({
    client,
    captchaRequired: true,
    captchaTokenProvider: tokenProvider,
    now: () => 10_000,
  })).resolves.toMatchObject({ userId: 'anonymous-user', source: 'anonymous' });
  expect(tokenProvider.getToken).toHaveBeenNthCalledWith(1, { forceRefresh: false });
  expect(tokenProvider.getToken).toHaveBeenNthCalledWith(2, { forceRefresh: true });
  expect(client.auth.signInAnonymously).toHaveBeenCalledWith({ options: { captchaToken: 'fresh' } });
});

test('refreshes and retries once when Supabase rejects an expired CAPTCHA token', async () => {
  const client = authClient();
  client.auth.signInAnonymously
    .mockResolvedValueOnce({ data: { user: null }, error: { code: 'captcha_failed', message: 'expired' } })
    .mockResolvedValueOnce({ data: { user: { id: 'anonymous-user' } }, error: null });
  const tokenProvider = {
    getToken: jest.fn()
      .mockResolvedValueOnce({ token: 'first', expiresAt: 20_000 })
      .mockResolvedValueOnce({ token: 'second', expiresAt: 20_000 }),
  };

  await expect(getOrCreateOnlineFirstSession({
    client,
    captchaRequired: true,
    captchaTokenProvider: tokenProvider,
    now: () => 10_000,
  })).resolves.toMatchObject({ userId: 'anonymous-user' });
  expect(client.auth.signInAnonymously).toHaveBeenNthCalledWith(1, { options: { captchaToken: 'first' } });
  expect(client.auth.signInAnonymously).toHaveBeenNthCalledWith(2, { options: { captchaToken: 'second' } });
});

test('uses a local guest without loading Supabase when only the URL is configured', async () => {
  const previousUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://legacy-project.supabase.co';
  delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  jest.doMock('@/src/lib/supabase', () => {
    throw new Error('Supabase client must stay unloaded');
  });

  try {
    await expect(getOrCreateOnlineFirstSession({
      storage: new Map<string, string>(),
      createId: () => '10000000-0000-0000-0000-000000000099',
    })).resolves.toEqual({
      userId: 'guest_10000000-0000-0000-0000-000000000099',
      isAnonymous: false,
      source: 'offline',
    });
  } finally {
    process.env.EXPO_PUBLIC_SUPABASE_URL = previousUrl;
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
    jest.dontMock('@/src/lib/supabase');
  }
});
