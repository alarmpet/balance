import { z } from 'zod';

function optionComparisonKey(value: string): string {
  return value.trim().normalize('NFC').toLocaleLowerCase('ko-KR');
}

export function areCreateQuestionOptionsDifferent(optionA: string, optionB: string): boolean {
  return optionComparisonKey(optionA) !== optionComparisonKey(optionB);
}

export const createQuestionSchema = z
  .object({
    optionA: z.string().trim().min(1, 'A를 입력해 주세요.').max(40),
    optionB: z.string().trim().min(1, 'B를 입력해 주세요.').max(40),
    description: z
      .string()
      .trim()
      .max(120)
      .transform((value) => value || null),
    category: z.string().trim().min(1),
    visibility: z.enum(['public', 'link']),
    closesAt: z.string().datetime().nullable(),
  })
  .refine(
    (value) => areCreateQuestionOptionsDifferent(value.optionA, value.optionB),
    {
      message: '서로 다른 선택지를 입력해 주세요.',
      path: ['optionB'],
    },
  )
  .refine(
    (value) => value.closesAt === null || Date.parse(value.closesAt) > Date.now(),
    {
      message: '마감 시간은 현재보다 이후여야 해요.',
      path: ['closesAt'],
    },
  );

export type CreateQuestionForm = z.input<typeof createQuestionSchema>;

export const normalizeCreateQuestion = (input: CreateQuestionForm) =>
  createQuestionSchema.parse(input);
