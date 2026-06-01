export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

export type QuestionRow = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  tags: string[];
  option_a_title: string;
  option_a_description: string | null;
  option_a_image_url: string | null;
  option_b_title: string;
  option_b_description: string | null;
  option_b_image_url: string | null;
  vote_count_a: number;
  vote_count_b: number;
  total_votes: number;
  reaction_like_count: number;
  reaction_fun_count: number;
  reaction_hard_count: number;
  comment_count: number;
  heat_score: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type VoteRow = {
  id: string;
  user_id: string;
  question_id: string;
  selected_option: string;
  response_time_ms: number | null;
  created_at: string;
};

export type QuestionReactionRow = {
  id: string;
  user_id: string;
  question_id: string;
  reaction_type: string;
  created_at: string;
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
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: CategoryRow;
        Insert: Partial<CategoryRow>;
        Update: Partial<CategoryRow>;
      };
      questions: {
        Row: QuestionRow;
        Insert: Partial<QuestionRow>;
        Update: Partial<QuestionRow>;
      };
      votes: {
        Row: VoteRow;
        Insert: Partial<VoteRow>;
        Update: Partial<VoteRow>;
      };
      question_reactions: {
        Row: QuestionReactionRow;
        Insert: Partial<QuestionReactionRow>;
        Update: Partial<QuestionReactionRow>;
      };
      profiles: {
        Row: {
          id: string;
          nickname: string;
          avatar_url: string | null;
          shell_balance: number;
          streak_count: number;
          total_participation_count: number;
          today_participation_count: number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      user_traits: {
        Row: {
          trait_key: string;
          score: number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      islands: {
        Row: {
          id: string;
          user_id: string;
          island_level: number;
          island_name: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      characters: {
        Row: {
          id: string;
          user_id: string;
          character_type: string;
          character_level: number;
          nickname: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      fetch_feed_questions: {
        Args: {
          p_limit?: number;
          p_cursor_created_at?: string | null;
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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
