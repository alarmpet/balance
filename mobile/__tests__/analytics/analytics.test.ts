import {
  ANALYTICS_EVENT_NAMES,
  sanitizeEvent,
  track,
} from '@/src/features/analytics/analytics';

test('drops free text and keeps approved identifiers', () => {
  expect(sanitizeEvent({
    name: 'question_created',
    userId: '71000000-0000-0000-0000-000000000001',
    questionId: '72000000-0000-0000-0000-000000000001',
    description: '민감한 질문 내용',
  })).toEqual({
    name: 'question_created',
    userId: '71000000-0000-0000-0000-000000000001',
    questionId: '72000000-0000-0000-0000-000000000001',
  });
});

test('accepts every approved event and rejects unknown event names', () => {
  for (const name of ANALYTICS_EVENT_NAMES) {
    expect(sanitizeEvent({ name })).toEqual({ name });
  }
  expect(() => sanitizeEvent({ name: 'question_text_copied' })).toThrow('Unsupported analytics event');
});

test('keeps only schema-approved property values', () => {
  expect(sanitizeEvent({
    name: 'notification_opened',
    sessionId: 'session_0123456789abcdef',
    questionId: '72000000-0000-0000-0000-000000000001',
    source: 'notification',
    timestamp: '2026-07-14T12:00:00.000Z',
    optionA: 'raw text',
  })).toEqual({
    name: 'notification_opened',
    sessionId: 'session_0123456789abcdef',
    questionId: '72000000-0000-0000-0000-000000000001',
    source: 'notification',
    timestamp: '2026-07-14T12:00:00.000Z',
  });
  expect(() => sanitizeEvent({
    name: 'app_opened',
    timestamp: 'tomorrow',
  })).toThrow('Invalid analytics timestamp');
  expect(() => sanitizeEvent({
    name: 'app_opened',
    source: 'typed-by-user',
  })).toThrow('Invalid analytics source');
  expect(() => sanitizeEvent({ name: 'question_impression', questionId: 'person@example.com' }))
    .toThrow('Invalid analytics questionId');
  expect(() => sanitizeEvent({ name: 'app_opened', sessionId: 'raw text' }))
    .toThrow('Invalid analytics sessionId');
  expect(() => sanitizeEvent({ name: 'app_opened', userId: 'person@example.com' }))
    .toThrow('Invalid analytics userId');
});

test('track never forwards raw question text or unapproved identifiers', async () => {
  const insert = jest.fn().mockResolvedValue(undefined);

  await track({
    name: 'question_created',
    userId: '71000000-0000-0000-0000-000000000001',
    questionId: '72000000-0000-0000-0000-000000000001',
    description: 'private question copy',
    email: 'person@example.com',
  }, { insert });

  expect(insert).toHaveBeenCalledWith({
    eventName: 'question_created',
    userId: '71000000-0000-0000-0000-000000000001',
    properties: { questionId: '72000000-0000-0000-0000-000000000001' },
  });
  expect(JSON.stringify(insert.mock.calls)).not.toContain('private question copy');
  expect(JSON.stringify(insert.mock.calls)).not.toContain('person@example.com');
});
