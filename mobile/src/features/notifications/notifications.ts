import { randomUUID } from 'expo-crypto';
import type { NotificationEvent } from '../../../supabase/functions/send-question-notification/index';

export const NOTIFICATION_EVENTS = ['first_vote', 'meaningful_sample', 'question_closed'] as const;
export type OnlineIdentity = {
  userId: string;
  source: 'anonymous' | 'permanent' | 'offline';
};
export interface InstallationCredentials { installationId: string; revocationKey: string }

export interface NotificationDependencies {
  platform: 'ios' | 'android' | 'web';
  projectId?: string;
  setAndroidChannel(): Promise<void>;
  getPermissions(): Promise<{ granted: boolean; status: string; iosStatus?: number }>;
  requestPermissions(): Promise<{ granted: boolean; status: string; iosStatus?: number }>;
  getExpoPushToken(projectId?: string): Promise<string>;
  getInstallation(): Promise<InstallationCredentials>;
  getRegisteredUserId(): Promise<string | null>;
  saveToken(input: InstallationCredentials & {
    userId: string; token: string; platform: 'ios' | 'android'; enabledEvents: readonly NotificationEvent[];
  }): Promise<void>;
  revokeInstallation(input: InstallationCredentials): Promise<boolean>;
  enqueueRevocation(input: InstallationCredentials): Promise<void>;
  pendingRevocations(): Promise<InstallationCredentials[]>;
  removeRevocation(installationId: string): Promise<void>;
  addPushTokenListener(listener: () => void): { remove(): void };
}

type RegisterResult =
  | { status: 'registered'; token: string }
  | { status: 'denied' | 'unsupported' | 'mutation_blocked' | 'offline' | 'cancelled' | 'invalid_identity' };

const installationKey = 'balance_notification_installation';
const registeredUserKey = 'balance_notification_registered_user';
const revocationQueueKey = 'balance_notification_revocation_queue';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const opaqueKey = /^[A-Za-z0-9_-]{32,128}$/;

function storage(): Storage {
  if (!globalThis.localStorage) require('expo-sqlite/localStorage/install');
  return globalThis.localStorage;
}

async function defaultInstallation(): Promise<InstallationCredentials> {
  const existing = storage().getItem(installationKey);
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as InstallationCredentials;
      if (uuid.test(parsed.installationId) && opaqueKey.test(parsed.revocationKey)) return parsed;
    } catch { /* replace malformed local state */ }
  }
  const value = {
    installationId: randomUUID(),
    revocationKey: `${randomUUID().replaceAll('-', '')}${randomUUID().replaceAll('-', '')}`,
  };
  storage().setItem(installationKey, JSON.stringify(value));
  return value;
}

function defaultDependencies(): NotificationDependencies {
  const { Platform } = require('react-native') as typeof import('react-native');
  const unsupported = async () => { throw new Error('Notifications are unavailable on web'); };
  if (Platform.OS === 'web') return {
    platform: 'web', setAndroidChannel: unsupported, getPermissions: unsupported,
    requestPermissions: unsupported, getExpoPushToken: unsupported, getInstallation: defaultInstallation,
    getRegisteredUserId: async () => storage().getItem(registeredUserKey), saveToken: unsupported,
    revokeInstallation: async () => false, ...defaultQueueDependencies(), addPushTokenListener: () => ({ remove() {} }),
  };
  const Constants = require('expo-constants').default as typeof import('expo-constants').default;
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  return {
    platform: Platform.OS as 'ios' | 'android', projectId,
    async setAndroidChannel() {
      if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('question-updates', {
        name: '내 질문 소식', importance: Notifications.AndroidImportance.DEFAULT,
      });
    },
    async getPermissions() {
      const value = await Notifications.getPermissionsAsync();
      return { granted: value.granted, status: value.status, iosStatus: value.ios?.status };
    },
    async requestPermissions() {
      const value = await Notifications.requestPermissionsAsync();
      return { granted: value.granted, status: value.status, iosStatus: value.ios?.status };
    },
    async getExpoPushToken(explicitProjectId) {
      return (await Notifications.getExpoPushTokenAsync({ projectId: explicitProjectId })).data;
    },
    getInstallation: defaultInstallation,
    async getRegisteredUserId() { return storage().getItem(registeredUserKey); },
    async saveToken(input) {
      const { supabase } = require('@/src/lib/supabase');
      const { error } = await supabase.rpc('replace_push_token', {
        p_installation_id: input.installationId, p_token: input.token, p_platform: input.platform,
        p_enabled_events: input.enabledEvents, p_revocation_key: input.revocationKey,
      });
      if (error) throw error;
      storage().setItem(registeredUserKey, input.userId);
    },
    async revokeInstallation(input) {
      const { supabase } = require('@/src/lib/supabase');
      const { data, error } = await supabase.functions.invoke('send-question-notification', {
        body: { action: 'revoke_token', installationId: input.installationId, revocationKey: input.revocationKey },
      });
      if (error) throw error;
      storage().removeItem(registeredUserKey);
      // A successful Edge response is an idempotent terminal acknowledgement: the row
      // may already have been removed by an earlier request whose response was lost.
      return data?.revoked === true || data?.revoked === false;
    },
    ...defaultQueueDependencies(),
    addPushTokenListener(listener) { return Notifications.addPushTokenListener(listener); },
  };
}

function defaultQueueDependencies() {
  return {
    async enqueueRevocation(input: InstallationCredentials) {
      const queue = readRevocationQueue();
      if (!queue.some((item) => item.installationId === input.installationId)) queue.push(input);
      storage().setItem(revocationQueueKey, JSON.stringify(queue));
    },
    async pendingRevocations() { return readRevocationQueue(); },
    async removeRevocation(installationId: string) {
      storage().setItem(revocationQueueKey, JSON.stringify(readRevocationQueue().filter((item) => item.installationId !== installationId)));
    },
  };
}

function readRevocationQueue(): InstallationCredentials[] {
  try {
    const value = JSON.parse(storage().getItem(revocationQueueKey) ?? '[]');
    return Array.isArray(value) ? value.filter((item) => uuid.test(item?.installationId) && opaqueKey.test(item?.revocationKey)) : [];
  } catch { return []; }
}

async function durableRevoke(dependencies: NotificationDependencies, installation: InstallationCredentials): Promise<boolean> {
  await dependencies.enqueueRevocation(installation);
  try {
    const revoked = await dependencies.revokeInstallation(installation);
    if (revoked) await dependencies.removeRevocation(installation.installationId);
    return revoked;
  } catch { return false; }
}

export async function flushNotificationRevocations(dependencies: NotificationDependencies = defaultDependencies()): Promise<void> {
  for (const installation of await dependencies.pendingRevocations()) await durableRevoke(dependencies, installation);
}

function permissionGranted(value: { granted: boolean; iosStatus?: number }): boolean {
  return value.granted || value.iosStatus === 3 || value.iosStatus === 4;
}

function online(identity: OnlineIdentity): boolean {
  return identity.source !== 'offline' && uuid.test(identity.userId);
}

export async function registerNotifications(options: {
  identity: OnlineIdentity;
  shouldContinue(): boolean;
  enabledEvents?: readonly NotificationEvent[];
  dependencies?: NotificationDependencies;
}): Promise<RegisterResult> {
  if (options.identity.source === 'offline') return { status: 'offline' };
  if (!uuid.test(options.identity.userId)) return { status: 'invalid_identity' };
  if (!options.shouldContinue()) return { status: 'mutation_blocked' };
  const dependencies = options.dependencies ?? defaultDependencies();
  if (dependencies.platform === 'web') return { status: 'unsupported' };
  await dependencies.setAndroidChannel();
  if (!options.shouldContinue()) return { status: 'cancelled' };
  let permission = await dependencies.getPermissions();
  if (!options.shouldContinue()) return { status: 'cancelled' };
  if (!permissionGranted(permission)) {
    permission = await dependencies.requestPermissions();
    if (!options.shouldContinue()) return { status: 'cancelled' };
  }
  if (!permissionGranted(permission)) return { status: 'denied' };
  const installation = await dependencies.getInstallation();
  if (!options.shouldContinue()) return { status: 'cancelled' };
  const token = await dependencies.getExpoPushToken(dependencies.projectId);
  if (!options.shouldContinue()) return { status: 'cancelled' };
  await dependencies.saveToken({
    ...installation, userId: options.identity.userId, token,
    platform: dependencies.platform, enabledEvents: options.enabledEvents ?? NOTIFICATION_EVENTS,
  });
  if (!options.shouldContinue()) {
    await durableRevoke(dependencies, installation);
    return { status: 'cancelled' };
  }
  return { status: 'registered', token };
}

export function subscribeToPushTokenChanges(options: {
  identity: OnlineIdentity;
  shouldContinue(): boolean;
  enabledEvents?: readonly NotificationEvent[];
  dependencies?: NotificationDependencies;
}): { remove(): void } {
  const dependencies = options.dependencies ?? defaultDependencies();
  if (dependencies.platform === 'web' || !online(options.identity)) return { remove() {} };
  return dependencies.addPushTokenListener(() => {
    if (!options.shouldContinue()) return;
    void (async () => {
      const registeredUserId = await dependencies.getRegisteredUserId();
      if (registeredUserId !== options.identity.userId || !options.shouldContinue()) return;
      const installation = await dependencies.getInstallation();
      if (!options.shouldContinue()) return;
      const token = await dependencies.getExpoPushToken(dependencies.projectId);
      if (!options.shouldContinue()) return;
      await dependencies.saveToken({
        ...installation, userId: options.identity.userId, token,
        platform: dependencies.platform as 'ios' | 'android',
        enabledEvents: options.enabledEvents ?? NOTIFICATION_EVENTS,
      });
      if (!options.shouldContinue()) await durableRevoke(dependencies, installation);
    })().catch(() => undefined);
  });
}

export async function reconcileNotificationInstallation(
  currentUserId: string | null,
  dependencies: NotificationDependencies = defaultDependencies(),
  canMutate = true,
): Promise<void> {
  await flushNotificationRevocations(dependencies);
  const registeredUserId = await dependencies.getRegisteredUserId();
  if (!registeredUserId || (registeredUserId === currentUserId && canMutate)) return;
  const installation = await dependencies.getInstallation();
  await durableRevoke(dependencies, installation);
}

export function notificationDeepLink(questionId: string): string {
  if (!uuid.test(questionId)) throw new Error('Invalid question ID');
  return `mobile://question/${questionId}?source=notification`;
}

export function parseNotificationDeepLink(value: string): { questionId: string; source: 'notification' } | null {
  try {
    const url = new URL(value); const questionId = url.pathname.replace(/^\//, '');
    if (url.protocol !== 'mobile:' || url.hostname !== 'question' || !uuid.test(questionId)
      || url.searchParams.get('source') !== 'notification') return null;
    return { questionId, source: 'notification' };
  } catch { return null; }
}

interface NotificationResponse { id: string; url: string }
const consumedNotificationResponses = new Set<string>();
export interface NotificationResponseDependencies {
  addResponseListener(listener: (response: unknown) => void): { remove(): void };
  getLastResponse(): Promise<unknown>;
  clearLastResponse(): Promise<void>;
  openUrl(url: string): Promise<unknown>;
}

function responseFromNative(value: any): NotificationResponse | null {
  const id = value?.notification?.request?.identifier;
  const url = value?.notification?.request?.content?.data?.url;
  return typeof id === 'string' && typeof url === 'string' ? { id, url } : null;
}

function defaultResponseDependencies(): NotificationResponseDependencies {
  const Linking = require('expo-linking') as typeof import('expo-linking');
  const { Platform } = require('react-native') as typeof import('react-native');
  if (Platform.OS === 'web') return {
    addResponseListener: () => ({ remove() {} }), getLastResponse: async () => null,
    clearLastResponse: async () => undefined, openUrl: Linking.openURL,
  };
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  return {
    addResponseListener(listener) {
      return Notifications.addNotificationResponseReceivedListener((value) => listener(responseFromNative(value)));
    },
    async getLastResponse() { return responseFromNative(await Notifications.getLastNotificationResponseAsync()); },
    clearLastResponse: Notifications.clearLastNotificationResponseAsync,
    openUrl: Linking.openURL,
  };
}

function asResponse(value: unknown): NotificationResponse | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && candidate.id.length > 0 && typeof candidate.url === 'string'
    ? { id: candidate.id, url: candidate.url } : null;
}

export function subscribeToNotificationResponses(options: {
  dependencies?: NotificationResponseDependencies;
  onOpen?: (input: { questionId: string; source: 'notification' }) => void;
} = {}): { remove(): void; ready: Promise<void> } {
  const dependencies = options.dependencies ?? defaultResponseDependencies();
  let disposed = false;
  const handle = async (value: unknown, cold: boolean) => {
    if (disposed) return;
    const response = asResponse(value); if (!response || consumedNotificationResponses.has(response.id)) return;
    const parsed = parseNotificationDeepLink(response.url); if (!parsed) return;
    consumedNotificationResponses.add(response.id);
    try {
      await dependencies.openUrl(response.url);
      if (disposed) return;
      options.onOpen?.(parsed);
      if (cold) await dependencies.clearLastResponse();
    } catch { consumedNotificationResponses.delete(response.id); }
  };
  const subscription = dependencies.addResponseListener((value) => { void handle(value, false); });
  const ready = dependencies.getLastResponse().then((value) => handle(value, true)).catch(() => undefined);
  return { remove: () => { disposed = true; subscription.remove(); }, ready };
}
