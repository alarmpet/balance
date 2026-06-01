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
    };
    Functions: {
      fetch_feed_questions: {
        Args: {
          p_limit?: number;
          p_cursor_created_at?: string | null;
          p_sort?: 'popular' | 'latest' | 'trending';
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
      claim_daily_checkin: {
        Args: Record<string, never>;
        Returns: ShellLedgerRow;
      };
      care_avatar: {
        Args: {
          p_care_type?: 'snack' | 'play' | 'praise';
        };
        Returns: UserAvatarStateRow;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
