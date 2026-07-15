import { LocalQuestionRepository } from '@/src/features/play/data/LocalQuestionRepository';
import type { Question } from '@/src/features/play/domain/question';
import { buildVoteResult } from '@/src/features/play/domain/result';

test('rounds percentages while keeping the pair at 100', () => {
  expect(buildVoteResult('A', 2, 1)).toEqual({
    selected: 'A',
    countA: 2,
    countB: 1,
    percentA: 67,
    percentB: 33,
    label: '다수파',
  });
});

test('labels a 48 to 52 result as a close match', () => {
  expect(buildVoteResult('B', 48, 52).label).toBe('초접전');
});

test('labels a selected side below 50 percent as minority', () => {
  expect(buildVoteResult('A', 20, 80).label).toBe('소수파');
});

test('serves the daily question first in the local feed', async () => {
  const repository = new LocalQuestionRepository();

  await expect(repository.getDaily('2026-07-14')).resolves.toMatchObject({
    id: 'daily-ramen-chicken',
    isDaily: true,
  });
  await expect(
    repository.getFeed({ userId: 'user-1', cursor: null, limit: 2 }),
  ).resolves.toMatchObject({
    items: [{ id: 'daily-ramen-chicken' }, { id: 'commute-salary' }],
    nextCursor: '2',
  });
});

test('replays an action id without incrementing votes or axis scores', async () => {
  const repository = new LocalQuestionRepository();
  const input = {
    questionId: 'commute-salary',
    userId: 'user-1',
    choice: 'A' as const,
    actionId: 'action-1',
  };

  const first = await repository.vote(input);
  const replay = await repository.vote(input);

  expect(first).toMatchObject({
    selected: 'A',
    countA: 1,
    countB: 0,
    applyStatus: 'applied',
    axisScores: { freedom: 1, efficiency: 0.5 },
  });
  expect(replay).toEqual({ ...first, applyStatus: 'already_applied' });
});

test('rejects a different action after the user already voted on a question', async () => {
  const repository = new LocalQuestionRepository();
  await repository.vote({
    questionId: 'commute-salary',
    userId: 'user-1',
    choice: 'A',
    actionId: 'action-1',
  });

  await expect(
    repository.vote({
      questionId: 'commute-salary',
      userId: 'user-1',
      choice: 'B',
      actionId: 'action-2',
    }),
  ).rejects.toThrow('User has already voted on this question');
});

test('creates a public test question that can be retrieved by id', async () => {
  const repository = new LocalQuestionRepository();

  const created = await repository.create({
    optionA: '산',
    optionB: '바다',
    description: null,
    category: '여행',
    visibility: 'public',
    closesAt: null,
    authorId: 'user-1',
  });

  expect(created).toMatchObject({
    id: 'local-1',
    isDaily: false,
    stage: 'test',
    weightsA: {},
    weightsB: {},
  });
  await expect(repository.getById(created.id)).resolves.toEqual(created);
});

test('accepts local skip and report events', async () => {
  const repository = new LocalQuestionRepository();

  await expect(
    repository.skip({ questionId: 'commute-salary', userId: 'user-1' }),
  ).resolves.toBeUndefined();
  await expect(
    repository.report({
      questionId: 'commute-salary',
      reporterId: 'user-1',
      reason: '중복',
    }),
  ).resolves.toBeUndefined();
});

test('keeps colon-containing user and action id tuples distinct', async () => {
  const repository = new LocalQuestionRepository();

  await repository.vote({
    questionId: 'commute-salary',
    userId: 'a:b',
    choice: 'A',
    actionId: 'c',
  });
  const second = await repository.vote({
    questionId: 'friends-depth-width',
    userId: 'a',
    choice: 'B',
    actionId: 'b:c',
  });

  expect(second).toMatchObject({
    selected: 'B',
    countA: 0,
    countB: 1,
    applyStatus: 'applied',
  });
});

test('keeps colon-containing question and user id tuples distinct', async () => {
  const question = (id: string): Question => ({
    id,
    optionA: 'A',
    optionB: 'B',
    description: null,
    category: 'test',
    visibility: 'public',
    closesAt: null,
    isDaily: false,
    stage: 'active',
    weightsA: {},
    weightsB: {},
  });
  const repository = new LocalQuestionRepository([question('a:b'), question('a')]);

  await repository.vote({
    questionId: 'a:b',
    userId: 'c',
    choice: 'A',
    actionId: 'action-1',
  });
  const second = await repository.vote({
    questionId: 'a',
    userId: 'b:c',
    choice: 'B',
    actionId: 'action-2',
  });

  expect(second).toMatchObject({
    selected: 'B',
    countA: 0,
    countB: 1,
    applyStatus: 'applied',
  });
});
