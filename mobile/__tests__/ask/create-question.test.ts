import {
  createQuestionSchema,
  normalizeCreateQuestion,
} from '@/src/features/ask/domain/createQuestion';

const validInput = {
  optionA: 'A',
  optionB: 'B',
  description: '',
  category: '일상',
  visibility: 'public' as const,
  closesAt: null,
};

test('requires two different options of at most 40 characters', () => {
  expect(createQuestionSchema.safeParse({ ...validInput, optionB: 'A' }).success).toBe(false);
  expect(createQuestionSchema.safeParse(validInput).success).toBe(true);
  expect(
    createQuestionSchema.safeParse({ ...validInput, optionA: '가'.repeat(41) }).success,
  ).toBe(false);
});

test('rejects descriptions longer than 120 characters', () => {
  const result = createQuestionSchema.safeParse({
    ...validInput,
    description: '가'.repeat(121),
    visibility: 'link',
  });

  expect(result.success).toBe(false);
});

test('normalizes whitespace and an empty description', () => {
  expect(
    normalizeCreateQuestion({
      ...validInput,
      optionA: '  집에 있기  ',
      optionB: '  외출하기 ',
      category: '  일상 ',
    }),
  ).toEqual({
    ...validInput,
    optionA: '집에 있기',
    optionB: '외출하기',
    description: null,
  });
});

test('rejects Unicode-normalized and Korean-locale case-equivalent options', () => {
  expect(
    createQuestionSchema.safeParse({
      ...validInput,
      optionA: '가',
      optionB: '\u1100\u1161',
    }).success,
  ).toBe(false);
  expect(
    createQuestionSchema.safeParse({
      ...validInput,
      optionA: 'ABC',
      optionB: 'abc',
    }).success,
  ).toBe(false);
});

test('requires close times to be in the future', () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();
  const pastResult = createQuestionSchema.safeParse({ ...validInput, closesAt: past });

  expect(pastResult.success).toBe(false);
  if (!pastResult.success) {
    expect(pastResult.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: '마감 시간은 현재보다 이후여야 해요.',
          path: ['closesAt'],
        }),
      ]),
    );
  }
  expect(createQuestionSchema.safeParse({ ...validInput, closesAt: future }).success).toBe(true);
});
