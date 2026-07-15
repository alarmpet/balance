import type {
  CreateQuestionInput,
  OptionWeights,
  Question,
  VoteChoice,
  VoteReceipt,
} from '../domain/question';
import type { ReasonCode } from '../../moderation/domain/reasons';

export interface FeedPage {
  items: Question[];
  nextCursor: string | null;
}

export interface VoteEvidence {
  questionId: string;
  choice: VoteChoice;
  weights: OptionWeights;
  category: string;
}

export interface ClosedQuestionResult {
  question: Question;
  countA: number;
  countB: number;
  percentA: number;
  percentB: number;
  label: string;
}

export class DuplicateVoteError extends Error {
  readonly code = 'duplicate_vote';

  constructor(message = 'User has already voted on this question') {
    super(message);
    this.name = 'DuplicateVoteError';
  }
}

export class RetryableTransportError extends Error {
  readonly code = 'retryable_transport';
  constructor(message = 'Network transport failed', readonly cause?: unknown) {
    super(message); this.name = 'RetryableTransportError';
  }
}

export class ClosedQuestionError extends Error {
  readonly code = 'question_closed';
  constructor(message = 'Question is closed or unavailable') { super(message); this.name = 'ClosedQuestionError'; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isDuplicateVoteError(error: unknown): boolean {
  return isRecord(error) && error.code === 'duplicate_vote';
}

export function isRetryableTransportError(error: unknown): boolean {
  return error instanceof RetryableTransportError || (isRecord(error) && error.code === 'retryable_transport');
}

export function mapRepositoryError(error: unknown): unknown {
  if (error instanceof TypeError) return new RetryableTransportError(error.message, error);
  if (isRecord(error) && error.code === '' && typeof error.message === 'string'
    && /^(?:TypeError: )?(?:fetch failed|Failed to fetch|Network request failed)$/i.test(error.message.trim())) {
    return new RetryableTransportError(error.message, error);
  }
  if (isRecord(error) && ['NETWORK_ERROR', 'FETCH_ERROR', 'ETIMEDOUT', 'ECONNRESET'].includes(String(error.code))) {
    return new RetryableTransportError(String(error.message ?? 'Network transport failed'), error);
  }
  if (isRecord(error) && error.code === '55000' && error.message === 'question is not open for voting') {
    return new ClosedQuestionError();
  }
  return error;
}

export function mapPostgresVoteError(error: unknown): unknown {
  const mapped = mapRepositoryError(error);
  return isRecord(mapped) && mapped.code === 'P0001' && mapped.message === 'DUPLICATE_VOTE'
    ? new DuplicateVoteError()
    : mapped;
}

export interface QuestionRepository {
  getDaily(date: string): Promise<Question | null>;
  getFeed(input: {
    userId: string;
    cursor: string | null;
    limit: number;
  }): Promise<FeedPage>;
  getById(id: string): Promise<Question | null>;
  getClosedResult?(id: string): Promise<ClosedQuestionResult | null>;
  getVoteEvidence(userId: string): Promise<VoteEvidence[]>;
  vote(input: {
    questionId: string;
    userId: string;
    choice: VoteChoice;
    actionId: string;
  }): Promise<VoteReceipt>;
  skip(input: { questionId: string; userId: string }): Promise<void>;
  create(input: CreateQuestionInput & { authorId: string }): Promise<Question>;
  report(input: {
    questionId: string;
    reporterId: string;
    reason: string;
  }): Promise<void>;
  reactReason?(input: {
    questionId: string;
    userId: string;
    reason: ReasonCode;
  }): Promise<void>;
  blockQuestionAuthor?(input: { questionId: string; blockerId: string }): Promise<void>;
}
