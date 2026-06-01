import { supabase } from './questionService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PostgrestError } from '@supabase/supabase-js';
import type {
  CharacterRow,
  IslandRow,
  PetSpeciesRow,
  ProfileRow,
  ShellLedgerRow,
  ThemeDrawResultRow,
  ThemeSkinRow,
  UserPetStateRow,
  UserAvatarStateRow,
  UserThemeInventoryRow,
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
  petState: UserPetStateRow | null;
  petSpecies: PetSpeciesRow | null;
  equippedTheme: {
    inventory: UserThemeInventoryRow;
    skin: ThemeSkinRow;
  } | null;
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

  const [profileResult, traitsResult, avatarStateResult, petStateResult, latestLedgerResult, equippedThemeResult, islandResult, characterResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_traits').select('trait_key,score').eq('user_id', userId),
    supabase.from('user_avatar_state').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('user_pet_state').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('shell_ledger').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase
      .from('user_theme_inventory')
      .select('*, theme_skins(*)')
      .eq('user_id', userId)
      .eq('is_equipped', true)
      .limit(1)
      .maybeSingle(),
    supabase.from('islands').select('id,name,slug,description,image_url').eq('is_active', true).order('sort_order').limit(1).maybeSingle(),
    supabase.from('characters').select('id,name,slug,description,image_url,rarity').eq('is_active', true).order('sort_order').limit(1).maybeSingle()
  ]);

  throwIfPostgrestError(profileResult.error, '프로필');
  throwIfPostgrestError(traitsResult.error, '성향');
  throwIfPostgrestError(avatarStateResult.error, '아바타');
  throwIfOptionalFeatureError(petStateResult.error, '성향 펫');
  throwIfPostgrestError(latestLedgerResult.error, '조개 원장');
  throwIfOptionalFeatureError(equippedThemeResult.error, '장착 테마');
  throwIfPostgrestError(islandResult.error, '섬');
  throwIfPostgrestError(characterResult.error, '캐릭터');

  const profileRecord = profileResult.data as ProfileRow | null;
  const traitRows = (traitsResult.data ?? []) as Array<Pick<UserTraitRow, 'trait_key' | 'score'>>;
  const avatarRecord = (avatarStateResult.data as UserAvatarStateRow | null) ?? createDefaultAvatarState(userId);
  const petRecord = petStateResult.error ? null : ((petStateResult.data as UserPetStateRow | null) ?? null);
  const petSpeciesRecord = petRecord?.species_id ? await fetchPetSpecies(petRecord.species_id) : null;
  const equippedThemeRecord = equippedThemeResult.error ? null : normalizeEquippedTheme(equippedThemeResult.data);
  const participationCount = profileRecord?.total_participation_count ?? 0;
  const islandRecord = islandResult.data as Pick<IslandRow, 'id' | 'name' | 'slug' | 'description' | 'image_url'> | null;
  const characterRecord = characterResult.data as Pick<CharacterRow, 'id' | 'name' | 'slug' | 'description' | 'image_url' | 'rarity'> | null;

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
    petState: petRecord,
    petSpecies: petSpeciesRecord,
    equippedTheme: equippedThemeRecord,
    latestLedger: (latestLedgerResult.data as ShellLedgerRow | null) ?? null,
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
    p_care_type: careType,
    p_request_id: careType === 'praise' ? null : createRequestId()
  });

  if (error) throw error;
  if (!data) throw new Error('캐릭터 케어 결과를 불러오지 못했습니다.');
  return data as UserAvatarStateRow;
}

export async function assignPersonalityPet(): Promise<UserPetStateRow> {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 설정이 필요합니다.');
  }

  const { data, error } = await rpcClient!.rpc('assign_personality_pet', {});
  if (error) throw error;
  if (!data) throw new Error('성향 펫 배정 결과를 불러오지 못했습니다.');
  return data as UserPetStateRow;
}

export async function claimDailyThemeDraw(): Promise<ThemeDrawResultRow[]> {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 설정이 필요합니다.');
  }

  const { data, error } = await rpcClient!.rpc('claim_daily_theme_draw', {
    p_request_id: null
  });

  if (error) throw error;
  return (data ?? []) as ThemeDrawResultRow[];
}

export async function drawThemePack(poolSlug = 'standard-theme', drawCount = 1): Promise<ThemeDrawResultRow[]> {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 설정이 필요합니다.');
  }

  const { data, error } = await rpcClient!.rpc('draw_theme_pack', {
    p_pool_slug: poolSlug,
    p_draw_count: drawCount,
    p_request_id: createRequestId()
  });

  if (error) throw error;
  return (data ?? []) as ThemeDrawResultRow[];
}

export async function fetchThemeProbabilityDisclosure(poolSlug = 'standard-theme') {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 설정이 필요합니다.');
  }

  const { data, error } = await rpcClient!.rpc('get_theme_probability_disclosure', {
    p_pool_slug: poolSlug
  });

  if (error) throw error;
  return data;
}

export async function updateProfileDisplay(input: {
  nickname?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  gender?: string | null;
  ageRange?: string | null;
  homeIslandId?: string | null;
  selectedCharacterId?: string | null;
}): Promise<ProfileRow> {
  if (!supabase) {
    throw new Error('Supabase 프로젝트 설정이 필요합니다.');
  }

  const { data, error } = await rpcClient!.rpc('update_profile_display', {
    p_nickname: input.nickname ?? null,
    p_avatar_url: input.avatarUrl ?? null,
    p_bio: input.bio ?? null,
    p_gender: input.gender ?? null,
    p_age_range: input.ageRange ?? null,
    p_home_island_id: input.homeIslandId ?? null,
    p_selected_character_id: input.selectedCharacterId ?? null
  });

  if (error) throw error;
  if (!data) throw new Error('프로필을 수정하지 못했습니다.');
  return data as ProfileRow;
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
    petState: null,
    petSpecies: null,
    equippedTheme: null,
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

async function fetchPetSpecies(speciesId: string): Promise<PetSpeciesRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('pet_species')
    .select('*')
    .eq('id', speciesId)
    .maybeSingle();

  throwIfPostgrestError(error, '펫 종');
  return (data as PetSpeciesRow | null) ?? null;
}

function normalizeEquippedTheme(data: unknown): GamificationSnapshot['equippedTheme'] {
  if (!data || typeof data !== 'object') return null;

  const record = data as UserThemeInventoryRow & { theme_skins?: ThemeSkinRow | null };
  if (!record.theme_skins) return null;

  return {
    inventory: {
      user_id: record.user_id,
      theme_skin_id: record.theme_skin_id,
      level: record.level,
      duplicate_count: record.duplicate_count,
      is_equipped: record.is_equipped,
      first_acquired_at: record.first_acquired_at,
      updated_at: record.updated_at
    },
    skin: record.theme_skins
  };
}

function createRequestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (value) => {
    const random = Math.floor(Math.random() * 16);
    const next = value === 'x' ? random : (random & 0x3) | 0x8;
    return next.toString(16);
  });
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

function throwIfPostgrestError(error: PostgrestError | null, label: string) {
  if (error) {
    throw new Error(`${label} 정보를 불러오지 못했습니다: ${error.message}`);
  }
}

function throwIfOptionalFeatureError(error: PostgrestError | null, label: string) {
  if (!error) return;
  if (error.code === '42P01' || error.code === 'PGRST205') return;
  throw new Error(`${label} 정보를 불러오지 못했습니다: ${error.message}`);
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
