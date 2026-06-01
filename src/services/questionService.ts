import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv, hasSupabaseConfig } from '../lib/env';
import type { Database, Json } from '../types/database.types';

export type OptionSide = 'A' | 'B';
export type ReactionType = 'like' | 'fun' | 'hard';
export type FeedSort = 'popular' | 'latest' | 'trending';

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

const supabaseUrl = getPublicEnv('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

const rpcClient = supabase as SupabaseClient | null;

export async function fetchFeedQuestions(_sort: FeedSort = 'popular', limit = 30): Promise<FeedQuestion[]> {
  if (!supabase || !hasSupabaseConfig()) {
    throw new Error('Supabase 프로젝트 설정이 필요합니다. 브라우저에서 Supabase 인증을 완료한 뒤 .env를 채워 주세요.');
  }

  const { data, error } = await rpcClient!.rpc('fetch_feed_questions', {
    p_limit: limit,
    p_cursor_created_at: null
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
    userVote: null,
    userReaction: null,
    created_at: row.created_at
  }));
}

export async function submitVote(questionId: string, selectedOption: OptionSide): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 설정이 필요합니다.');
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
    throw new Error('Supabase 프로젝트 설정이 필요합니다.');
  }

  const { error } = await rpcClient!.rpc('submit_reaction', {
    p_question_id: questionId,
    p_reaction_type: reactionType
  });

  if (error) throw error;
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
