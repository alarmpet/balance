import type { SupabaseClient } from '@supabase/supabase-js';
import { hasSupabaseConfig } from '../lib/env';
import { supabase } from '../lib/supabaseClient';
import type { Database, Json, QuestionRow } from '../types/database.types';

export type OptionSide = 'A' | 'B';
export type ReactionType = 'like' | 'fun' | 'hard';
export type FeedSort = 'popular' | 'latest' | 'trending';

export type UserQuestionSubmission = {
  title: string;
  optionA: string;
  optionB: string;
  categorySlug: string;
  description?: string | null;
  isAnonymous?: boolean;
};

export type FeedQuestion = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
  tags: string[];
  option_a_title: string;
  option_a_description: string | null;
  option_a_image_url: string | null;
  option_b_title: string;
  option_b_description: string | null;
  option_b_image_url: string | null;
  vote_count_a: number;
  vote_count_b: number;
  reaction_like_count: number;
  reaction_fun_count: number;
  reaction_hard_count: number;
  comment_count: number;
  userVote: OptionSide | null;
  userReaction: ReactionType | null;
  created_at: string;
};

const rpcClient = supabase as SupabaseClient | null;

export async function fetchFeedQuestions(
  sort: FeedSort = 'popular',
  limit = 30,
  excludeAnswered = true
): Promise<FeedQuestion[]> {
  if (!supabase || !hasSupabaseConfig()) {
    throw new Error('Supabase 설정이 필요합니다. 브라우저에서 인증을 완료하고 .env를 확인해 주세요.');
  }

  const { data, error } = await rpcClient!.rpc('fetch_feed_questions', {
    p_limit: limit,
    p_cursor_created_at: null,
    p_sort: sort,
    p_exclude_answered: excludeAnswered
  });

  if (error) throw error;

  const rows = (data ?? []) as Database['public']['Functions']['fetch_feed_questions']['Returns'];

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category_id: row.category_id,
    category: normalizeCategory(row.category),
    tags: row.tags ?? [],
    option_a_title: row.option_a_title,
    option_a_description: row.option_a_description,
    option_a_image_url: row.option_a_image_url,
    option_b_title: row.option_b_title,
    option_b_description: row.option_b_description,
    option_b_image_url: row.option_b_image_url,
    vote_count_a: row.vote_count_a ?? 0,
    vote_count_b: row.vote_count_b ?? 0,
    reaction_like_count: row.reaction_like_count ?? 0,
    reaction_fun_count: row.reaction_fun_count ?? 0,
    reaction_hard_count: row.reaction_hard_count ?? 0,
    comment_count: row.comment_count ?? 0,
    userVote: normalizeOptionSide(row.user_vote),
    userReaction: normalizeReaction(row.user_reaction),
    created_at: row.created_at
  }));
}

export async function submitVote(questionId: string, selectedOption: OptionSide): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase 설정이 필요합니다.');
  }

  const { error } = await rpcClient!.rpc('submit_vote', {
    p_question_id: questionId,
    p_selected_option: selectedOption,
    p_response_time_ms: null
  });

  if (error) throw error;
}

export async function submitReaction(questionId: string, reactionType: ReactionType): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase 설정이 필요합니다.');
  }

  const { error } = await rpcClient!.rpc('submit_reaction', {
    p_question_id: questionId,
    p_reaction_type: reactionType
  });

  if (error) throw error;
}

export type SimilarQuestion = {
  id: string;
  title: string;
  status: string;
  similarity: number;
};

/**
 * 제출 전 중복 경고용. 기존 approved/pending 중 제목이 유사한 질문을 반환한다(무료 pg_trgm).
 * 표기/공백/기호 차이는 잘 잡지만 동의어·재서술 중복은 약하다(임베딩 영역).
 */
export async function findSimilarQuestions(
  title: string,
  threshold = 0.45,
  limit = 5
): Promise<SimilarQuestion[]> {
  if (!supabase || !hasSupabaseConfig()) return [];
  const trimmed = title.trim();
  if (trimmed.length < 4) return [];

  const { data, error } = await rpcClient!.rpc('find_similar_questions', {
    p_title: trimmed,
    p_threshold: threshold,
    p_limit: limit
  });

  if (error) throw error;
  return (data ?? []) as SimilarQuestion[];
}

export async function submitUserQuestion(input: UserQuestionSubmission): Promise<QuestionRow> {
  if (!supabase || !hasSupabaseConfig()) {
    throw new Error('Supabase 설정이 필요합니다. 로그인 후 다시 시도해 주세요.');
  }

  const { data, error } = await rpcClient!.rpc('submit_user_question', {
    p_title: input.title.trim(),
    p_option_a_title: input.optionA.trim(),
    p_option_b_title: input.optionB.trim(),
    p_category_slug: input.categorySlug,
    p_description: input.description?.trim() || null,
    p_is_anonymous: input.isAnonymous ?? false
  });

  if (error) throw error;
  return data as QuestionRow;
}

function normalizeCategory(value: Json | null): FeedQuestion['category'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const category = value as Record<string, Json | undefined>;
  if (!category.id || !category.name || !category.slug) {
    return null;
  }

  return {
    id: String(category.id),
    name: String(category.name),
    slug: String(category.slug),
    color: category.color ? String(category.color) : null
  };
}

function normalizeOptionSide(value: string | null): OptionSide | null {
  return value === 'A' || value === 'B' ? value : null;
}

function normalizeReaction(value: string | null): ReactionType | null {
  return value === 'like' || value === 'fun' || value === 'hard' ? value : null;
}
