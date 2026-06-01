import { createClient } from '@supabase/supabase-js';
import type {
  Database,
  OptionSide,
  Question,
  QuestionReactionType,
  TablesInsert,
  TablesUpdate,
} from '../types/database.types';

declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  };
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient<Database>(supabaseUrl, supabaseAnonKey) : null;

const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return supabase;
};

export type FeedSort = 'hot' | 'popular' | 'new' | 'controversial';

export interface FetchFeedQuestionsParams {
  userId?: string | null;
  sort?: FeedSort;
  categoryId?: string | null;
  limit?: number;
}

export interface SubmitVoteParams {
  userId: string;
  questionId: string;
  selectedOption: OptionSide;
  responseTimeMs?: number | null;
}

export interface SubmitReactionParams {
  userId: string;
  questionId: string;
  reactionType: QuestionReactionType;
}

const DEFAULT_FEED_LIMIT = 20;

const sortConfig: Record<FeedSort, { column: keyof Question; ascending: boolean }> = {
  hot: { column: 'heat_score', ascending: false },
  popular: { column: 'total_votes', ascending: false },
  new: { column: 'created_at', ascending: false },
  controversial: { column: 'controversy_score', ascending: false },
};

const reactionCountColumn: Record<QuestionReactionType, 'like_count' | 'fun_count' | 'hard_count'> = {
  like: 'like_count',
  fun: 'fun_count',
  hard: 'hard_count',
};

const isDuplicateKeyError = (errorCode?: string) => errorCode === '23505';

export const fetchFeedQuestions = async ({
  userId,
  sort = 'hot',
  categoryId,
  limit = DEFAULT_FEED_LIMIT,
}: FetchFeedQuestionsParams = {}): Promise<Question[]> => {
  const client = getSupabaseClient();
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const selectedSort = sortConfig[sort] ?? sortConfig.hot;

  let votedQuestionIds: string[] = [];

  if (userId) {
    const { data: votes, error: votesError } = await client
      .from('votes')
      .select('question_id')
      .eq('user_id', userId);

    if (votesError) {
      throw votesError;
    }

    votedQuestionIds = votes.map((vote) => vote.question_id);
  }

  let query = client
    .from('questions')
    .select('*')
    .eq('status', 'approved')
    .eq('visibility', 'public')
    .order(selectedSort.column, { ascending: selectedSort.ascending })
    .order('reward_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (votedQuestionIds.length > 0) {
    query = query.not('id', 'in', `(${votedQuestionIds.join(',')})`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const submitVote = async ({
  userId,
  questionId,
  selectedOption,
  responseTimeMs = null,
}: SubmitVoteParams) => {
  const client = getSupabaseClient();
  const votePayload: TablesInsert<'votes'> = {
    user_id: userId,
    question_id: questionId,
    selected_option: selectedOption,
    response_time_ms: responseTimeMs,
  };

  const { data, error } = await client
    .from('votes')
    .insert(votePayload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const submitReaction = async ({
  userId,
  questionId,
  reactionType,
}: SubmitReactionParams) => {
  const client = getSupabaseClient();
  const reactionPayload: TablesInsert<'question_reactions'> = {
    user_id: userId,
    question_id: questionId,
    reaction_type: reactionType,
  };

  const { data: reaction, error: reactionError } = await client
    .from('question_reactions')
    .insert(reactionPayload)
    .select('*')
    .single();

  if (reactionError) {
    if (isDuplicateKeyError(reactionError.code)) {
      return { reaction: null, question: null, alreadyReacted: true };
    }

    throw reactionError;
  }

  const countColumn = reactionCountColumn[reactionType];
  const { data: question, error: questionFetchError } = await client
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (questionFetchError) {
    await client.from('question_reactions').delete().eq('id', reaction.id);
    throw questionFetchError;
  }

  const questionPatch: TablesUpdate<'questions'> = {
    heat_score: question.heat_score + 0.25,
  };
  questionPatch[countColumn] = question[countColumn] + 1;

  const { data: updatedQuestion, error: questionUpdateError } = await client
    .from('questions')
    .update(questionPatch)
    .eq('id', questionId)
    .select('*')
    .single();

  if (questionUpdateError) {
    await client.from('question_reactions').delete().eq('id', reaction.id);
    throw questionUpdateError;
  }

  return { reaction, question: updatedQuestion, alreadyReacted: false };
};
