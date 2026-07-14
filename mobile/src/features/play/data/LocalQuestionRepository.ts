import seedQuestions from '../../../seed/questions.ko.json';
import { buildVoteResult } from '../domain/result';
import type {
  CreateQuestionInput,
  Question,
  ValueAxisId,
  VoteChoice,
  VoteReceipt,
} from '../domain/question';
import type { ReasonCode } from '../../moderation/domain/reasons';
import {
  DuplicateVoteError,
  type FeedPage,
  type QuestionRepository,
  type VoteEvidence,
} from './QuestionRepository';

const VALUE_AXES: ValueAxisId[] = [
  'freedom',
  'stability',
  'relationship',
  'reality',
  'emotion',
  'growth',
  'efficiency',
  'fun',
];

type VoteCounts = { countA: number; countB: number };

function emptyAxisScores(): Record<ValueAxisId, number> {
  return Object.fromEntries(VALUE_AXES.map((axis) => [axis, 0])) as Record<
    ValueAxisId,
    number
  >;
}

function copyQuestion(question: Question): Question {
  return {
    ...question,
    weightsA: { ...question.weightsA },
    weightsB: { ...question.weightsB },
  };
}

function copyReceipt(receipt: VoteReceipt): VoteReceipt {
  return { ...receipt, axisScores: { ...receipt.axisScores } };
}

export class LocalQuestionRepository implements QuestionRepository {
  private readonly questions = new Map<string, Question>();
  private readonly counts = new Map<string, VoteCounts>();
  private readonly votersByQuestion = new Map<string, Set<string>>();
  private readonly receiptsByUser = new Map<string, Map<string, VoteReceipt>>();
  private readonly scoresByUser = new Map<string, Record<ValueAxisId, number>>();
  private readonly voteEvidenceByUser = new Map<string, VoteEvidence[]>();
  private nextQuestionId = 1;

  constructor(questions: Question[] = seedQuestions as unknown as Question[]) {
    for (const question of questions) {
      this.questions.set(question.id, copyQuestion(question));
      this.counts.set(question.id, { countA: 0, countB: 0 });
    }
  }

  async getDaily(_date: string): Promise<Question | null> {
    const daily = [...this.questions.values()].find((question) => question.isDaily);
    return daily ? copyQuestion(daily) : null;
  }

  async getFeed(input: {
    userId: string;
    cursor: string | null;
    limit: number;
  }): Promise<FeedPage> {
    const start = input.cursor === null ? 0 : Number(input.cursor);
    const ordered = [...this.questions.values()]
      .filter(
        (question) =>
          question.visibility === 'public' &&
          (question.stage === 'active' || question.stage === 'test'),
      )
      .sort((left, right) => Number(right.isDaily) - Number(left.isDaily));
    const items = ordered.slice(start, start + input.limit).map(copyQuestion);
    const end = start + items.length;

    return {
      items,
      nextCursor: end < ordered.length ? String(end) : null,
    };
  }

  async getById(id: string): Promise<Question | null> {
    const question = this.questions.get(id);
    return question ? copyQuestion(question) : null;
  }

  async getVoteEvidence(userId: string): Promise<VoteEvidence[]> {
    return (this.voteEvidenceByUser.get(userId) ?? []).map((evidence) => ({
      ...evidence,
      weights: { ...evidence.weights },
    }));
  }

  async vote(input: {
    questionId: string;
    userId: string;
    choice: VoteChoice;
    actionId: string;
  }): Promise<VoteReceipt> {
    const userReceipts = this.receiptsByUser.get(input.userId);
    const previousReceipt = userReceipts?.get(input.actionId);
    if (previousReceipt) {
      return copyReceipt({ ...previousReceipt, applyStatus: 'already_applied' });
    }

    const question = this.questions.get(input.questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const questionVoters = this.votersByQuestion.get(input.questionId);
    if (questionVoters?.has(input.userId)) {
      throw new DuplicateVoteError();
    }

    const counts = this.counts.get(input.questionId) ?? { countA: 0, countB: 0 };
    if (input.choice === 'A') {
      counts.countA += 1;
    } else {
      counts.countB += 1;
    }
    this.counts.set(input.questionId, counts);

    const scores = this.scoresByUser.get(input.userId) ?? emptyAxisScores();
    const weights = input.choice === 'A' ? question.weightsA : question.weightsB;
    for (const axis of VALUE_AXES) {
      scores[axis] += weights[axis] ?? 0;
    }
    this.scoresByUser.set(input.userId, scores);

    const voteEvidence = this.voteEvidenceByUser.get(input.userId) ?? [];
    voteEvidence.push({
      questionId: question.id,
      choice: input.choice,
      weights: { ...weights },
      category: question.category,
    });
    this.voteEvidenceByUser.set(input.userId, voteEvidence);

    const receipt: VoteReceipt = {
      ...buildVoteResult(input.choice, counts.countA, counts.countB),
      applyStatus: 'applied',
      axisScores: { ...scores },
    };
    const voters = questionVoters ?? new Set<string>();
    voters.add(input.userId);
    this.votersByQuestion.set(input.questionId, voters);

    const receipts = userReceipts ?? new Map<string, VoteReceipt>();
    receipts.set(input.actionId, copyReceipt(receipt));
    this.receiptsByUser.set(input.userId, receipts);
    return copyReceipt(receipt);
  }

  async skip(_input: { questionId: string; userId: string }): Promise<void> {}

  async create(
    input: CreateQuestionInput & { authorId: string },
  ): Promise<Question> {
    const question: Question = {
      id: `local-${this.nextQuestionId++}`,
      optionA: input.optionA,
      optionB: input.optionB,
      description: input.description,
      category: input.category,
      visibility: input.visibility,
      closesAt: input.closesAt,
      isDaily: false,
      stage: input.visibility === 'public' ? 'test' : 'pending',
      weightsA: {},
      weightsB: {},
    };
    this.questions.set(question.id, question);
    this.counts.set(question.id, { countA: 0, countB: 0 });
    return copyQuestion(question);
  }

  async report(_input: {
    questionId: string;
    reporterId: string;
    reason: string;
  }): Promise<void> {}

  async reactReason(_input: {
    questionId: string;
    userId: string;
    reason: ReasonCode;
  }): Promise<void> {}

}
