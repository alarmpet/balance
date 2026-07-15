import {
  handleQuestionNotification,
  handleNotificationReceipts,
  handleNotificationRetries,
  handleNotificationOutbox,
  handleClosedQuestionScan,
  handleTokenRevocation,
  isAuthorizedNotificationRequest,
  type NotificationDeliveryDependencies,
} from '../../supabase/functions/send-question-notification/index';

const payload = {
  userId: '71000000-0000-0000-0000-000000000001',
  event: 'first_vote',
  questionId: '72000000-0000-0000-0000-000000000001',
};

function dependencies(overrides: Partial<NotificationDeliveryDependencies> = {}): NotificationDeliveryDependencies {
  return {
    isEligible: jest.fn().mockResolvedValue(true),
    loadTokens: jest.fn().mockResolvedValue([{ token: 'ExponentPushToken[token-1]' }]),
    claimDelivery: jest.fn().mockResolvedValue(true),
    markDispatchStarted: jest.fn().mockResolvedValue(undefined),
    markDeliveryUnknown: jest.fn().mockResolvedValue(undefined),
    sendPush: jest.fn().mockResolvedValue({ status: 'ok', id: 'ticket-1' }),
    storeTicket: jest.fn().mockResolvedValue(undefined),
    markDeliveryError: jest.fn().mockResolvedValue(undefined),
    disableToken: jest.fn().mockResolvedValue(undefined),
    loadPendingReceipts: jest.fn().mockResolvedValue([]),
    getReceipts: jest.fn().mockResolvedValue({}),
    markReceiptDelivered: jest.fn().mockResolvedValue(undefined),
    markReceiptError: jest.fn().mockResolvedValue(undefined),
    markReceiptRetry: jest.fn().mockResolvedValue(undefined),
    loadRetryDeliveries: jest.fn().mockResolvedValue([]),
    revokeTokenInstallation: jest.fn().mockResolvedValue(true),
    releaseDelivery: jest.fn().mockResolvedValue(undefined),
    loadOutboxJobs: jest.fn().mockResolvedValue([]),
    completeOutboxJob: jest.fn().mockResolvedValue(undefined),
    enqueueClosedQuestions: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

test('dispatches durable lifecycle jobs and marks each processed', async () => {
  const job = { id: '76000000-0000-0000-0000-000000000001', ...payload };
  const deps = dependencies({ loadOutboxJobs: jest.fn().mockResolvedValue([job]) });
  const response = await handleNotificationOutbox(deps);
  await expect(response.json()).resolves.toEqual({ status: 'processed', processed: 1, failed: 0 });
  expect(deps.sendPush).toHaveBeenCalledTimes(1);
  expect(deps.completeOutboxJob).toHaveBeenCalledWith(job.id, null);
});

test('scans closed questions through the service dependency and reports the enqueue count', async () => {
  const deps = dependencies({ enqueueClosedQuestions: jest.fn().mockResolvedValue(17) });
  const response = await handleClosedQuestionScan(deps);
  await expect(response.json()).resolves.toEqual({ status: 'scanned', enqueued: 17 });
  expect(deps.enqueueClosedQuestions).toHaveBeenCalledWith(500);
});

test('does not send when the question has not reached the real server milestone', async () => {
  const deps = dependencies({ isEligible: jest.fn().mockResolvedValue(false) });
  const response = await handleQuestionNotification(new Request('http://local', {
    method: 'POST', body: JSON.stringify(payload),
  }), deps);

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: 'not_ready' });
  expect(deps.loadTokens).not.toHaveBeenCalled();
  expect(deps.sendPush).not.toHaveBeenCalled();
});

test('returns 200 without a push when the event preference is disabled', async () => {
  const deps = dependencies({ loadTokens: jest.fn().mockResolvedValue([]) });
  const response = await handleQuestionNotification(new Request('http://local', {
    method: 'POST', body: JSON.stringify(payload),
  }), deps);

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: 'disabled' });
  expect(deps.claimDelivery).not.toHaveBeenCalled();
  expect(deps.sendPush).not.toHaveBeenCalled();
});

test.each(['first_vote', 'meaningful_sample', 'question_closed'] as const)(
  'sends privacy-safe Korean copy and a question deep link for %s',
  async (event) => {
    const deps = dependencies();
    const response = await handleQuestionNotification(new Request('http://local', {
      method: 'POST', body: JSON.stringify({ ...payload, event }),
    }), deps);

    expect(response.status).toBe(200);
    expect(deps.sendPush).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ExponentPushToken[token-1]',
      title: expect.any(String),
      body: expect.any(String),
      data: {
        questionId: payload.questionId,
        event,
        url: `mobile://question/${payload.questionId}?source=notification`,
      },
    }));
    const push = (deps.sendPush as jest.Mock).mock.calls[0][0];
    expect(`${push.title}${push.body}`).toMatch(/[가-힣]/);
    expect(JSON.stringify(push)).not.toContain('optionA');
    expect(JSON.stringify(push)).not.toContain(payload.userId);
  },
);

test('does not send an already claimed delivery twice', async () => {
  const deps = dependencies({ claimDelivery: jest.fn().mockResolvedValue(false) });
  const response = await handleQuestionNotification(new Request('http://local', {
    method: 'POST', body: JSON.stringify(payload),
  }), deps);

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: 'duplicate' });
  expect(deps.sendPush).not.toHaveBeenCalled();
});

test('keeps an ambiguous network dispatch claimed so retry cannot duplicate it', async () => {
  const deps = dependencies({ sendPush: jest.fn().mockRejectedValue(new Error('offline')) });
  const response = await handleQuestionNotification(new Request('http://local', {
    method: 'POST', body: JSON.stringify(payload),
  }), deps);

  expect(response.status).toBe(202);
  expect(deps.releaseDelivery).not.toHaveBeenCalled();
  expect(deps.markDeliveryUnknown).toHaveBeenCalledWith(expect.objectContaining(payload));
  expect(deps.storeTicket).not.toHaveBeenCalled();
});

test('rejects unknown events and malformed identifiers', async () => {
  const deps = dependencies();
  for (const invalid of [
    { ...payload, event: 'every_vote' },
    { ...payload, questionId: '../profile' },
    { ...payload, userId: 'raw-user-name' },
  ]) {
    const response = await handleQuestionNotification(new Request('http://local', {
      method: 'POST', body: JSON.stringify(invalid),
    }), deps);
    expect(response.status).toBe(400);
  }
  expect(deps.loadTokens).not.toHaveBeenCalled();
});

test('requires an internal credential at the runtime boundary', () => {
  expect(isAuthorizedNotificationRequest(new Headers({ authorization: 'Bearer service-key' }), 'service-key'))
    .toBe(true);
  expect(isAuthorizedNotificationRequest(new Headers({ 'x-notification-secret': 'hook-secret' }), 'service-key', 'hook-secret'))
    .toBe(true);
  expect(isAuthorizedNotificationRequest(new Headers({ authorization: 'Bearer user-jwt' }), 'service-key', 'hook-secret'))
    .toBe(false);
});

test('keeps a successful push claimed when ticket persistence is temporarily offline', async () => {
  const deps = dependencies({ storeTicket: jest.fn().mockRejectedValue(new Error('offline')) });
  const response = await handleQuestionNotification(new Request('http://local', {
    method: 'POST', body: JSON.stringify(payload),
  }), deps);

  expect(response.status).toBe(202);
  expect(deps.sendPush).toHaveBeenCalledTimes(1);
  expect(deps.releaseDelivery).not.toHaveBeenCalled();
  expect(deps.markDeliveryUnknown).toHaveBeenCalled();
});

test('persists a confirmed transient ticket error for durable retry instead of deleting it', async () => {
  const deps = dependencies({ sendPush: jest.fn().mockResolvedValue({ status: 'error', code: 'MessageRateExceeded' }) });
  await handleQuestionNotification(new Request('http://local', { method: 'POST', body: JSON.stringify(payload) }), deps);
  expect(deps.markReceiptRetry).toHaveBeenCalledWith(expect.objectContaining(payload), 'MessageRateExceeded');
  expect(deps.releaseDelivery).not.toHaveBeenCalled();
});

test('stores an accepted Expo ticket rather than claiming final delivery', async () => {
  const deps = dependencies();
  const response = await handleQuestionNotification(new Request('http://local', {
    method: 'POST', body: JSON.stringify(payload),
  }), deps);
  expect(response.status).toBe(200);
  expect(deps.markDispatchStarted).toHaveBeenCalled();
  expect(deps.storeTicket).toHaveBeenCalledWith(expect.objectContaining({
    ...payload, token: 'ExponentPushToken[token-1]', ticketId: 'ticket-1',
  }));
  expect(deps.markReceiptDelivered).not.toHaveBeenCalled();
});

test('disables DeviceNotRegistered immediately and does not retry it', async () => {
  const deps = dependencies({
    sendPush: jest.fn().mockResolvedValue({ status: 'error', code: 'DeviceNotRegistered' }),
  });
  const response = await handleQuestionNotification(new Request('http://local', {
    method: 'POST', body: JSON.stringify(payload),
  }), deps);
  expect(response.status).toBe(410);
  expect(deps.disableToken).toHaveBeenCalledWith('ExponentPushToken[token-1]');
  expect(deps.markDeliveryError).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'DeviceNotRegistered' }));
  expect(deps.releaseDelivery).not.toHaveBeenCalled();
});

test('polls accepted tickets and records final delivery receipts', async () => {
  const delivery = { ...payload, token: 'ExponentPushToken[token-1]', ticketId: 'ticket-1' };
  const deps = dependencies({
    loadPendingReceipts: jest.fn().mockResolvedValue([delivery]),
    getReceipts: jest.fn().mockResolvedValue({ 'ticket-1': { status: 'ok' } }),
  });
  const response = await handleNotificationReceipts(deps);
  expect(response.status).toBe(200);
  expect(deps.markReceiptDelivered).toHaveBeenCalledWith(delivery);
});

test('receipt DeviceNotRegistered disables the token while transient confirmed failures safely release for retry', async () => {
  const permanent = { ...payload, token: 'ExponentPushToken[dead]', ticketId: 'ticket-dead' };
  const transient = { ...payload, token: 'ExponentPushToken[busy]', ticketId: 'ticket-busy' };
  const deps = dependencies({
    loadPendingReceipts: jest.fn().mockResolvedValue([permanent, transient]),
    getReceipts: jest.fn().mockResolvedValue({
      'ticket-dead': { status: 'error', code: 'DeviceNotRegistered' },
      'ticket-busy': { status: 'error', code: 'MessageRateExceeded' },
    }),
  });
  await handleNotificationReceipts(deps);
  expect(deps.disableToken).toHaveBeenCalledWith(permanent.token);
  expect(deps.markReceiptError).toHaveBeenCalledWith(permanent, 'DeviceNotRegistered');
  expect(deps.markReceiptRetry).toHaveBeenCalledWith(transient, 'MessageRateExceeded');
  expect(deps.releaseDelivery).not.toHaveBeenCalledWith(transient);
});

test('durably retries a transient receipt once when the later dispatcher claims it', async () => {
  const delivery = { ...payload, token: 'ExponentPushToken[busy]', ticketId: 'ticket-old' };
  const deps = dependencies({
    loadPendingReceipts: jest.fn().mockResolvedValue([delivery]),
    getReceipts: jest.fn().mockResolvedValue({ 'ticket-old': { status: 'error', code: 'MessageRateExceeded' } }),
  });
  await handleNotificationReceipts(deps);
  expect(deps.markReceiptRetry).toHaveBeenCalledWith(delivery, 'MessageRateExceeded');
  (deps.loadRetryDeliveries as jest.Mock).mockResolvedValueOnce([{ ...payload, token: delivery.token }]).mockResolvedValueOnce([]);
  (deps.sendPush as jest.Mock).mockResolvedValue({ status: 'ok', id: 'ticket-new' });
  await handleNotificationRetries(deps);
  await handleNotificationRetries(deps);
  expect(deps.sendPush).toHaveBeenCalledTimes(1);
  expect(deps.storeTicket).toHaveBeenCalledWith(expect.objectContaining({ ticketId: 'ticket-new' }));
});

test('logout revocation accepts only installation UUID plus opaque proof', async () => {
  const deps = dependencies();
  const response = await handleTokenRevocation({
    action: 'revoke_token', installationId: '75000000-0000-0000-0000-000000000001',
    revocationKey: 'abcdefghijklmnopqrstuvwxyzABCDEF012345',
  }, deps);
  expect(response.status).toBe(200);
  expect(deps.revokeTokenInstallation).toHaveBeenCalled();
  expect((await handleTokenRevocation({ action: 'revoke_token', installationId: 'person@example.com', revocationKey: 'raw text' }, deps)).status).toBe(400);
});
