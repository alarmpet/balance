import {
  notificationDeepLink,
  parseNotificationDeepLink,
  reconcileNotificationInstallation,
  flushNotificationRevocations,
  registerNotifications,
  subscribeToNotificationResponses,
  subscribeToPushTokenChanges,
} from '@/src/features/notifications/notifications';

const userId = '71000000-0000-0000-0000-000000000001';
const installation = {
  installationId: '75000000-0000-0000-0000-000000000001',
  revocationKey: 'abcdefghijklmnopqrstuvwxyzABCDEF012345',
};

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    platform: 'android' as const,
    projectId: 'project-id',
    setAndroidChannel: jest.fn().mockResolvedValue(undefined),
    getPermissions: jest.fn().mockResolvedValue({ granted: false, status: 'undetermined' }),
    requestPermissions: jest.fn().mockResolvedValue({ granted: true, status: 'granted' }),
    getExpoPushToken: jest.fn().mockResolvedValue('ExponentPushToken[token-1]'),
    getInstallation: jest.fn().mockResolvedValue(installation),
    saveToken: jest.fn().mockResolvedValue(undefined),
    revokeInstallation: jest.fn().mockResolvedValue(true),
    enqueueRevocation: jest.fn().mockResolvedValue(undefined),
    pendingRevocations: jest.fn().mockResolvedValue([]),
    removeRevocation: jest.fn().mockResolvedValue(undefined),
    getRegisteredUserId: jest.fn().mockResolvedValue(null),
    addPushTokenListener: jest.fn(),
    ...overrides,
  };
}

test('requests opt-in and stores the token preferences only when explicitly registered', async () => {
  const deps = dependencies();
  expect(deps.requestPermissions).not.toHaveBeenCalled();

  await expect(registerNotifications({
    identity: { userId, source: 'anonymous' }, shouldContinue: () => true, dependencies: deps,
  })).resolves.toEqual({
    status: 'registered',
    token: 'ExponentPushToken[token-1]',
  });

  expect(deps.setAndroidChannel.mock.invocationCallOrder[0])
    .toBeLessThan(deps.requestPermissions.mock.invocationCallOrder[0]);
  expect(deps.saveToken).toHaveBeenCalledWith({
    userId,
    ...installation,
    token: 'ExponentPushToken[token-1]',
    platform: 'android',
    enabledEvents: ['first_vote', 'meaningful_sample', 'question_closed'],
  });
});

test('does not fetch or store a token after permission denial', async () => {
  const deps = dependencies({
    getRegisteredUserId: jest.fn().mockResolvedValue(userId),
    requestPermissions: jest.fn().mockResolvedValue({ granted: false, status: 'denied' }),
  });

  await expect(registerNotifications({
    identity: { userId, source: 'anonymous' }, shouldContinue: () => true, dependencies: deps,
  }))
    .resolves.toEqual({ status: 'denied' });
  expect(deps.getExpoPushToken).not.toHaveBeenCalled();
  expect(deps.saveToken).not.toHaveBeenCalled();
});

test('blocks registration before native prompts when account continuity forbids mutations', async () => {
  const deps = dependencies();

  await expect(registerNotifications({
    identity: { userId, source: 'anonymous' }, shouldContinue: () => false, dependencies: deps,
  })).resolves.toEqual({ status: 'mutation_blocked' });
  expect(deps.setAndroidChannel).not.toHaveBeenCalled();
  expect(deps.getPermissions).not.toHaveBeenCalled();
  expect(deps.saveToken).not.toHaveBeenCalled();
});

test('updates a rolled Expo token while mutation capability remains valid', async () => {
  const remove = jest.fn();
  const deps = dependencies({
    getRegisteredUserId: jest.fn().mockResolvedValue(userId),
    getExpoPushToken: jest.fn().mockResolvedValue('ExponentPushToken[token-2]'),
    addPushTokenListener: jest.fn((listener: () => void) => {
      listener();
      return { remove };
    }),
  });

  const subscription = subscribeToPushTokenChanges({
    identity: { userId, source: 'anonymous' },
    shouldContinue: () => true,
    dependencies: deps,
  });
  for (let tick = 0; tick < 15; tick += 1) await Promise.resolve();

  expect(deps.saveToken).toHaveBeenCalledWith(expect.objectContaining({
    token: 'ExponentPushToken[token-2]',
  }));
  expect(deps.revokeInstallation).not.toHaveBeenCalled();
  expect(deps.enqueueRevocation).not.toHaveBeenCalled();
  subscription.remove();
  expect(remove).toHaveBeenCalled();
});

test('keeps the old registration active when token acquisition fails', async () => {
  const deps = dependencies({
    getRegisteredUserId: jest.fn().mockResolvedValue(userId),
    getExpoPushToken: jest.fn().mockRejectedValue(new Error('native unavailable')),
    addPushTokenListener: jest.fn((listener: () => void) => { listener(); return { remove: jest.fn() }; }),
  });
  subscribeToPushTokenChanges({ identity: { userId, source: 'anonymous' }, shouldContinue: () => true, dependencies: deps });
  for (let tick = 0; tick < 15; tick += 1) await Promise.resolve();
  expect(deps.saveToken).not.toHaveBeenCalled();
  expect(deps.revokeInstallation).not.toHaveBeenCalled();
  expect(deps.enqueueRevocation).not.toHaveBeenCalled();
});

test('keeps old token on save failure and allows a later roll to replace it atomically', async () => {
  let listener!: () => void;
  const deps = dependencies({
    getRegisteredUserId: jest.fn().mockResolvedValue(userId),
    getExpoPushToken: jest.fn().mockResolvedValue('ExponentPushToken[token-2]'),
    saveToken: jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined),
    addPushTokenListener: jest.fn((next: () => void) => { listener = next; return { remove: jest.fn() }; }),
  });
  subscribeToPushTokenChanges({ identity: { userId, source: 'anonymous' }, shouldContinue: () => true, dependencies: deps });
  listener(); for (let tick = 0; tick < 15; tick += 1) await Promise.resolve();
  expect(deps.revokeInstallation).not.toHaveBeenCalled();
  listener(); for (let tick = 0; tick < 15; tick += 1) await Promise.resolve();
  expect(deps.saveToken).toHaveBeenCalledTimes(2);
  expect(deps.revokeInstallation).not.toHaveBeenCalled();
});

test('does not persist token rolls after mutation capability is revoked', async () => {
  const deps = dependencies({
    getExpoPushToken: jest.fn().mockResolvedValue('ExponentPushToken[token-2]'),
    addPushTokenListener: jest.fn((listener: () => void) => {
      listener();
      return { remove: jest.fn() };
    }),
  });

  subscribeToPushTokenChanges({
    identity: { userId, source: 'anonymous' }, shouldContinue: () => false, dependencies: deps,
  });
  await Promise.resolve();
  expect(deps.saveToken).not.toHaveBeenCalled();
});

test('never turns an unregistered installation into an implicit opt-in on token roll', async () => {
  const deps = dependencies({
    getRegisteredUserId: jest.fn().mockResolvedValue(null),
    addPushTokenListener: jest.fn((listener: () => void) => { listener(); return { remove: jest.fn() }; }),
  });
  subscribeToPushTokenChanges({
    identity: { userId, source: 'anonymous' }, shouldContinue: () => true, dependencies: deps,
  });
  for (let tick = 0; tick < 5; tick += 1) await Promise.resolve();
  expect(deps.getExpoPushToken).not.toHaveBeenCalled();
  expect(deps.saveToken).not.toHaveBeenCalled();
});

test('does not install native token listeners on web', () => {
  const deps = dependencies({ platform: 'web' });
  const subscription = subscribeToPushTokenChanges({
    identity: { userId, source: 'anonymous' },
    shouldContinue: () => true,
    dependencies: deps,
  });

  expect(deps.addPushTokenListener).not.toHaveBeenCalled();
  expect(() => subscription.remove()).not.toThrow();
});

test('builds and accepts only app-owned UUID question deep links', () => {
  const questionId = '72000000-0000-0000-0000-000000000001';
  const link = notificationDeepLink(questionId);

  expect(link).toBe(`mobile://question/${questionId}?source=notification`);
  expect(parseNotificationDeepLink(link)).toEqual({ questionId, source: 'notification' });
  expect(parseNotificationDeepLink('https://evil.example/question/72000000-0000-0000-0000-000000000001')).toBeNull();
  expect(() => notificationDeepLink('../profile')).toThrow('Invalid question ID');
});

test('opens only validated notification response deep links', async () => {
  const openUrl = jest.fn().mockResolvedValue(undefined);
  let listener!: (response: unknown) => void;
  const subscription = subscribeToNotificationResponses({
    dependencies: {
      addResponseListener: jest.fn((next) => {
        listener = next;
        return { remove: jest.fn() };
      }),
      getLastResponse: jest.fn().mockResolvedValue(null),
      clearLastResponse: jest.fn().mockResolvedValue(undefined),
      openUrl,
    },
  });
  const valid = notificationDeepLink('72000000-0000-0000-0000-000000000001');

  listener({ id: 'live-1', url: valid });
  listener({ id: 'live-2', url: 'https://evil.example/question/72000000-0000-0000-0000-000000000001' });
  listener({ raw: 'question text' });
  await subscription.ready;
  await Promise.resolve();

  expect(openUrl).toHaveBeenCalledTimes(1);
  expect(openUrl).toHaveBeenCalledWith(valid);
  subscription.remove();
});

test('never registers offline identities', async () => {
  const deps = dependencies();
  await expect(registerNotifications({
    identity: { userId: 'guest_00000000-0000-0000-0000-000000000001', source: 'offline' },
    shouldContinue: () => true,
    dependencies: deps,
  })).resolves.toEqual({ status: 'offline' });
  expect(deps.getPermissions).not.toHaveBeenCalled();
  expect(deps.saveToken).not.toHaveBeenCalled();
});

test('cancels registration when identity continuity changes during permission prompt', async () => {
  let valid = true;
  const deps = dependencies({
    requestPermissions: jest.fn().mockImplementation(async () => {
      valid = false;
      return { granted: true, status: 'granted' };
    }),
  });
  await expect(registerNotifications({
    identity: { userId, source: 'anonymous' }, shouldContinue: () => valid, dependencies: deps,
  })).resolves.toEqual({ status: 'cancelled' });
  expect(deps.getExpoPushToken).not.toHaveBeenCalled();
  expect(deps.saveToken).not.toHaveBeenCalled();
});

test('revokes an installation when the authenticated account changes or signs out', async () => {
  const deps = dependencies({ getRegisteredUserId: jest.fn().mockResolvedValue(userId) });
  await reconcileNotificationInstallation('71000000-0000-0000-0000-000000000002', deps);
  expect(deps.revokeInstallation).toHaveBeenCalledWith(installation);
  (deps.revokeInstallation as jest.Mock).mockClear();
  await reconcileNotificationInstallation(null, deps);
  expect(deps.revokeInstallation).toHaveBeenCalledWith(installation);
});

test('retains failed revocation durably and removes it exactly once after restart retry', async () => {
  const deps = dependencies({
    getRegisteredUserId: jest.fn().mockResolvedValue(userId),
    revokeInstallation: jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(true),
    pendingRevocations: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([installation]),
  });
  await reconcileNotificationInstallation(null, deps);
  expect(deps.enqueueRevocation).toHaveBeenCalledWith(installation);
  expect(deps.removeRevocation).not.toHaveBeenCalled();
  await flushNotificationRevocations(deps);
  expect(deps.removeRevocation).toHaveBeenCalledTimes(1);
});

test('revokes same-user installation when mutation capability is lost', async () => {
  const deps = dependencies({ getRegisteredUserId: jest.fn().mockResolvedValue(userId) });
  await reconcileNotificationInstallation(userId, deps, false);
  expect(deps.enqueueRevocation).toHaveBeenCalledWith(installation);
  expect(deps.revokeInstallation).toHaveBeenCalledWith(installation);
});

test('consumes a cold-start notification once and reports one opened event', async () => {
  const valid = notificationDeepLink('72000000-0000-0000-0000-000000000001');
  const openUrl = jest.fn().mockResolvedValue(undefined);
  const clearLastResponse = jest.fn().mockResolvedValue(undefined);
  const onOpen = jest.fn();
  let listener!: (response: unknown) => void;
  const subscription = subscribeToNotificationResponses({
    onOpen,
    dependencies: {
      addResponseListener: jest.fn((next) => { listener = next; return { remove: jest.fn() }; }),
      getLastResponse: jest.fn().mockResolvedValue({ id: 'cold-1', url: valid }),
      clearLastResponse,
      openUrl,
    },
  });
  await subscription.ready;
  listener({ id: 'cold-1', url: valid });
  await Promise.resolve();
  expect(openUrl).toHaveBeenCalledTimes(1);
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(clearLastResponse).toHaveBeenCalledTimes(1);
});

test('does not open a cold response after its bridge is disposed', async () => {
  let resolve!: (value: unknown) => void;
  const openUrl = jest.fn();
  const subscription = subscribeToNotificationResponses({ dependencies: {
    addResponseListener: jest.fn(() => ({ remove: jest.fn() })),
    getLastResponse: jest.fn(() => new Promise((next) => { resolve = next; })),
    clearLastResponse: jest.fn(), openUrl,
  } });
  subscription.remove();
  resolve({ id: 'cold-disposed', url: notificationDeepLink('72000000-0000-0000-0000-000000000009') });
  await subscription.ready;
  expect(openUrl).not.toHaveBeenCalled();
});

test('shares consumed response ids across bridge reinstalls', async () => {
  const url = notificationDeepLink('72000000-0000-0000-0000-000000000008');
  const openUrl = jest.fn().mockResolvedValue(undefined);
  const make = () => subscribeToNotificationResponses({ dependencies: {
    addResponseListener: jest.fn(() => ({ remove: jest.fn() })),
    getLastResponse: jest.fn().mockResolvedValue({ id: 'cold-shared-once', url }),
    clearLastResponse: jest.fn().mockResolvedValue(undefined), openUrl,
  } });
  const first = make(); await first.ready; first.remove();
  const second = make(); await second.ready;
  expect(openUrl).toHaveBeenCalledTimes(1);
});
