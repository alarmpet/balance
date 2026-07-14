import { ClosedQuestionError, DuplicateVoteError, RetryableTransportError } from '@/src/features/play/data/QuestionRepository';
jest.mock('@/src/lib/supabase', () => ({ supabase: {} }));
import {
  SupabaseQuestionRepository,
} from '@/src/features/play/data/SupabaseQuestionRepository';

const questionRow = {
  question_id: 'q1', option_a: 'Alpha', option_b: 'Beta', description: 'Pick',
  category: 'life', visibility: 'public', closes_at: null, is_daily: true,
  stage: 'active', weights_a: { freedom: 1 }, weights_b: { stability: 2 },
};

test('classifies only positive transport failures as retryable', async () => {
  const network = new SupabaseQuestionRepository({ rpc: jest.fn().mockRejectedValue(new TypeError('fetch failed')) });
  await expect(network.vote({ questionId: 'q', userId: 'u', choice: 'A', actionId: 'a' }))
    .rejects.toBeInstanceOf(RetryableTransportError);
  const closed = new SupabaseQuestionRepository({ rpc: jest.fn().mockResolvedValue({
    data: null, error: { code: '55000', message: 'question is not open for voting' },
  }) });
  await expect(closed.vote({ questionId: 'q', userId: 'u', choice: 'A', actionId: 'a' }))
    .rejects.toBeInstanceOf(ClosedQuestionError);
});

test('maps the live Supabase empty-code fetch wrapper but not arbitrary empty-code server errors', async () => {
  const live = new SupabaseQuestionRepository({ rpc: jest.fn().mockResolvedValue({
    data: null, error: { code: '', message: 'TypeError: fetch failed' },
  }) });
  await expect(live.vote({ questionId: 'q', userId: 'u', choice: 'A', actionId: 'a' }))
    .rejects.toBeInstanceOf(RetryableTransportError);

  const terminal = { code: '', message: 'database function failed' };
  const server = new SupabaseQuestionRepository({ rpc: jest.fn().mockResolvedValue({ data: null, error: terminal }) });
  await expect(server.vote({ questionId: 'q', userId: 'u', choice: 'A', actionId: 'a' })).rejects.toBe(terminal);
});

function client(results: Record<string, { data: unknown; error: unknown }> = {}) {
  return {
    rpc: jest.fn((name: string) => Promise.resolve(results[name] ?? { data: null, error: null })),
  };
}

test('maps daily, feed, and shared RPC rows to one camelCase question shape', async () => {
  const db = client({
    get_daily_question: { data: [questionRow], error: null },
    get_feed: { data: [{ ...questionRow, next_cursor: 'cursor-2' }], error: null },
    get_shared_question: { data: [questionRow], error: null },
  });
  const repository = new SupabaseQuestionRepository(db);

  await expect(repository.getDaily('2026-07-14')).resolves.toMatchObject({ id: 'q1', optionA: 'Alpha', weightsB: { stability: 2 } });
  await expect(repository.getFeed({ userId: 'ignored', cursor: null, limit: 10 })).resolves.toEqual({
    items: [expect.objectContaining({ id: 'q1', isDaily: true })], nextCursor: 'cursor-2',
  });
  await expect(repository.getById('q1')).resolves.toEqual(expect.not.objectContaining({ authorId: expect.anything() }));
  expect(db.rpc).toHaveBeenNthCalledWith(1, 'get_daily_question', { day: '2026-07-14' });
  expect(db.rpc).toHaveBeenNthCalledWith(2, 'get_feed', { cursor: null, page_size: 10 });
  expect(db.rpc).toHaveBeenNthCalledWith(3, 'get_shared_question', { target_question_id: 'q1' });
});

test('maps cast_vote receipt and duplicate-vote database errors', async () => {
  const receipt = { apply_status: 'applied', selected: 'B', count_a: 1, count_b: 9, percent_a: 10, percent_b: 90, label: '다수파', axis_scores: { freedom: 3 } };
  const db = client({ cast_vote: { data: receipt, error: null } });
  const repository = new SupabaseQuestionRepository(db);
  await expect(repository.vote({ questionId: 'q1', userId: 'ignored', choice: 'B', actionId: 'a1' })).resolves.toMatchObject({ applyStatus: 'applied', selected: 'B', label: '다수파', axisScores: { freedom: 3 } });
  expect(db.rpc).toHaveBeenCalledWith('cast_vote', { question_id: 'q1', choice: 'B', client_action_id: 'a1' });

  const duplicate = client({ cast_vote: { data: null, error: { code: 'P0001', message: 'DUPLICATE_VOTE' } } });
  await expect(new SupabaseQuestionRepository(duplicate).vote({ questionId: 'q1', userId: 'u1', choice: 'B', actionId: 'a2' })).rejects.toBeInstanceOf(DuplicateVoteError);
});

test('accepts only exact domain labels and does not map synthetic unique errors', async () => {
  const close = { apply_status: 'applied', selected: 'B', count_a: 50, count_b: 49, percent_a: 51, percent_b: 49, label: '초접전', axis_scores: {} };
  await expect(new SupabaseQuestionRepository(client({ cast_vote: { data: close, error: null } })).vote({ questionId: 'q', userId: 'u', choice: 'B', actionId: 'a' })).resolves.toMatchObject({ label: '초접전' });

  const impossible = { ...close, label: 'majority' };
  await expect(new SupabaseQuestionRepository(client({ cast_vote: { data: impossible, error: null } })).vote({ questionId: 'q', userId: 'u', choice: 'B', actionId: 'a' })).rejects.toThrow('invalid vote label');

  const synthetic = client({ cast_vote: { data: null, error: { code: '23505', details: 'Key (question_id, user_id) already exists.' } } });
  await expect(new SupabaseQuestionRepository(synthetic).vote({ questionId: 'q', userId: 'u', choice: 'B', actionId: 'a' })).rejects.not.toBeInstanceOf(DuplicateVoteError);
});

test('uses RPCs for skip, create, vote evidence, and moderation without caller ID parameters', async () => {
  const db = client({
    record_skip: { data: null, error: null },
    create_question: { data: [questionRow], error: null },
    get_vote_evidence: { data: [{ question_id: 'q1', choice: 'A', weights: { freedom: 1 }, category: 'life' }], error: null },
    react_reason: { data: null, error: null },
    report_question: { data: null, error: null },
    block_question_author: { data: null, error: null },
  });
  const repository = new SupabaseQuestionRepository(db);
  await repository.skip({ questionId: 'q1', userId: 'ignored' });
  await repository.create({ authorId: 'ignored', optionA: 'Alpha', optionB: 'Beta', description: 'Pick', category: 'life', visibility: 'public', closesAt: null });
  await expect(repository.getVoteEvidence('ignored')).resolves.toEqual([{ questionId: 'q1', choice: 'A', weights: { freedom: 1 }, category: 'life' }]);
  await repository.reactReason({ questionId: 'q1', userId: 'ignored', reason: 'realistic' });
  await repository.report({ questionId: 'q1', reporterId: 'ignored', reason: 'spam' });
  await repository.blockQuestionAuthor({ questionId: 'q1', blockerId: 'ignored' });
  expect(db.rpc.mock.calls).toEqual([
    ['record_skip', { question_id: 'q1' }],
    ['create_question', {
      p_option_a: 'Alpha', p_option_b: 'Beta', p_description: 'Pick', p_category: 'life',
      p_visibility: 'public', p_closes_at: null,
    }],
    ['get_vote_evidence', undefined],
    ['react_reason', { question_id: 'q1', reason_code: 'realistic' }],
    ['report_question', { question_id: 'q1', reason: 'spam' }],
    ['block_question_author', { question_id: 'q1' }],
  ]);
});
