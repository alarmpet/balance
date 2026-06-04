export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  gender: string | null;
  age_range: string | null;
  bio: string | null;
  home_island_id: string | null;
  selected_character_id: string | null;
  streak_count: number;
  shell_balance: number;
  total_participation_count: number;
  today_participation_count: number;
  created_at: string;
  updated_at: string;
};

export type IslandRow = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  background_color: string;
  required_trait_key: string | null;
  min_trait_score: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CharacterRow = {
  id: string;
  island_id: string | null;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  rarity: string;
  unlock_trait_key: string | null;
  unlock_trait_score: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserCharacterRow = {
  id: string;
  user_id: string;
  character_id: string;
  level: number;
  experience: number;
  is_selected: boolean;
  unlocked_at: string;
  updated_at: string;
};

export type QuestionRow = {
  id: string;
  creator_id: string | null;
  title: string;
  description: string | null;
  category_id: string | null;
  tags: string[];
  option_a_title: string;
  option_a_description: string | null;
  option_a_image_url: string;
  option_b_title: string;
  option_b_description: string | null;
  option_b_image_url: string;
  status: string;
  visibility: string;
  is_official: boolean;
  is_anonymous: boolean;
  embedding: string | null;
  total_votes: number;
  option_a_votes: number;
  option_b_votes: number;
  like_count: number;
  fun_count: number;
  hard_count: number;
  comment_count: number;
  report_count: number;
  heat_score: number;
  controversy_score: number;
  reward_score: number;
  created_at: string;
  updated_at: string;
};

export type QuestionTraitRow = {
  id: string;
  question_id: string;
  option_side: string;
  trait_key: string;
  weight: number;
  created_at: string;
};

export type VoteRow = {
  id: string;
  user_id: string;
  question_id: string;
  selected_option: string;
  response_time_ms: number | null;
  created_at: string;
};

export type UserTraitRow = {
  id: string;
  user_id: string;
  trait_key: string;
  score: number;
  updated_at: string;
};

export type CommentRow = {
  id: string;
  question_id: string;
  user_id: string | null;
  parent_comment_id: string | null;
  body: string;
  is_anonymous: boolean;
  like_count: number;
  report_count: number;
  created_at: string;
  updated_at: string;
};

export type QuestionReactionRow = {
  id: string;
  user_id: string;
  question_id: string;
  reaction_type: string;
  created_at: string;
};

export type CommentReactionRow = {
  id: string;
  user_id: string;
  comment_id: string;
  reaction_type: string;
  created_at: string;
};

export type BookmarkRow = {
  id: string;
  user_id: string;
  question_id: string;
  created_at: string;
};

export type FollowRow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  question_id: string | null;
  comment_id: string | null;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

export type DailyMissionRow = {
  id: string;
  mission_date: string;
  title: string;
  description: string;
  mission_type: string;
  target_count: number;
  reward_shells: number;
  created_at: string;
};

export type UserMissionProgressRow = {
  id: string;
  user_id: string;
  mission_id: string;
  progress_count: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ShellLedgerRow = {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  reason: string;
  source_type: string | null;
  source_id: string | null;
  idempotency_key: string;
  created_at: string;
};

export type UserAvatarStateRow = {
  user_id: string;
  evolution_stage: string;
  level: number;
  experience: number;
  mood: number;
  energy: number;
  bond: number;
  hatch_progress: number;
  updated_at: string;
};

export type UserPersonalitySnapshotRow = {
  id: string;
  user_id: string;
  type_code: string;
  type_title: string;
  solo_social_score: number;
  safe_adventure_score: number;
  plan_flow_score: number;
  calm_express_score: number;
  primary_trait_key: string | null;
  secondary_trait_key: string | null;
  computed_at: string;
};

export type PetSpeciesRow = {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  base_rarity: string;
  common_asset_url: string;
  rare_asset_url: string | null;
  legendary_asset_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PetSpeciesTraitRow = {
  id: string;
  species_id: string;
  trait_key: string;
  affinity_score: number;
  source_label: string | null;
  source_url: string | null;
  created_at: string;
};

export type UserPetStateRow = {
  user_id: string;
  species_id: string | null;
  nickname: string | null;
  level: number;
  experience: number;
  bond: number;
  mood: number;
  energy: number;
  assigned_trait_snapshot: Json;
  assigned_at: string;
  updated_at: string;
};

export type ThemeSkinRow = {
  id: string;
  slug: string;
  display_name: string;
  rarity: 'common' | 'rare' | 'legendary';
  background_asset_url: string;
  preview_asset_url: string | null;
  effect_key: string | null;
  series_key: string;
  is_limited: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ThemeDrawPoolRow = {
  id: string;
  slug: string;
  display_name: string;
  cost_shells: number;
  draw_count: number;
  guarantee_rule: Json;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ThemeDrawPoolItemRow = {
  pool_id: string;
  theme_skin_id: string;
  weight: number;
  is_guaranteed_candidate: boolean;
};

export type UserThemeInventoryRow = {
  user_id: string;
  theme_skin_id: string;
  level: number;
  duplicate_count: number;
  is_equipped: boolean;
  first_acquired_at: string;
  updated_at: string;
};

export type ThemeDrawHistoryRow = {
  id: string;
  user_id: string;
  pool_id: string | null;
  theme_skin_id: string | null;
  rarity: string;
  cost_shells: number;
  idempotency_key: string;
  request_id: string;
  draw_index: number;
  was_duplicate: boolean;
  inventory_level_after: number;
  pity_before: number;
  pity_after: number;
  created_at: string;
};

export type UserThemePityRow = {
  user_id: string;
  pool_id: string;
  legendary_miss_count: number;
  updated_at: string;
};

export type ThemeProbabilityVersionRow = {
  id: string;
  pool_id: string;
  version: number;
  weight_snapshot: Json;
  guarantee_rule_snapshot: Json;
  change_reason: string;
  effective_at: string;
  created_at: string;
};

export type ThemeDrawResultRow = {
  draw_index: number;
  theme_skin_id: string;
  slug: string;
  display_name: string;
  rarity: 'common' | 'rare' | 'legendary';
  was_duplicate: boolean;
  inventory_level_after: number;
};

export type UserInsightCardRow = {
  id: string;
  user_id: string;
  insight_key: string;
  title: string;
  body: string;
  primary_trait_key: string | null;
  secondary_trait_key: string | null;
  category_slug: string | null;
  confidence: number;
  evidence: Json;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export type InsightGraphNodeKind = 'pet' | 'trait' | 'category' | 'question' | 'choice' | 'theme' | 'insight';

export type InsightGraphEdgeKind =
  | 'trait_score'
  | 'category_affinity'
  | 'question_evidence'
  | 'choice_to_trait'
  | 'pet_affinity'
  | 'theme_match'
  | 'balance'
  | 'recent_change';

export type InsightGraphNode = {
  id: string;
  kind: InsightGraphNodeKind;
  label: string;
  size: number;
  color: string;
  score: number;
  meta: Record<string, Json | undefined>;
};

export type InsightGraphEdge = {
  id: string;
  source: string;
  target: string;
  kind: InsightGraphEdgeKind;
  weight: number;
  label: string | null;
};

// 모순 발견(상황별 다른 나): 같은 성향 축이 카테고리별로 다르게 나타나는 경우를
// 긍정적으로 표현한다. 카테고리별 BIPI 분리 계산 결과(서버 RPC)에서 채워진다.
export type InsightContradiction = {
  id: string;
  trait_label: string; // 예: "표현"
  high_category: string; // 높게 나타난 카테고리 표시명 (예: "연애")
  high_percent: number; // 0-100
  low_category: string; // 낮게 나타난 카테고리 표시명 (예: "커리어")
  low_percent: number; // 0-100
  message: string; // 비진단·긍정 프레이밍 문구
};

export type InsightGraphSnapshot = {
  nodes: InsightGraphNode[];
  edges: InsightGraphEdge[];
  summary: {
    title: string;
    body: string;
    completion: number;
  };
  meta: {
    focus_node_id: string | null;
    depth: number;
    node_limit: number;
    window_days: number;
  };
  // 서버가 아직 제공하지 않으면 빈 배열(클라이언트는 비어 있어도 안전).
  contradictions: InsightContradiction[];
};

export type FeedQuestionRpcRow = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  category: Json | null;
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
  user_vote: string | null;
  user_reaction: string | null;
  created_at: string;
};

type TableDefinition<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<ProfileRow>;
      categories: TableDefinition<CategoryRow>;
      islands: TableDefinition<IslandRow>;
      characters: TableDefinition<CharacterRow>;
      user_characters: TableDefinition<UserCharacterRow>;
      questions: TableDefinition<QuestionRow>;
      question_traits: TableDefinition<QuestionTraitRow>;
      votes: TableDefinition<VoteRow>;
      user_traits: TableDefinition<UserTraitRow>;
      comments: TableDefinition<CommentRow>;
      question_reactions: TableDefinition<QuestionReactionRow>;
      comment_reactions: TableDefinition<CommentReactionRow>;
      bookmarks: TableDefinition<BookmarkRow>;
      follows: TableDefinition<FollowRow>;
      notifications: TableDefinition<NotificationRow>;
      daily_missions: TableDefinition<DailyMissionRow>;
      user_mission_progress: TableDefinition<UserMissionProgressRow>;
      shell_ledger: TableDefinition<ShellLedgerRow>;
      user_avatar_state: TableDefinition<UserAvatarStateRow>;
      user_personality_snapshots: TableDefinition<UserPersonalitySnapshotRow>;
      pet_species: TableDefinition<PetSpeciesRow>;
      pet_species_traits: TableDefinition<PetSpeciesTraitRow>;
      user_pet_state: TableDefinition<UserPetStateRow>;
      theme_skins: TableDefinition<ThemeSkinRow>;
      theme_draw_pools: TableDefinition<ThemeDrawPoolRow>;
      theme_draw_pool_items: TableDefinition<ThemeDrawPoolItemRow>;
      user_theme_inventory: TableDefinition<UserThemeInventoryRow>;
      theme_draw_history: TableDefinition<ThemeDrawHistoryRow>;
      user_theme_pity: TableDefinition<UserThemePityRow>;
      theme_probability_versions: TableDefinition<ThemeProbabilityVersionRow>;
      user_insight_cards: TableDefinition<UserInsightCardRow>;
    };
    Functions: {
      fetch_feed_questions: {
        Args: {
          p_limit?: number;
          p_cursor_created_at?: string | null;
          p_sort?: 'popular' | 'latest' | 'trending';
          p_exclude_answered?: boolean;
        };
        Returns: FeedQuestionRpcRow[];
      };
      submit_vote: {
        Args: {
          p_question_id: string;
          p_selected_option: string;
          p_response_time_ms?: number | null;
        };
        Returns: VoteRow;
      };
      submit_reaction: {
        Args: {
          p_question_id: string;
          p_reaction_type: string;
        };
        Returns: QuestionReactionRow;
      };
      submit_user_question: {
        Args: {
          p_title: string;
          p_option_a_title: string;
          p_option_b_title: string;
          p_category_slug?: string;
          p_description?: string | null;
          p_is_anonymous?: boolean;
        };
        Returns: QuestionRow;
      };
      claim_daily_checkin: {
        Args: Record<string, never>;
        Returns: ShellLedgerRow;
      };
      care_avatar: {
        Args: {
          p_care_type?: 'snack' | 'play' | 'praise';
          p_request_id?: string | null;
        };
        Returns: UserAvatarStateRow;
      };
      update_profile_display: {
        Args: {
          p_nickname?: string | null;
          p_avatar_url?: string | null;
          p_bio?: string | null;
          p_gender?: string | null;
          p_age_range?: string | null;
          p_home_island_id?: string | null;
          p_selected_character_id?: string | null;
        };
        Returns: ProfileRow;
      };
      assign_personality_pet: {
        Args: Record<string, never>;
        Returns: UserPetStateRow;
      };
      get_theme_probability_disclosure: {
        Args: {
          p_pool_slug?: string;
        };
        Returns: Json;
      };
      draw_theme_pack: {
        Args: {
          p_pool_slug?: string;
          p_draw_count?: number;
          p_request_id?: string | null;
        };
        Returns: ThemeDrawResultRow[];
      };
      claim_daily_theme_draw: {
        Args: {
          p_request_id?: string | null;
        };
        Returns: ThemeDrawResultRow[];
      };
      get_personality_insight_graph: {
        Args: {
          p_focus_node_id?: string | null;
          p_depth?: number;
        };
        Returns: Json;
      };
      refresh_user_insight_cards: {
        Args: Record<string, never>;
        Returns: UserInsightCardRow[];
      };
      mark_insight_card_read: {
        Args: {
          p_insight_id: string;
        };
        Returns: UserInsightCardRow;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
