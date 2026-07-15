export const NOTIFICATION_EVENTS = ['first_vote', 'meaningful_sample', 'question_closed'] as const;
export type NotificationEvent = typeof NOTIFICATION_EVENTS[number];
interface NotificationRequestPayload { userId: string; event: NotificationEvent; questionId: string }
interface TokenRow { token: string }
type DeliveryKey = NotificationRequestPayload & { token: string };
type OutboxJob = NotificationRequestPayload & { id: string };
export type ReceiptDelivery = DeliveryKey & { ticketId: string };
type PushTicket = { status: 'ok'; id: string } | { status: 'error'; code: string };
type PushReceipt = { status: 'ok' } | { status: 'error'; code: string };

export interface NotificationDeliveryDependencies {
  isEligible(input: NotificationRequestPayload): Promise<boolean>;
  loadTokens(input: NotificationRequestPayload): Promise<TokenRow[]>;
  claimDelivery(input: DeliveryKey): Promise<boolean>;
  markDispatchStarted(input: DeliveryKey): Promise<void>;
  markDeliveryUnknown(input: DeliveryKey): Promise<void>;
  sendPush(input: {
    to: string; title: string; body: string;
    data: { questionId: string; event: NotificationEvent; url: string };
  }): Promise<PushTicket>;
  storeTicket(input: DeliveryKey & { ticketId: string }): Promise<void>;
  markDeliveryError(input: DeliveryKey & { errorCode: string }): Promise<void>;
  disableToken(token: string): Promise<void>;
  releaseDelivery(input: DeliveryKey): Promise<void>;
  loadPendingReceipts(): Promise<ReceiptDelivery[]>;
  getReceipts(ticketIds: string[]): Promise<Record<string, PushReceipt>>;
  markReceiptDelivered(input: ReceiptDelivery): Promise<void>;
  markReceiptError(input: ReceiptDelivery, code: string): Promise<void>;
  markReceiptRetry(input: DeliveryKey, code: string): Promise<void>;
  loadRetryDeliveries(): Promise<DeliveryKey[]>;
  revokeTokenInstallation(installationId: string, revocationKey: string): Promise<boolean>;
  loadOutboxJobs(): Promise<OutboxJob[]>;
  completeOutboxJob(id: string, error: string | null): Promise<void>;
  enqueueClosedQuestions(limit: number): Promise<number>;
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const eventNames = new Set<string>(NOTIFICATION_EVENTS);
const transientCodes = new Set(['MessageRateExceeded', 'ProviderError']);
const copy: Record<NotificationEvent, { title: string; body: string }> = {
  first_vote: { title: '첫 투표가 도착했어요', body: '내 질문의 첫 반응을 확인해 보세요.' },
  meaningful_sample: { title: '의견이 모이고 있어요', body: '내 질문의 의미 있는 중간 결과를 확인해 보세요.' },
  question_closed: { title: '질문 결과가 나왔어요', body: '마감된 밸런스 결과를 확인해 보세요.' },
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}
function validPayload(value: unknown): value is NotificationRequestPayload {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.userId === 'string' && uuid.test(item.userId)
    && typeof item.questionId === 'string' && uuid.test(item.questionId)
    && typeof item.event === 'string' && eventNames.has(item.event);
}

export async function handleQuestionNotification(request: Request, deps: NotificationDeliveryDependencies): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: unknown; try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }
  if (!validPayload(body)) return json({ error: 'invalid_payload' }, 400);
  if (!(await deps.isEligible(body))) return json({ status: 'not_ready' });
  const tokens = await deps.loadTokens(body); if (tokens.length === 0) return json({ status: 'disabled' });
  let accepted = 0;
  for (const { token } of tokens) {
    const delivery = { ...body, token };
    if (!(await deps.claimDelivery(delivery))) continue;
    try { await deps.markDispatchStarted(delivery); }
    catch { await deps.releaseDelivery(delivery); return json({ status: 'retryable' }, 503); }
    let ticket: PushTicket;
    try {
      ticket = await deps.sendPush({
        to: token, ...copy[body.event],
        data: { questionId: body.questionId, event: body.event, url: `mobile://question/${body.questionId}?source=notification` },
      });
    } catch {
      await deps.markDeliveryUnknown(delivery);
      return json({ status: 'dispatch_unknown' }, 202);
    }
    if (ticket.status === 'error') {
      if (ticket.code === 'DeviceNotRegistered') {
        await deps.disableToken(token);
        await deps.markDeliveryError({ ...delivery, errorCode: ticket.code });
        return json({ status: 'token_disabled' }, 410);
      }
      if (transientCodes.has(ticket.code)) {
        await deps.markReceiptRetry(delivery, ticket.code); return json({ status: 'retryable' }, 503);
      }
      await deps.markDeliveryError({ ...delivery, errorCode: ticket.code });
      return json({ status: 'rejected' }, 422);
    }
    try {
      await deps.storeTicket({ ...delivery, ticketId: ticket.id });
    } catch {
      await deps.markDeliveryUnknown(delivery);
      return json({ status: 'accepted_pending_ticket' }, 202);
    }
    accepted += 1;
  }
  return accepted > 0 ? json({ status: 'ticket_accepted', accepted }) : json({ status: 'duplicate' });
}

export async function handleNotificationReceipts(deps: NotificationDeliveryDependencies): Promise<Response> {
  const pending = await deps.loadPendingReceipts();
  if (pending.length === 0) return json({ status: 'empty' });
  const receipts = await deps.getReceipts(pending.map((item) => item.ticketId));
  let delivered = 0; let failed = 0; let retried = 0;
  for (const item of pending) {
    const receipt = receipts[item.ticketId]; if (!receipt) continue;
    if (receipt.status === 'ok') { await deps.markReceiptDelivered(item); delivered += 1; continue; }
    if (receipt.code === 'DeviceNotRegistered') {
      await deps.disableToken(item.token); await deps.markReceiptError(item, receipt.code); failed += 1; continue;
    }
    if (transientCodes.has(receipt.code)) { await deps.markReceiptRetry(item, receipt.code); retried += 1; continue; }
    await deps.markReceiptError(item, receipt.code); failed += 1;
  }
  return json({ status: 'receipts_processed', delivered, failed, retried });
}

export async function handleNotificationRetries(deps: NotificationDeliveryDependencies): Promise<Response> {
  const jobs = await deps.loadRetryDeliveries(); let accepted = 0;
  for (const job of jobs) {
    let ticket: PushTicket;
    try { ticket = await deps.sendPush({
      to: job.token, ...copy[job.event],
      data: { questionId: job.questionId, event: job.event, url: `mobile://question/${job.questionId}?source=notification` },
    }); } catch { continue; }
    if (ticket.status === 'ok') { await deps.storeTicket({ ...job, ticketId: ticket.id }); accepted += 1; continue; }
    if (ticket.code === 'DeviceNotRegistered') {
      await deps.disableToken(job.token); await deps.markDeliveryError({ ...job, errorCode: ticket.code }); continue;
    }
    if (transientCodes.has(ticket.code)) {
      await deps.markReceiptRetry(job, ticket.code); continue;
    }
    await deps.markDeliveryError({ ...job, errorCode: ticket.code });
  }
  return json({ status: jobs.length ? 'processed' : 'empty', accepted });
}

export async function handleNotificationOutbox(deps: NotificationDeliveryDependencies): Promise<Response> {
  const jobs = await deps.loadOutboxJobs(); let processed = 0; let failed = 0;
  for (const job of jobs) {
    try {
      const response = await handleQuestionNotification(new Request('http://internal', {
        method: 'POST', body: JSON.stringify({ userId: job.userId, questionId: job.questionId, event: job.event }),
      }), deps);
      if (response.status >= 500) throw new Error(`notification dispatch returned ${response.status}`);
      await deps.completeOutboxJob(job.id, null); processed += 1;
    } catch (error) {
      await deps.completeOutboxJob(job.id, error instanceof Error ? error.message : 'notification dispatch failed');
      failed += 1;
    }
  }
  return json({ status: jobs.length ? 'processed' : 'empty', processed, failed });
}

export async function handleClosedQuestionScan(deps: NotificationDeliveryDependencies): Promise<Response> {
  const enqueued = await deps.enqueueClosedQuestions(500);
  return json({ status: 'scanned', enqueued });
}

export async function handleTokenRevocation(body: unknown, deps: NotificationDeliveryDependencies): Promise<Response> {
  if (typeof body !== 'object' || body === null) return json({ error: 'invalid_payload' }, 400);
  const item = body as Record<string, unknown>;
  if (item.action !== 'revoke_token' || typeof item.installationId !== 'string' || !uuid.test(item.installationId)
    || typeof item.revocationKey !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(item.revocationKey)) {
    return json({ error: 'invalid_payload' }, 400);
  }
  return json({ revoked: await deps.revokeTokenInstallation(item.installationId, item.revocationKey) });
}

declare const Deno: undefined | { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): void };
export function isAuthorizedNotificationRequest(headers: Headers, serviceKey: string, secret?: string): boolean {
  return headers.get('authorization') === `Bearer ${serviceKey}`
    || (Boolean(secret) && headers.get('x-notification-secret') === secret);
}

function runtimeDependencies(): NotificationDeliveryDependencies {
  const baseUrl = Deno?.env.get('SUPABASE_URL'); const serviceKey = Deno?.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!baseUrl || !serviceKey) throw new Error('Supabase runtime environment is missing');
  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' };
  const rest = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${baseUrl}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init.headers } });
    if (!response.ok) throw new Error(`Database request failed: ${response.status}`); return response;
  };
  const deliveryFilter = (x: DeliveryKey) => `user_id=eq.${x.userId}&question_id=eq.${x.questionId}&event=eq.${x.event}&token=eq.${encodeURIComponent(x.token)}`;
  return {
    async isEligible({ userId, event, questionId }) {
      const response = await rest('rpc/notification_event_eligible', { method: 'POST', body: JSON.stringify({
        p_user_id: userId, p_event: event, p_question_id: questionId,
      }) });
      return await response.json() === true;
    },
    async loadTokens({ userId, event }) {
      return (await rest(`push_tokens?select=token&user_id=eq.${userId}&enabled_events=cs.{${event}}`)).json();
    },
    async claimDelivery(input) {
      const response = await rest('rpc/claim_notification_delivery', { method: 'POST', body: JSON.stringify({
        p_user_id: input.userId, p_question_id: input.questionId, p_event: input.event, p_token: input.token,
      }) }); return await response.json() === true;
    },
    async markDispatchStarted(input) {
      await rest(`notification_deliveries?${deliveryFilter(input)}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'dispatch_started' }),
      });
    },
    async markDeliveryUnknown(input) {
      await rest(`notification_deliveries?${deliveryFilter(input)}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'delivery_unknown', lease_expires_at: new Date().toISOString() }),
      });
    },
    async sendPush(message) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(message) });
      if (!response.ok) throw new Error(`Expo push failed: ${response.status}`);
      const data = (await response.json() as { data: { status: string; id?: string; details?: { error?: string } } }).data;
      return data.status === 'ok' && data.id ? { status: 'ok', id: data.id }
        : { status: 'error', code: data.details?.error ?? 'UnknownExpoTicketError' };
    },
    async storeTicket(input) {
      await rest(`notification_deliveries?${deliveryFilter(input)}`, { method: 'PATCH', body: JSON.stringify({ status: 'ticket_accepted', ticket_id: input.ticketId, ticket_status: 'ok' }) });
    },
    async markDeliveryError(input) {
      await rest(`notification_deliveries?${deliveryFilter(input)}`, { method: 'PATCH', body: JSON.stringify({ status: 'error', ticket_status: 'error', error_code: input.errorCode }) });
    },
    async disableToken(token) {
      await rest(`push_tokens?token=eq.${encodeURIComponent(token)}`, { method: 'PATCH', body: JSON.stringify({ enabled_events: [] }) });
    },
    async releaseDelivery(input) { await rest(`notification_deliveries?${deliveryFilter(input)}`, { method: 'DELETE' }); },
    async loadPendingReceipts() {
      const rows = await (await rest('notification_deliveries?select=user_id,question_id,event,token,ticket_id&status=eq.ticket_accepted&ticket_id=not.is.null&limit=100')).json() as any[];
      return rows.map((x) => ({ userId: x.user_id, questionId: x.question_id, event: x.event, token: x.token, ticketId: x.ticket_id }));
    },
    async getReceipts(ids) {
      const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids }) });
      if (!response.ok) throw new Error(`Expo receipt failed: ${response.status}`);
      const data = (await response.json() as { data: Record<string, { status: string; details?: { error?: string } }> }).data;
      return Object.fromEntries(Object.entries(data).map(([id, value]) => [id, value.status === 'ok' ? { status: 'ok' } : { status: 'error', code: value.details?.error ?? 'UnknownExpoReceiptError' }]));
    },
    async markReceiptDelivered(input) {
      await rest(`notification_deliveries?${deliveryFilter(input)}`, { method: 'PATCH', body: JSON.stringify({ status: 'delivered', ticket_status: 'ok', receipt_checked_at: new Date().toISOString(), sent_at: new Date().toISOString() }) });
    },
    async markReceiptError(input, code) {
      await rest(`notification_deliveries?${deliveryFilter(input)}`, { method: 'PATCH', body: JSON.stringify({ status: 'error', ticket_status: 'error', error_code: code, receipt_checked_at: new Date().toISOString() }) });
    },
    async markReceiptRetry(input, code) {
      await rest(`notification_deliveries?${deliveryFilter(input)}`, { method: 'PATCH', body: JSON.stringify({
        status: 'retry_pending', ticket_id: null, ticket_status: 'retry', last_error_code: code,
        next_attempt_at: new Date(Date.now() + 60_000).toISOString(), lease_expires_at: new Date().toISOString(),
      }) });
    },
    async loadRetryDeliveries() {
      const response = await rest('rpc/claim_notification_retries', { method: 'POST', body: JSON.stringify({ p_limit: 25 }) });
      const rows = await response.json() as any[];
      return rows.map((x) => ({ userId: x.user_id, questionId: x.question_id, event: x.event, token: x.token }));
    },
    async revokeTokenInstallation(installationId, revocationKey) {
      const response = await rest('rpc/revoke_push_token', { method: 'POST', body: JSON.stringify({
        p_installation_id: installationId, p_revocation_key: revocationKey,
      }) });
      return await response.json() === true;
    },
    async loadOutboxJobs() {
      const response = await rest('rpc/claim_notification_outbox', { method: 'POST', body: JSON.stringify({ p_limit: 25 }) });
      const rows = await response.json() as any[];
      return rows.map((x) => ({ id: x.id, userId: x.user_id, questionId: x.question_id, event: x.event }));
    },
    async completeOutboxJob(id, error) {
      await rest('rpc/complete_notification_outbox', { method: 'POST', body: JSON.stringify({ p_id: id, p_error: error }) });
    },
    async enqueueClosedQuestions(limit) {
      const response = await rest('rpc/enqueue_closed_question_notifications', { method: 'POST', body: JSON.stringify({ p_limit: limit }) });
      return Number(await response.json());
    },
  };
}

if (typeof Deno !== 'undefined') Deno.serve(async (request) => {
  const clone = request.clone(); let body: any = null; try { body = await clone.json(); } catch { /* main handler returns 400 */ }
  const deps = runtimeDependencies();
  if (body?.action === 'revoke_token') return handleTokenRevocation(body, deps);
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey || !isAuthorizedNotificationRequest(request.headers, serviceKey, Deno.env.get('NOTIFICATION_FUNCTION_SECRET'))) return json({ error: 'unauthorized' }, 401);
  if (body?.action === 'poll_receipts') return handleNotificationReceipts(deps);
  if (body?.action === 'dispatch_retries') return handleNotificationRetries(deps);
  if (body?.action === 'dispatch_outbox') return handleNotificationOutbox(deps);
  if (body?.action === 'scan_closed') return handleClosedQuestionScan(deps);
  return handleQuestionNotification(request, deps);
});
