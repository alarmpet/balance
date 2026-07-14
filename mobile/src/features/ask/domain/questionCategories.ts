export const QUESTION_CATEGORIES = ['일상', '회사', '관계', '여행', '돈', '성장'] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

