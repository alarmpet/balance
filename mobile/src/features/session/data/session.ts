import { randomUUID } from 'expo-crypto';

type SessionStorage =
  | Map<string, string>
  | Pick<Storage, 'getItem' | 'setItem'>;

const GUEST_ID_KEY = 'balance_guest_id';

interface AuthUser {
  id: string;
  is_anonymous?: boolean;
}

export interface AuthClient {
  auth: {
    getSession(): Promise<{
      data: { session: { user: AuthUser } | null };
      error?: unknown;
    }>;
    signInAnonymously(options?: { options: { captchaToken: string } }): Promise<{
      data: { user: AuthUser | null };
      error: unknown;
    }>;
    updateUser(attributes: PermanentIdentityAttributes): Promise<{
      data: { user: AuthUser | null };
      error: unknown;
    }>;
    linkIdentity(credentials: { provider: string }): Promise<{
      data: unknown;
      error: unknown;
    }>;
  };
}

export type PermanentIdentityAttributes =
  | { email: string; password?: string }
  | { phone: string; password?: string };

export interface SessionIdentity {
  userId: string;
  isAnonymous: boolean;
}

const sessionBoots = new WeakMap<object, Promise<SessionIdentity>>();

export interface CaptchaToken {
  token: string;
  expiresAt: number;
}

export interface CaptchaTokenProvider {
  getToken(options: { forceRefresh: boolean }): Promise<CaptchaToken>;
}

function defaultClient(): AuthClient {
  // Keep Supabase lazy so offline/local-only tests do not need public environment variables.
  return require('@/src/lib/supabase').supabase as AuthClient;
}

export class SessionStorageError extends Error {
  readonly code = 'invalid_guest_session_storage';

  constructor(message = 'Stored guest identity is malformed') {
    super(message);
    this.name = 'SessionStorageError';
  }
}

export class AccountContinuityError extends Error {
  readonly code = 'account_continuity_conflict';

  constructor(message = 'Account upgrade would change the current user identity') {
    super(message);
    this.name = 'AccountContinuityError';
  }
}

export class CaptchaUnavailableError extends Error {
  readonly code = 'captcha_unavailable';

  constructor(message = '보안 확인을 완료할 수 없어요. 다시 시도해 주세요.') {
    super(message);
    this.name = 'CaptchaUnavailableError';
  }
}

function defaultStorage(): Storage {
  if (!globalThis.localStorage) {
    require('expo-sqlite/localStorage/install');
  }
  return globalThis.localStorage;
}

function read(storage: SessionStorage): string | null {
  if (storage instanceof Map) return storage.get(GUEST_ID_KEY) ?? null;
  return storage.getItem(GUEST_ID_KEY);
}

function write(storage: SessionStorage, userId: string): void {
  if (storage instanceof Map) {
    storage.set(GUEST_ID_KEY, userId);
    return;
  }
  storage.setItem(GUEST_ID_KEY, userId);
}

function isGuestId(value: string): boolean {
  return /^guest_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function getOrCreateGuestSession(
  storage: SessionStorage = defaultStorage(),
  createId: () => string = randomUUID,
): Promise<{ userId: string }> {
  const existing = read(storage);
  if (existing !== null) {
    if (!isGuestId(existing)) throw new SessionStorageError();
    return { userId: existing };
  }

  const userId = `guest_${createId()}`;
  if (!isGuestId(userId)) throw new SessionStorageError('Generated guest identity is malformed');
  write(storage, userId);
  return { userId };
}

async function currentUser(client: AuthClient): Promise<AuthUser | null> {
  const result = await client.auth.getSession();
  if (result.error) throw result.error;
  return result.data.session?.user ?? null;
}

async function currentUserId(client: AuthClient): Promise<string | null> {
  return (await currentUser(client))?.id ?? null;
}

/**
 * Establishes one authenticated anonymous identity in the background. Supabase
 * anonymous users use the authenticated role and retain the same auth.uid when
 * an identity is linked later.
 */
export function ensureAnonymousSession(
  providedClient?: AuthClient,
  captchaToken?: string,
): Promise<SessionIdentity> {
  const client = providedClient ?? defaultClient();
  const identity = client as object;
  const active = sessionBoots.get(identity);
  if (active) return active;

  const boot = (async () => {
    const existing = await currentUser(client);
    if (existing) return { userId: existing.id, isAnonymous: existing.is_anonymous === true };
    const result = await client.auth.signInAnonymously(
      captchaToken ? { options: { captchaToken } } : undefined,
    );
    if (result.error) throw result.error;
    if (!result.data.user) throw new Error('Anonymous sign-in returned no user');
    return { userId: result.data.user.id, isAnonymous: true };
  })();
  sessionBoots.set(identity, boot);
  void boot.finally(() => {
    if (sessionBoots.get(identity) === boot) sessionBoots.delete(identity);
  }).catch(() => undefined);
  return boot;
}

export async function getOrCreateOnlineFirstSession(options: {
  client?: AuthClient;
  storage?: SessionStorage;
  createId?: () => string;
  captchaToken?: string;
  captchaRequired?: boolean;
  captchaTokenProvider?: CaptchaTokenProvider;
  now?: () => number;
} = {}): Promise<{ userId: string; isAnonymous: boolean; source: 'anonymous' | 'permanent' | 'offline' }> {
  if (!options.client
    && (!process.env.EXPO_PUBLIC_SUPABASE_URL
      || !process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
    const guest = await getOrCreateGuestSession(options.storage, options.createId);
    return { ...guest, isAnonymous: false, source: 'offline' };
  }
  const now = options.now ?? Date.now;
  try {
    const existing = await currentUser(options.client ?? defaultClient());
    if (existing) {
      const isAnonymous = existing.is_anonymous === true;
      return { userId: existing.id, isAnonymous, source: isAnonymous ? 'anonymous' : 'permanent' };
    }

    let captchaToken = options.captchaToken;
    if (options.captchaRequired || options.captchaTokenProvider) {
      if (!options.captchaTokenProvider && !captchaToken) throw new CaptchaUnavailableError();
      if (options.captchaTokenProvider) {
        let acquired: CaptchaToken;
        try {
          acquired = await options.captchaTokenProvider.getToken({ forceRefresh: false });
          if (!acquired.token || acquired.expiresAt <= now() + 1_000) {
            acquired = await options.captchaTokenProvider.getToken({ forceRefresh: true });
          }
        } catch (error) {
          throw new CaptchaUnavailableError(error instanceof Error ? error.message : undefined);
        }
        if (!acquired.token || acquired.expiresAt <= now()) throw new CaptchaUnavailableError();
        captchaToken = acquired.token;
      }
    }

    try {
      const identity = await ensureAnonymousSession(options.client, captchaToken);
      if (!identity.isAnonymous) {
        return { ...identity, source: 'permanent' };
      }
      return {
        ...identity,
        source: 'anonymous',
      };
    } catch (error) {
      if (!isCaptchaError(error) || !options.captchaTokenProvider) throw error;
      const refreshed = await options.captchaTokenProvider.getToken({ forceRefresh: true });
      if (!refreshed.token || refreshed.expiresAt <= now()) throw new CaptchaUnavailableError();
      return {
        ...(await ensureAnonymousSession(options.client, refreshed.token)),
        source: 'anonymous',
      };
    }
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    const guest = await getOrCreateGuestSession(options.storage, options.createId);
    return { ...guest, isAnonymous: false, source: 'offline' };
  }
}

function errorCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';
}

function isCaptchaError(error: unknown): boolean {
  return errorCode(error)?.toLowerCase().includes('captcha') === true
    || /captcha|turnstile/i.test(errorMessage(error));
}

function isNetworkError(error: unknown): boolean {
  return /offline|network request failed|failed to fetch|networkerror/i.test(errorMessage(error));
}

async function requireCurrentUser(client: AuthClient): Promise<string> {
  const userId = await currentUserId(client);
  if (!userId) throw new AccountContinuityError('No current anonymous user to upgrade');
  return userId;
}

async function requireCurrentAnonymousUser(client: AuthClient): Promise<string> {
  const user = await currentUser(client);
  if (!user || user.is_anonymous === false) {
    throw new AccountContinuityError('Current session is not an anonymous user');
  }
  return user.id;
}

export async function upgradeAnonymousIdentity(
  attributes: PermanentIdentityAttributes,
  providedClient?: AuthClient,
): Promise<string> {
  const client = providedClient ?? defaultClient();
  const before = await requireCurrentAnonymousUser(client);
  const result = await client.auth.updateUser(attributes);
  if (result.error) throw result.error;
  if (!result.data.user || result.data.user.id !== before) throw new AccountContinuityError();
  const after = await requireCurrentUser(client);
  if (after !== before) throw new AccountContinuityError();
  return before;
}

export async function linkOAuthIdentity(
  provider: string,
  providedClient?: AuthClient,
): Promise<string> {
  const client = providedClient ?? defaultClient();
  const before = await requireCurrentAnonymousUser(client);
  const result = await client.auth.linkIdentity({ provider });
  if (result.error) throw result.error;
  const after = await requireCurrentUser(client);
  if (after !== before) throw new AccountContinuityError();
  return before;
}
