export const ANALYTICS_EVENT_NAMES = [
  'app_opened',
  'question_impression',
  'question_voted',
  'question_skipped',
  'result_viewed',
  'brain_progress_viewed',
  'brain_type_unlocked',
  'question_create_started',
  'question_created',
  'question_shared',
  'shared_question_voted',
  'report_submitted',
  'notification_opened',
] as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENT_NAMES[number];
export type AnalyticsSource = 'play' | 'share' | 'ask' | 'brain' | 'profile' | 'notification';

export interface SanitizedAnalyticsEvent {
  name: AnalyticsEventName;
  userId?: string;
  sessionId?: string;
  questionId?: string;
  source?: AnalyticsSource;
  timestamp?: string;
}

export type AnalyticsEventInput = Record<string, unknown> & { name: string };

export interface AnalyticsSink {
  insert(input: {
    eventName: AnalyticsEventName;
    userId?: string;
    properties: Omit<SanitizedAnalyticsEvent, 'name' | 'userId'>;
  }): Promise<void>;
}

const eventNames = new Set<string>(ANALYTICS_EVENT_NAMES);
const sources = new Set<AnalyticsSource>(['play', 'share', 'ask', 'brain', 'profile', 'notification']);

const uuidIdentifier = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isAnalyticsUuid(value: unknown): value is string {
  return typeof value === 'string' && uuidIdentifier.test(value);
}
const opaqueIdentifier = /^[A-Za-z0-9_-]{16,128}$/;

export function sanitizeEvent(input: AnalyticsEventInput): SanitizedAnalyticsEvent {
  if (!eventNames.has(input.name)) throw new Error('Unsupported analytics event');
  const result: SanitizedAnalyticsEvent = { name: input.name as AnalyticsEventName };
  for (const key of ['userId', 'questionId'] as const) {
    const value = input[key];
    if (value !== undefined) {
      if (!isAnalyticsUuid(value)) throw new Error(`Invalid analytics ${key}`);
      result[key] = value;
    }
  }
  if (input.sessionId !== undefined) {
    if (typeof input.sessionId !== 'string' || !opaqueIdentifier.test(input.sessionId)) {
      throw new Error('Invalid analytics sessionId');
    }
    result.sessionId = input.sessionId;
  }
  if (input.source !== undefined) {
    if (typeof input.source !== 'string' || !sources.has(input.source as AnalyticsSource)) {
      throw new Error('Invalid analytics source');
    }
    result.source = input.source as AnalyticsSource;
  }
  if (input.timestamp !== undefined) {
    if (typeof input.timestamp !== 'string'
      || Number.isNaN(Date.parse(input.timestamp))
      || new Date(input.timestamp).toISOString() !== input.timestamp) {
      throw new Error('Invalid analytics timestamp');
    }
    result.timestamp = input.timestamp;
  }
  return result;
}

function defaultSink(): AnalyticsSink {
  return {
    async insert(input) {
      const { supabase } = require('@/src/lib/supabase');
      const { error } = await supabase.from('analytics_events').insert({
        event_name: input.eventName,
        user_id: input.userId ?? null,
        properties: input.properties,
      });
      if (error) throw error;
    },
  };
}

export async function track(input: AnalyticsEventInput, sink: AnalyticsSink = defaultSink()): Promise<void> {
  const { name, userId, ...properties } = sanitizeEvent(input);
  await sink.insert({ eventName: name, userId, properties });
}
