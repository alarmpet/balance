export type TraitMapping = {
  option_side: 'A' | 'B';
  trait_key: string;
  weight: number;
};

export type AIRefineResult = {
  title: string;
  description: string;
  option_a_title: string;
  option_a_description: string;
  option_b_title: string;
  option_b_description: string;
  tags: string[];
  trait_mapping: TraitMapping[];
};

export type DuplicateCheckResult = {
  highestSimilarity: number;
  shouldBlock: boolean;
  shouldWarn: boolean;
  matches: Array<{
    id: string;
    title: string;
    similarity: number;
  }>;
};

export async function refineQuestionWithAI(input: {
  title: string;
  optionA: string;
  optionB: string;
  category: string;
}): Promise<AIRefineResult> {
  return {
    title: input.title.trim(),
    description: `${input.category} 섬에서 고르는 오늘의 밸런스 질문`,
    option_a_title: input.optionA.trim(),
    option_a_description: '첫 번째 선택지가 가진 매력을 살린 문장입니다.',
    option_b_title: input.optionB.trim(),
    option_b_description: '두 번째 선택지가 가진 매력을 살린 문장입니다.',
    tags: [input.category, '밸런스', 'MVP'],
    trait_mapping: [
      { option_side: 'A', trait_key: 'curious', weight: 1.2 },
      { option_side: 'B', trait_key: 'comfort_seeker', weight: 1.2 }
    ]
  };
}

export async function checkDuplicateQuestion(): Promise<DuplicateCheckResult> {
  return {
    highestSimilarity: 0,
    matches: [],
    shouldBlock: false,
    shouldWarn: false
  };
}

export async function submitRefinedQuestion(): Promise<{ id: string }> {
  return { id: `local-${Date.now()}` };
}
