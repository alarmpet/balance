import { supabase } from './questionService';

type ProfileRecord = GamificationSnapshot['profile'];
type IslandRecord = GamificationSnapshot['island'];
type CharacterRecord = GamificationSnapshot['character'];
type TraitRecord = GamificationSnapshot['traits'][number];

export type GamificationSnapshot = {
  profile: {
    id: string;
    nickname: string;
    avatar_url: string | null;
    shell_balance: number;
    streak_count: number;
    total_participation_count: number;
    today_participation_count: number;
  };
  traits: Array<{ trait_key: string; score: number }>;
  island: {
    id: string;
    user_id: string;
    island_level: number;
    island_name: string;
  };
  character: {
    id: string;
    user_id: string;
    character_type: string;
    character_level: number;
    nickname: string;
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

  const [{ data: profile }, { data: traits }, { data: island }, { data: character }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_traits').select('trait_key,score').eq('user_id', userId),
    supabase.from('islands').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('characters').select('*').eq('user_id', userId).maybeSingle()
  ]);

  const profileRecord = profile as ProfileRecord | null;
  const traitRows = (traits ?? []) as TraitRecord[];
  const islandRecord = island as IslandRecord | null;
  const characterRecord = character as CharacterRecord | null;

  return {
    profile: {
      id: profileRecord?.id ?? userId,
      nickname: profileRecord?.nickname ?? '섬 탐험가',
      avatar_url: profileRecord?.avatar_url ?? null,
      shell_balance: profileRecord?.shell_balance ?? 0,
      streak_count: profileRecord?.streak_count ?? 0,
      total_participation_count: profileRecord?.total_participation_count ?? 0,
      today_participation_count: profileRecord?.today_participation_count ?? 0
    },
    traits: traitRows,
    island: islandRecord ?? {
      id: 'new-island',
      user_id: userId,
      island_level: 1,
      island_name: '새싹 섬'
    },
    character: characterRecord ?? {
      id: 'new-character',
      user_id: userId,
      character_type: 'turtle',
      character_level: 1,
      nickname: '새싹 탐험가'
    }
  };
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
    island: {
      id: 'guest-island',
      user_id: 'guest',
      island_level: 1,
      island_name: '게스트 섬'
    },
    character: {
      id: 'guest-character',
      user_id: 'guest',
      character_type: 'turtle',
      character_level: 1,
      nickname: '게스트 탐험가'
    }
  };
}
