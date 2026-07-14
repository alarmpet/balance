import { supabase } from '@/src/lib/supabase';
import type {
  CreateQuestionInput,
  OptionWeights,
  Question,
  ValueAxisId,
  VoteChoice,
  VoteReceipt,
} from '../domain/question';
import type { ReasonCode } from '../../moderation/domain/reasons';
import {
  mapPostgresVoteError,
  mapRepositoryError,
  type FeedPage,
  type ClosedQuestionResult,
  type QuestionRepository,
  type VoteEvidence,
} from './QuestionRepository';

interface RpcResult {
  data: unknown;
  error: unknown;
}

interface RpcClient {
  rpc(name: string, params?: Record<string, unknown>): PromiseLike<RpcResult>;
}

interface QuestionRow {
  question_id: string;
  option_a: string;
  option_b: string;
  description: string | null;
  category: string;
  visibility: Question['visibility'];
  closes_at: string | null;
  is_daily?: boolean;
  stage: Question['stage'];
  weights_a: OptionWeights | null;
  weights_b: OptionWeights | null;
  next_cursor?: string | null;
}

interface VoteReceiptRow {
  apply_status: VoteReceipt['applyStatus'];
  selected: VoteChoice;
  count_a: number;
  count_b: number;
  percent_a: number;
  percent_b: number;
  label: unknown;
  axis_scores: Record<ValueAxisId, number>;
}

interface ClosedResultRow extends QuestionRow {
  count_a: number; count_b: number; percent_a: number; percent_b: number; result_label: string;
}

function voteLabel(value: unknown): VoteReceipt['label'] {
  if (value === '다수파' || value === '소수파' || value === '초접전') return value;
  throw new Error('cast_vote returned an invalid vote label');
}

function first<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T | undefined) ?? null;
  return data === null ? null : data as T;
}

function rows<T>(data: unknown): T[] {
  if (data === null) return [];
  return (Array.isArray(data) ? data : [data]) as T[];
}

export class SupabaseQuestionRepository implements QuestionRepository {
  constructor(private readonly client: RpcClient = supabase) {}

  private mapQuestion(row: QuestionRow): Question {
    return {
      id: row.question_id,
      optionA: row.option_a,
      optionB: row.option_b,
      description: row.description,
      category: row.category,
      visibility: row.visibility,
      closesAt: row.closes_at,
      isDaily: row.is_daily ?? false,
      stage: row.stage,
      weightsA: row.weights_a ?? {},
      weightsB: row.weights_b ?? {},
    };
  }

  private async call(name: string, params?: Record<string, unknown>): Promise<unknown> {
    try {
      const { data, error } = await this.client.rpc(name, params);
      if (error) throw mapRepositoryError(error);
      return data;
    } catch (error) { throw mapRepositoryError(error); }
  }

  async getDaily(date: string): Promise<Question | null> {
    const row = first<QuestionRow>(await this.call('get_daily_question', { day: date }));
    return row ? this.mapQuestion(row) : null;
  }

  async getFeed(input: { userId: string; cursor: string | null; limit: number }): Promise<FeedPage> {
    const result = rows<QuestionRow>(await this.call('get_feed', {
      cursor: input.cursor,
      page_size: input.limit,
    }));
    return {
      items: result.map((row) => this.mapQuestion(row)),
      nextCursor: result[0]?.next_cursor ?? null,
    };
  }

  async getById(id: string): Promise<Question | null> {
    const row = first<QuestionRow>(await this.call('get_shared_question', { target_question_id: id }));
    return row ? this.mapQuestion(row) : null;
  }

  async getClosedResult(id: string): Promise<ClosedQuestionResult | null> {
    const row = first<ClosedResultRow>(await this.call('get_closed_question_result', { target_question_id: id }));
    return row ? {
      question: this.mapQuestion(row), countA: row.count_a, countB: row.count_b,
      percentA: row.percent_a, percentB: row.percent_b, label: row.result_label,
    } : null;
  }

  async getVoteEvidence(_userId: string): Promise<VoteEvidence[]> {
    return rows<{ question_id: string; choice: VoteChoice; weights: OptionWeights; category: string }>(
      await this.call('get_vote_evidence'),
    ).map((row) => ({
      questionId: row.question_id,
      choice: row.choice,
      weights: row.weights,
      category: row.category,
    }));
  }

  async vote(input: { questionId: string; userId: string; choice: VoteChoice; actionId: string }): Promise<VoteReceipt> {
    let data: unknown;
    try {
      data = await this.call('cast_vote', {
        question_id: input.questionId,
        choice: input.choice,
        client_action_id: input.actionId,
      });
    } catch (error) {
      throw mapPostgresVoteError(error);
    }
    const row = first<VoteReceiptRow>(data);
    if (!row) throw new Error('cast_vote returned no receipt');
    return {
      applyStatus: row.apply_status,
      selected: row.selected,
      countA: row.count_a,
      countB: row.count_b,
      percentA: row.percent_a,
      percentB: row.percent_b,
      label: voteLabel(row.label),
      axisScores: row.axis_scores,
    };
  }

  async skip(input: { questionId: string; userId: string }): Promise<void> {
    await this.call('record_skip', { question_id: input.questionId });
  }

  async create(input: CreateQuestionInput & { authorId: string }): Promise<Question> {
    const row = first<QuestionRow>(await this.call('create_question', {
      p_option_a: input.optionA,
      p_option_b: input.optionB,
      p_description: input.description,
      p_category: input.category,
      p_visibility: input.visibility,
      p_closes_at: input.closesAt,
    }));
    if (!row) throw new Error('create_question returned no question');
    return this.mapQuestion(row);
  }

  async report(input: { questionId: string; reporterId: string; reason: string }): Promise<void> {
    await this.call('report_question', {
      question_id: input.questionId,
      reason: input.reason,
    });
  }

  async reactReason(input: { questionId: string; userId: string; reason: ReasonCode }): Promise<void> {
    await this.call('react_reason', {
      question_id: input.questionId,
      reason_code: input.reason,
    });
  }

  async blockQuestionAuthor(input: { questionId: string; blockerId: string }): Promise<void> {
    await this.call('block_question_author', { question_id: input.questionId });
  }
}
