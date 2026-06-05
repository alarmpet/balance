import type { SupabaseClient } from '@supabase/supabase-js';
import { hasSupabaseConfig } from '../lib/env';
import { supabase } from '../lib/supabaseClient';

const rpcClient = supabase as SupabaseClient | null;

export type IslandType = {
  code: string;
  name: string;
  emoji: string;
  archipelago: string;
  archipelago_emoji: string;
  tagline: string;
  persona: string | null;
  voyage: '정박형' | '원정형';
  is_social: boolean;
  is_curious: boolean;
  is_express: boolean;
  is_flow: boolean;
  /** 0~1. 표본(누적 trait 가중치)이 적으면 낮음 → "5개 더 풀면 확정" 게이팅에 사용. */
  confidence: number;
  answered_weight: number;
};

/** 확정 표시 임계. 이 미만이면 "아직 ○○ 섬에 가까워요"로 잠정 표기. */
export const ISLAND_TYPE_CONFIDENT_THRESHOLD = 0.6;

/**
 * 내 섬 타입(4축 우세극 → 16섬 + 항해 수식어 + 신뢰도)을 가져온다.
 * 로그인/표본이 없으면 null(아직 섬 미정).
 */
export async function fetchMyIslandType(): Promise<IslandType | null> {
  if (!supabase || !hasSupabaseConfig() || !rpcClient) return null;

  const { data, error } = await rpcClient.rpc('compute_user_island_type', {});
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    ...row,
    confidence: Number(row.confidence ?? 0),
    answered_weight: Number(row.answered_weight ?? 0)
  } as IslandType;
}

export function isIslandTypeConfident(type: IslandType | null): boolean {
  return Boolean(type) && (type as IslandType).confidence >= ISLAND_TYPE_CONFIDENT_THRESHOLD;
}

export type IslandAxisGuess = {
  social: boolean;
  curious: boolean;
  express: boolean;
  flow: boolean;
};

export type FriendsIslandView = {
  responses: number;
  social_pct: number;
  curious_pct: number;
  express_pct: number;
  flow_pct: number;
  guessed_code: string | null;
  guessed_name: string | null;
  guessed_emoji: string | null;
};

/** 친구가 대상(targetId)을 어느 섬으로 보는지 4축 추측 제출(로그인 필요, 본인 제외). */
export async function submitFriendGuess(targetId: string, guess: IslandAxisGuess): Promise<void> {
  if (!supabase || !hasSupabaseConfig() || !rpcClient) {
    throw new Error('로그인 후 다시 시도해 주세요.');
  }
  const { error } = await rpcClient.rpc('submit_island_friend_guess', {
    p_target: targetId,
    p_social: guess.social,
    p_curious: guess.curious,
    p_express: guess.express,
    p_flow: guess.flow
  });
  if (error) throw error;
}

export type IslandTypeBrief = {
  code: string;
  name: string;
  emoji: string;
  archipelago: string;
  archipelago_emoji: string;
  tagline: string;
};

/** 4축 조합으로 해당 섬을 조회(공유/추측 결과 표시용). island_types는 공개 read. */
export async function fetchIslandByAxes(guess: IslandAxisGuess): Promise<IslandTypeBrief | null> {
  if (!supabase || !hasSupabaseConfig()) return null;
  const { data, error } = await supabase
    .from('island_types')
    .select('code, name, emoji, archipelago, archipelago_emoji, tagline')
    .eq('a1_social', guess.social)
    .eq('a2_curious', guess.curious)
    .eq('a3_express', guess.express)
    .eq('a4_flow', guess.flow)
    .maybeSingle();
  if (error) throw error;
  return data ? (data as IslandTypeBrief) : null;
}

export type IslandBestMatch = {
  code: string;
  name: string;
  emoji: string;
  tagline: string;
  romance_score: number;
};

export type IslandCompatContext = {
  score: number;
  harmony: string[];
  challenge: string[];
};

export type IslandCompat = {
  a: { code: string; name: string; emoji: string };
  b: { code: string; name: string; emoji: string };
  romance: IslandCompatContext;
  friend: IslandCompatContext;
  work: IslandCompatContext;
};

/** 내 섬과 잘 맞는 섬 Top N(연애 점수 기준). */
export async function fetchBestMatches(code: string, limit = 3): Promise<IslandBestMatch[]> {
  if (!supabase || !hasSupabaseConfig() || !rpcClient) return [];
  const { data, error } = await rpcClient.rpc('island_best_matches', { p_code: code, p_limit: limit });
  if (error) throw error;
  return (data ?? []) as IslandBestMatch[];
}

/** 두 섬의 궁합(관계 사용설명서: 연애/친구/일별 점수 + 생활 문장). */
export async function fetchCompat(codeA: string, codeB: string): Promise<IslandCompat | null> {
  if (!supabase || !hasSupabaseConfig() || !rpcClient) return null;
  const { data, error } = await rpcClient.rpc('compute_island_compat', { p_code_a: codeA, p_code_b: codeB });
  if (error) throw error;
  return data ? (data as unknown as IslandCompat) : null;
}

/** 본인이 "친구가 본 나" 집계를 조회. 응답이 없으면 null. */
export async function fetchFriendsView(): Promise<FriendsIslandView | null> {
  if (!supabase || !hasSupabaseConfig() || !rpcClient) return null;
  const { data, error } = await rpcClient.rpc('get_friends_island_view', {});
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? (row as FriendsIslandView) : null;
}
