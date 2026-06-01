import { supabase } from './questionService';

type ProfileRecord = GamificationSnapshot['profile'];
type TraitRecord = GamificationSnapshot['traits'][number];

type MasterIslandRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
};

type MasterCharacterRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  rarity: string;
};

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

  const [{ data: profile }, { data: traits }, { data: island }, { data: character }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_traits').select('trait_key,score').eq('user_id', userId),
    supabase.from('islands').select('id,name,slug,description,image_url').eq('is_active', true).order('sort_order').limit(1).maybeSingle(),
    supabase.from('characters').select('id,name,slug,description,image_url,rarity').eq('is_active', true).order('sort_order').limit(1).maybeSingle()
  ]);

  const profileRecord = profile as ProfileRecord | null;
  const traitRows = (traits ?? []) as TraitRecord[];
  const participationCount = profileRecord?.total_participation_count ?? 0;
  const islandRecord = island as MasterIslandRecord | null;
  const characterRecord = character as MasterCharacterRecord | null;

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
      character_type: characterRecord.slug,
      character_level: getCharacterLevel(participationCount),
      nickname: characterRecord.name,
      image_url: characterRecord.image_url
    } : {
      id: 'new-character',
      character_type: 'egg',
      character_level: 1,
      nickname: '성향 알',
      image_url: null
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
