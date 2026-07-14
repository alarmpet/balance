import { calculateBrain } from '@/src/features/brain/domain/brain';

test('reveals stages at 10, 20, and 50 votes', () => {
  const makeVotes = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      questionId: String(index),
      choice: 'A' as const,
      weights: { freedom: 1 },
    }));

  expect(calculateBrain(makeVotes(9)).stage).toBe('awakening');
  expect(calculateBrain(makeVotes(10)).stage).toBe('axes');
  expect(calculateBrain(makeVotes(20)).stage).toBe('type');
  expect(calculateBrain(makeVotes(50)).stage).toBe('context');
});

test('keeps evidence question ids for every scored axis', () => {
  const result = calculateBrain([
    { questionId: 'q1', choice: 'A', weights: { freedom: 1, fun: 0.5 } },
  ]);

  expect(result.axes.freedom.evidenceIds).toEqual(['q1']);
  expect(result.axes.fun.evidenceIds).toEqual(['q1']);
});

test('initializes all eight axes and sums only finite positive weights', () => {
  const result = calculateBrain([
    {
      questionId: 'q1',
      choice: 'B',
      weights: { freedom: 2, fun: Number.POSITIVE_INFINITY, growth: -1 },
    },
  ]);

  expect(Object.keys(result.axes)).toHaveLength(8);
  expect(result.axes.freedom).toEqual({ score: 2, evidenceIds: ['q1'] });
  expect(result.axes.fun).toEqual({ score: 0, evidenceIds: [] });
  expect(result.axes.growth).toEqual({ score: 0, evidenceIds: [] });
});

test('names any top-two pair without a generic fallback', () => {
  const result = calculateBrain(
    Array.from({ length: 20 }, (_, index) => ({
      questionId: String(index),
      choice: 'A' as const,
      weights: { freedom: 2, relationship: 1 },
    })),
  );

  expect(result.archetype).toBe('자유·관계 선택가');
});

test('does not claim a settled pair when second and third are tied', () => {
  const result = calculateBrain(
    Array.from({ length: 20 }, (_, index) => ({
      questionId: String(index),
      choice: 'A' as const,
      weights: { freedom: 2, relationship: 1, fun: 1 },
    })),
  );

  expect(result.archetype).toBe('균형을 탐색하는 중');
});

test('returns no archetype before 20 votes and sorts tied scores by axis id', () => {
  const result = calculateBrain([
    { questionId: 'q1', choice: 'A', weights: { stability: 1, freedom: 1 } },
  ]);

  expect(result.archetype).toBeNull();
  expect(result.topAxes.slice(0, 2)).toEqual(['freedom', 'stability']);
});

test('normalizes category axis profiles by vote count and retains axis evidence', () => {
  const result = calculateBrain([
    { questionId: 'daily-1', choice: 'A', category: '일상', weights: { freedom: 2 } },
    { questionId: 'daily-2', choice: 'A', category: '일상', weights: { freedom: 2 } },
    { questionId: 'hobby-1', choice: 'B', category: '취향', weights: { stability: 3 } },
    { questionId: 'hobby-2', choice: 'B', category: '취향', weights: { stability: 3 } },
    { questionId: 'focus-1', choice: 'A', category: '집중', weights: { freedom: 5 } },
  ]);

  const daily = result.categoryProfiles.find((profile) => profile.category === '일상');
  const hobby = result.categoryProfiles.find((profile) => profile.category === '취향');
  const focus = result.categoryProfiles.find((profile) => profile.category === '집중');

  expect(daily?.topAxes[0]).toBe('freedom');
  expect(daily?.axes.freedom).toEqual({ score: 2, evidenceIds: ['daily-1', 'daily-2'] });
  expect(hobby?.topAxes[0]).toBe('stability');
  expect(hobby?.axes.stability.score).toBe(3);
  expect(focus?.axes.freedom.score).toBe(5);
  expect(focus!.axes.freedom.score).toBeGreaterThan(daily!.axes.freedom.score);
});
