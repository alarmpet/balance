export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Gender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';
export type AgeRange = '10s' | '20s' | '30s' | '40s' | '50s_plus';
export type QuestionStatus = 'pending' | 'approved' | 'rejected' | 'archived';
export type QuestionVisibility = 'public' | 'followers' | 'private';
export type OptionSide = 'A' | 'B';
export type CharacterRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type QuestionReactionType = 'like' | 'fun' | 'hard';
export type CommentReactionType = 'like';
export type NotificationType = 'vote_milestone' | 'comment' | 'reaction' | 'follow' | 'mission' | 'system';
export type MissionType = 'vote' | 'comment' | 'reaction' | 'streak' | 'create_question';
export type CategorySlug = 'food' | 'life' | 'romance' | 'career' | 'culture';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          avatar_url: string | null;
          gender: Gender | null;
          age_range: AgeRange | null;
          bio: string | null;
          home_island_id: string | null;
          selected_character_id: string | null;
          streak_count: number;
          shell_balance: number;
          total_participation_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          avatar_url?: string | null;
          gender?: Gender | null;
          age_range?: AgeRange | null;
          bio?: string | null;
          home_island_id?: string | null;
          selected_character_id?: string | null;
          streak_count?: number;
          shell_balance?: number;
          total_participation_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          avatar_url?: string | null;
          gender?: Gender | null;
          age_range?: AgeRange | null;
          bio?: string | null;
          home_island_id?: string | null;
          selected_character_id?: string | null;
          streak_count?: number;
          shell_balance?: number;
          total_participation_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          emoji: string | null;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          emoji?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          emoji?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      islands: {
        Row: {
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
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description: string;
          image_url: string;
          background_color?: string;
          required_trait_key?: string | null;
          min_trait_score?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string;
          image_url?: string;
          background_color?: string;
          required_trait_key?: string | null;
          min_trait_score?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      characters: {
        Row: {
          id: string;
          island_id: string | null;
          name: string;
          slug: string;
          description: string;
          image_url: string;
          rarity: CharacterRarity;
          unlock_trait_key: string | null;
          unlock_trait_score: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          island_id?: string | null;
          name: string;
          slug: string;
          description: string;
          image_url: string;
          rarity?: CharacterRarity;
          unlock_trait_key?: string | null;
          unlock_trait_score?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          island_id?: string | null;
          name?: string;
          slug?: string;
          description?: string;
          image_url?: string;
          rarity?: CharacterRarity;
          unlock_trait_key?: string | null;
          unlock_trait_score?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_characters: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          level: number;
          experience: number;
          is_selected: boolean;
          unlocked_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_id: string;
          level?: number;
          experience?: number;
          is_selected?: boolean;
          unlocked_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          character_id?: string;
          level?: number;
          experience?: number;
          is_selected?: boolean;
          unlocked_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
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
          status: QuestionStatus;
          visibility: QuestionVisibility;
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
        Insert: {
          id?: string;
          creator_id?: string | null;
          title: string;
          description?: string | null;
          category_id?: string | null;
          tags?: string[];
          option_a_title: string;
          option_a_description?: string | null;
          option_a_image_url: string;
          option_b_title: string;
          option_b_description?: string | null;
          option_b_image_url: string;
          status?: QuestionStatus;
          visibility?: QuestionVisibility;
          is_official?: boolean;
          is_anonymous?: boolean;
          embedding?: string | null;
          total_votes?: number;
          option_a_votes?: number;
          option_b_votes?: number;
          like_count?: number;
          fun_count?: number;
          hard_count?: number;
          comment_count?: number;
          report_count?: number;
          heat_score?: number;
          controversy_score?: number;
          reward_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string | null;
          title?: string;
          description?: string | null;
          category_id?: string | null;
          tags?: string[];
          option_a_title?: string;
          option_a_description?: string | null;
          option_a_image_url?: string;
          option_b_title?: string;
          option_b_description?: string | null;
          option_b_image_url?: string;
          status?: QuestionStatus;
          visibility?: QuestionVisibility;
          is_official?: boolean;
          is_anonymous?: boolean;
          embedding?: string | null;
          total_votes?: number;
          option_a_votes?: number;
          option_b_votes?: number;
          like_count?: number;
          fun_count?: number;
          hard_count?: number;
          comment_count?: number;
          report_count?: number;
          heat_score?: number;
          controversy_score?: number;
          reward_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      question_traits: {
        Row: {
          id: string;
          question_id: string;
          option_side: OptionSide;
          trait_key: string;
          weight: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          option_side: OptionSide;
          trait_key: string;
          weight?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          option_side?: OptionSide;
          trait_key?: string;
          weight?: number;
          created_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          selected_option: OptionSide;
          response_time_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          selected_option: OptionSide;
          response_time_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          selected_option?: OptionSide;
          response_time_ms?: number | null;
          created_at?: string;
        };
      };
      user_traits: {
        Row: {
          id: string;
          user_id: string;
          trait_key: string;
          score: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trait_key: string;
          score?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          trait_key?: string;
          score?: number;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
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
        Insert: {
          id?: string;
          question_id: string;
          user_id?: string | null;
          parent_comment_id?: string | null;
          body: string;
          is_anonymous?: boolean;
          like_count?: number;
          report_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          user_id?: string | null;
          parent_comment_id?: string | null;
          body?: string;
          is_anonymous?: boolean;
          like_count?: number;
          report_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      question_reactions: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          reaction_type: QuestionReactionType;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          reaction_type: QuestionReactionType;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          reaction_type?: QuestionReactionType;
          created_at?: string;
        };
      };
      comment_reactions: {
        Row: {
          id: string;
          user_id: string;
          comment_id: string;
          reaction_type: CommentReactionType;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          comment_id: string;
          reaction_type?: CommentReactionType;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          comment_id?: string;
          reaction_type?: CommentReactionType;
          created_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string | null;
          question_id: string | null;
          comment_id: string | null;
          type: NotificationType;
          title: string;
          body: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id?: string | null;
          question_id?: string | null;
          comment_id?: string | null;
          type: NotificationType;
          title: string;
          body?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          actor_id?: string | null;
          question_id?: string | null;
          comment_id?: string | null;
          type?: NotificationType;
          title?: string;
          body?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      daily_missions: {
        Row: {
          id: string;
          mission_date: string;
          title: string;
          description: string;
          mission_type: MissionType;
          target_count: number;
          reward_shells: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          mission_date: string;
          title: string;
          description: string;
          mission_type: MissionType;
          target_count?: number;
          reward_shells?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          mission_date?: string;
          title?: string;
          description?: string;
          mission_type?: MissionType;
          target_count?: number;
          reward_shells?: number;
          created_at?: string;
        };
      };
      user_mission_progress: {
        Row: {
          id: string;
          user_id: string;
          mission_id: string;
          progress_count: number;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mission_id: string;
          progress_count?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mission_id?: string;
          progress_count?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      handle_vote_effects_procedure: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      match_questions_by_embedding: {
        Args: {
          query_embedding: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: Array<{
          id: string;
          title: string;
          option_a_title: string;
          option_b_title: string;
          category_id: string | null;
          similarity: number;
        }>;
      };
      set_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

export type Profile = Tables<'profiles'>;
export type Category = Tables<'categories'>;
export type Island = Tables<'islands'>;
export type Character = Tables<'characters'>;
export type UserCharacter = Tables<'user_characters'>;
export type Question = Tables<'questions'>;
export type QuestionTrait = Tables<'question_traits'>;
export type Vote = Tables<'votes'>;
export type UserTrait = Tables<'user_traits'>;
export type Comment = Tables<'comments'>;
export type QuestionReaction = Tables<'question_reactions'>;
export type CommentReaction = Tables<'comment_reactions'>;
export type Bookmark = Tables<'bookmarks'>;
export type Follow = Tables<'follows'>;
export type Notification = Tables<'notifications'>;
export type DailyMission = Tables<'daily_missions'>;
export type UserMissionProgress = Tables<'user_mission_progress'>;

export interface AIRefineResult {
  title: string;
  description: string;
  tags: string[];
  option_a_title: string;
  option_a_description: string;
  option_a_image_url?: string;
  option_b_title: string;
  option_b_description: string;
  option_b_image_url?: string;
  category_slug: CategorySlug;
  trait_mapping: Array<{
    option_side: OptionSide;
    trait_key: string;
    weight: number;
  }>;
  traits: Array<{
    option_side: OptionSide;
    trait_key: string;
    weight: number;
  }>;
}
