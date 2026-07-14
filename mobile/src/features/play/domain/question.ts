export type VoteChoice = 'A' | 'B';
export type QuestionVisibility = 'public' | 'link';
export type DistributionStage = 'pending' | 'test' | 'active' | 'limited' | 'hidden';
export type ValueAxisId =
  | 'freedom'
  | 'stability'
  | 'relationship'
  | 'reality'
  | 'emotion'
  | 'growth'
  | 'efficiency'
  | 'fun';

export type OptionWeights = Partial<Record<ValueAxisId, number>>;

export interface Question {
  id: string;
  optionA: string;
  optionB: string;
  description: string | null;
  category: string;
  visibility: QuestionVisibility;
  closesAt: string | null;
  isDaily: boolean;
  stage: DistributionStage;
  weightsA: OptionWeights;
  weightsB: OptionWeights;
}

export interface VoteResult {
  selected: VoteChoice;
  countA: number;
  countB: number;
  percentA: number;
  percentB: number;
  label: '다수파' | '소수파' | '초접전';
}

export interface VoteReceipt extends VoteResult {
  applyStatus: 'applied' | 'already_applied';
  axisScores: Record<ValueAxisId, number>;
}

export interface CreateQuestionInput {
  optionA: string;
  optionB: string;
  description: string | null;
  category: string;
  visibility: QuestionVisibility;
  closesAt: string | null;
}
