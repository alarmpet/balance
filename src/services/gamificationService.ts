import type { Profile, UserTrait } from '../types/database.types';
import { supabase } from './questionService';

export interface GamificationSnapshot {
  userId: string | null;
  profile: Profile | null;
  traits: UserTrait[];
  todayParticipationCount: number;
  isGuest: boolean;
}

export const DAILY_PARTICIPATION_TARGET = 10;

const createGuestProfile = (): Profile => ({
  id: 'guest',
  nickname: '게스트 탐험가',
  avatar_url: null,
  gender: null,
  age_range: null,
  bio: null,
  home_island_id: null,
  selected_character_id: null,
  streak_count: 0,
  shell_balance: 0,
  total_participation_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const getCurrentUserId = async () => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user?.id ?? null;
};

export const fetchGamificationSnapshot = async (): Promise<GamificationSnapshot> => {
  const userId = await getCurrentUserId();

  if (!supabase || !userId) {
    return {
      userId: null,
      profile: createGuestProfile(),
      traits: [],
      todayParticipationCount: 0,
      isGuest: true,
    };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [profileResult, traitsResult, votesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_traits').select('*').eq('user_id', userId).order('score', { ascending: false }),
    supabase
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString()),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (traitsResult.error) {
    throw traitsResult.error;
  }

  if (votesResult.error) {
    throw votesResult.error;
  }

  return {
    userId,
    profile: profileResult.data ?? createGuestProfile(),
    traits: traitsResult.data ?? [],
    todayParticipationCount: votesResult.count ?? 0,
    isGuest: false,
  };
};

export const signOut = async () => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};
