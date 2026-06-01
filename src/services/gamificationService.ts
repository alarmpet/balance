import { supabase } from './questionService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CharacterRow,
  IslandRow,
  ProfileRow,
  ShellLedgerRow,
  UserAvatarStateRow,
  UserTraitRow
} from '../types/database.types';

export type CareType = 'snack' | 'play' | 'praise';

const rpcClient = supabase as SupabaseClient | null;

export type GamificationSnapshot = {
  profile: Pick<
    ProfileRow,
    | 'id'
    | 'nickname'
    | 'avatar_url'
    | 'shell_balance'
    | 'streak_count'
    | 'total_participation_count'
    | 'today_participation_count'
  >;
  traits: Array<Pick<UserTraitRow, 'trait_key' | 'score'>>;
  avatarState: UserAvatarStateRow;
  latestLedger: ShellLedgerRow | null;
  island: {
    id: string;
    island_level: number;
    island_name: string;
    island_slug: string;
    image_url: string | null;
  };
  character: {
    id: string;
    character_type: string;
    character_level: number;
    nickname: string;
    image_url: string | null;
  };
};

export async function fetchGamificationSnapshot(): Promise<GamificationSnapshot> {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 설정이 필요합니다. 브라우저에서 인증 후 .env를 채워 주세요.');
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return createGuestSnapshot();
  }

  const [
    { data: profile },
    { data: traits },
    { data: avatarState },
    { data: latestLedger },
    { data: island },
    { data: character }
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_traits').select('trait_key,score').eq('user_id', userId),
    supabase.from('user_avatar_state').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('shell_ledger').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('islands').select('id,name,slug,description,image_url').eq('is_active', true).order('sort_order').limit(1).maybeSingle(),
    supabase.from('characters').select('id,name,slug,description,image_url,rarity').eq('is_active', true).order('sort_order').limit(1).maybeSingle()
  ]);

  const profileRecord = profile as ProfileRow | null;
  const traitRows = (traits ?? []) as Array<Pick<UserTraitRow, 'trait_key' | 'score'>>;
  const avatarRecord = (avatarState as UserAvatarStateRow | null) ?? createDefaultAvatarState(userId);
  const participationCount = profileRecord?.total_participation_count ?? 0;
  const islandRecord = island as Pick<IslandRow, 'id' | 'name' | 'slug' | 'description' | 'image_url'> | null;
  const characterRecord = character as Pick<CharacterRow, 'id' | 'name' | 'slug' | 'description' | 'image_url' | 'rarity'> | null;

  return {
    profile: {
      id: profileRecord?.id ?? userId,
      nickname: profileRecord?.nickname ?? '섬 탐험가',
      avatar_url: profileRecord?.avatar_url ?? null,
      shell_balance: profileRecord?.shell_balance ?? 0,
      streak_count: profileRecord?.streak_count ?? 0,
      total_participation_count: participationCount,
      today_participation_count: profileRecord?.today_participation_count ?? 0
    },
    traits: traitRows,
    avatarState: avatarRecord,
    latestLedger: (latestLedger as ShellLedgerRow | null) ?? null,
    island: islandRecord ? {
      id: islandRecord.id,
      island_level: getIslandLevel(participationCount),
      island_name: islandRecord.name,
      island_slug: islandRecord.slug,
      image_url: islandRecord.image_url
    } : {
      id: 'new-island',
      island_level: 1,
      island_name: '새싹 섬',
      island_slug: 'sprout-island',
      image_url: null
    },
    character: characterRecord ? {
      id: characterRecord.id,
      character_type: avatarRecord.evolution_stage || characterRecord.slug,
      character_level: avatarRecord.level || getCharacterLevel(participationCount),
      nickname: characterRecord.name,
      image_url: characterRecord.image_url
    } : {
      id: 'new-character',
      character_type: avatarRecord.evolution_stage,
      character_level: avatarRecord.level,
      nickname: '성향 알',
      image_url: null
    }
  };
}

export async function claimDailyCheckin(): Promise<ShellLedgerRow> {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 설정이 필요합니다.');
  }

  const { data, error } = await rpcClient!.rpc('claim_daily_checkin', {});
  if (error) throw error;
  if (!data) throw new Error('출석 보상 결과를 불러오지 못했습니다.');
  return data as ShellLedgerRow;
}

export async function careAvatar(careType: CareType): Promise<UserAvatarStateRow> {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 설정이 필요합니다.');
  }

  const { data, error } = await rpcClient!.rpc('care_avatar', {
    p_care_type: careType
  });

  if (error) throw error;
  if (!data) throw new Error('캐릭터 케어 결과를 불러오지 못했습니다.');
  return data as UserAvatarStateRow;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

function createGuestSnapshot(): GamificationSnapshot {
  return {
    profile: {
      id: 'guest',
      nickname: '게스트 탐험가',
      avatar_url: null,
      shell_balance: 0,
      streak_count: 0,
      total_participation_count: 0,
      today_participation_count: 0
    },
    traits: [],
    avatarState: createDefaultAvatarState('guest'),
    latestLedger: null,
    island: {
      id: 'guest-island',
      island_level: 1,
      island_name: '게스트 섬',
      island_slug: 'guest-island',
      image_url: null
    },
    character: {
      id: 'guest-character',
      character_type: 'egg',
      character_level: 1,
      nickname: '게스트 성향 알',
      image_url: null
    }
  };
}

function createDefaultAvatarState(userId: string): UserAvatarStateRow {
  return {
    user_id: userId,
    evolution_stage: 'egg',
    level: 1,
    experience: 0,
    mood: 80,
    energy: 80,
    bond: 0,
    hatch_progress: 0,
    updated_at: new Date().toISOString()
  };
}

function getIslandLevel(count: number) {
  if (count >= 300) return 4;
  if (count >= 100) return 3;
  if (count >= 50) return 2;
  return 1;
}

function getCharacterLevel(count: number) {
  if (count >= 300) return 5;
  if (count >= 100) return 4;
  if (count >= 50) return 3;
  if (count >= 10) return 2;
  return 1;
}
