// AUTO-GENERATED from live Supabase schema (project ztcexgnelqtdzinfgoja) via Supabase MCP.
// 2026-06-04. Reference for syncing the hand-maintained database.types.ts — do NOT import directly yet.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_edge_rate_limit_events: {
        Row: {
          created_at: string
          function_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_edge_rate_limit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      characters: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string
          is_active: boolean
          island_id: string | null
          name: string
          rarity: string
          slug: string
          sort_order: number
          unlock_trait_key: string | null
          unlock_trait_score: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url: string
          is_active?: boolean
          island_id?: string | null
          name: string
          rarity?: string
          slug: string
          sort_order?: number
          unlock_trait_key?: string | null
          unlock_trait_score?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_active?: boolean
          island_id?: string | null
          name?: string
          rarity?: string
          slug?: string
          sort_order?: number
          unlock_trait_key?: string | null
          unlock_trait_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_island_id_fkey"
            columns: ["island_id"]
            isOneToOne: false
            referencedRelation: "islands"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          is_anonymous: boolean
          like_count: number
          parent_comment_id: string | null
          question_id: string
          report_count: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          like_count?: number
          parent_comment_id?: string | null
          question_id: string
          report_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          like_count?: number
          parent_comment_id?: string | null
          question_id?: string
          report_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_missions: {
        Row: {
          created_at: string
          description: string
          id: string
          mission_date: string
          mission_type: string
          reward_shells: number
          target_count: number
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          mission_date: string
          mission_type: string
          reward_shells?: number
          target_count?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          mission_date?: string
          mission_type?: string
          reward_shells?: number
          target_count?: number
          title?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      islands: {
        Row: {
          background_color: string
          category_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string
          is_active: boolean
          min_trait_score: number
          name: string
          required_trait_key: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          background_color?: string
          category_id?: string | null
          created_at?: string
          description: string
          id?: string
          image_url: string
          is_active?: boolean
          min_trait_score?: number
          name: string
          required_trait_key?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          background_color?: string
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_active?: boolean
          min_trait_score?: number
          name?: string
          required_trait_key?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "islands_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          comment_id: string | null
          created_at: string
          id: string
          is_read: boolean
          question_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          question_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          question_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_species: {
        Row: {
          base_rarity: string
          common_asset_url: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          legendary_asset_url: string | null
          rare_asset_url: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          base_rarity?: string
          common_asset_url: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          legendary_asset_url?: string | null
          rare_asset_url?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          base_rarity?: string
          common_asset_url?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          legendary_asset_url?: string | null
          rare_asset_url?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pet_species_traits: {
        Row: {
          affinity_score: number
          created_at: string
          id: string
          source_label: string | null
          source_url: string | null
          species_id: string
          trait_key: string
        }
        Insert: {
          affinity_score?: number
          created_at?: string
          id?: string
          source_label?: string | null
          source_url?: string | null
          species_id: string
          trait_key: string
        }
        Update: {
          affinity_score?: number
          created_at?: string
          id?: string
          source_label?: string | null
          source_url?: string | null
          species_id?: string
          trait_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_species_traits_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "pet_species"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          gender: string | null
          home_island_id: string | null
          id: string
          nickname: string
          selected_character_id: string | null
          shell_balance: number
          streak_count: number
          today_participation_count: number
          total_participation_count: number
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          gender?: string | null
          home_island_id?: string | null
          id: string
          nickname: string
          selected_character_id?: string | null
          shell_balance?: number
          streak_count?: number
          today_participation_count?: number
          total_participation_count?: number
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          gender?: string | null
          home_island_id?: string | null
          id?: string
          nickname?: string
          selected_character_id?: string | null
          shell_balance?: number
          streak_count?: number
          today_participation_count?: number
          total_participation_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_home_island"
            columns: ["home_island_id"]
            isOneToOne: false
            referencedRelation: "islands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_selected_character"
            columns: ["selected_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      question_reactions: {
        Row: {
          created_at: string
          id: string
          question_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_reactions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_traits: {
        Row: {
          created_at: string
          id: string
          option_side: string
          question_id: string
          trait_key: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          option_side: string
          question_id: string
          trait_key: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          option_side?: string
          question_id?: string
          trait_key?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_traits_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category_id: string | null
          comment_count: number
          controversy_score: number
          created_at: string
          creator_id: string | null
          description: string | null
          embedding: string | null
          fun_count: number
          hard_count: number
          heat_score: number
          id: string
          is_anonymous: boolean
          is_official: boolean
          like_count: number
          option_a_description: string | null
          option_a_image_url: string
          option_a_title: string
          option_a_votes: number
          option_b_description: string | null
          option_b_image_url: string
          option_b_title: string
          option_b_votes: number
          report_count: number
          reward_score: number
          status: string
          tags: string[]
          title: string
          total_votes: number
          updated_at: string
          visibility: string
        }
        Insert: {
          category_id?: string | null
          comment_count?: number
          controversy_score?: number
          created_at?: string
          creator_id?: string | null
          description?: string | null
          embedding?: string | null
          fun_count?: number
          hard_count?: number
          heat_score?: number
          id?: string
          is_anonymous?: boolean
          is_official?: boolean
          like_count?: number
          option_a_description?: string | null
          option_a_image_url: string
          option_a_title: string
          option_a_votes?: number
          option_b_description?: string | null
          option_b_image_url: string
          option_b_title: string
          option_b_votes?: number
          report_count?: number
          reward_score?: number
          status?: string
          tags?: string[]
          title: string
          total_votes?: number
          updated_at?: string
          visibility?: string
        }
        Update: {
          category_id?: string | null
          comment_count?: number
          controversy_score?: number
          created_at?: string
          creator_id?: string | null
          description?: string | null
          embedding?: string | null
          fun_count?: number
          hard_count?: number
          heat_score?: number
          id?: string
          is_anonymous?: boolean
          is_official?: boolean
          like_count?: number
          option_a_description?: string | null
          option_a_image_url?: string
          option_a_title?: string
          option_a_votes?: number
          option_b_description?: string | null
          option_b_image_url?: string
          option_b_title?: string
          option_b_votes?: number
          report_count?: number
          reward_score?: number
          status?: string
          tags?: string[]
          title?: string
          total_votes?: number
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shell_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          idempotency_key: string
          reason: string
          source_id: string | null
          source_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          idempotency_key: string
          reason: string
          source_id?: string | null
          source_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          idempotency_key?: string
          reason?: string
          source_id?: string | null
          source_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shell_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_draw_history: {
        Row: {
          cost_shells: number
          created_at: string
          draw_index: number
          id: string
          idempotency_key: string
          inventory_level_after: number
          pity_after: number
          pity_before: number
          pool_id: string | null
          rarity: string
          request_id: string
          theme_skin_id: string | null
          user_id: string
          was_duplicate: boolean
        }
        Insert: {
          cost_shells?: number
          created_at?: string
          draw_index: number
          id?: string
          idempotency_key: string
          inventory_level_after?: number
          pity_after?: number
          pity_before?: number
          pool_id?: string | null
          rarity: string
          request_id: string
          theme_skin_id?: string | null
          user_id: string
          was_duplicate?: boolean
        }
        Update: {
          cost_shells?: number
          created_at?: string
          draw_index?: number
          id?: string
          idempotency_key?: string
          inventory_level_after?: number
          pity_after?: number
          pity_before?: number
          pool_id?: string | null
          rarity?: string
          request_id?: string
          theme_skin_id?: string | null
          user_id?: string
          was_duplicate?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "theme_draw_history_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "theme_draw_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_draw_history_theme_skin_id_fkey"
            columns: ["theme_skin_id"]
            isOneToOne: false
            referencedRelation: "theme_skins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_draw_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_draw_pool_items: {
        Row: {
          is_guaranteed_candidate: boolean
          pool_id: string
          theme_skin_id: string
          weight: number
        }
        Insert: {
          is_guaranteed_candidate?: boolean
          pool_id: string
          theme_skin_id: string
          weight: number
        }
        Update: {
          is_guaranteed_candidate?: boolean
          pool_id?: string
          theme_skin_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "theme_draw_pool_items_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "theme_draw_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_draw_pool_items_theme_skin_id_fkey"
            columns: ["theme_skin_id"]
            isOneToOne: false
            referencedRelation: "theme_skins"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_draw_pools: {
        Row: {
          cost_shells: number
          created_at: string
          display_name: string
          draw_count: number
          ends_at: string | null
          guarantee_rule: Json
          id: string
          is_active: boolean
          slug: string
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          cost_shells?: number
          created_at?: string
          display_name: string
          draw_count?: number
          ends_at?: string | null
          guarantee_rule?: Json
          id?: string
          is_active?: boolean
          slug: string
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          cost_shells?: number
          created_at?: string
          display_name?: string
          draw_count?: number
          ends_at?: string | null
          guarantee_rule?: Json
          id?: string
          is_active?: boolean
          slug?: string
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      theme_probability_versions: {
        Row: {
          change_reason: string
          created_at: string
          effective_at: string
          guarantee_rule_snapshot: Json
          id: string
          pool_id: string
          version: number
          weight_snapshot: Json
        }
        Insert: {
          change_reason: string
          created_at?: string
          effective_at?: string
          guarantee_rule_snapshot?: Json
          id?: string
          pool_id: string
          version: number
          weight_snapshot: Json
        }
        Update: {
          change_reason?: string
          created_at?: string
          effective_at?: string
          guarantee_rule_snapshot?: Json
          id?: string
          pool_id?: string
          version?: number
          weight_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "theme_probability_versions_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "theme_draw_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_skins: {
        Row: {
          background_asset_url: string
          created_at: string
          display_name: string
          effect_key: string | null
          id: string
          is_active: boolean
          is_limited: boolean
          preview_asset_url: string | null
          rarity: string
          series_key: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          background_asset_url: string
          created_at?: string
          display_name: string
          effect_key?: string | null
          id?: string
          is_active?: boolean
          is_limited?: boolean
          preview_asset_url?: string | null
          rarity: string
          series_key?: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          background_asset_url?: string
          created_at?: string
          display_name?: string
          effect_key?: string | null
          id?: string
          is_active?: boolean
          is_limited?: boolean
          preview_asset_url?: string | null
          rarity?: string
          series_key?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_avatar_state: {
        Row: {
          bond: number
          energy: number
          evolution_stage: string
          experience: number
          hatch_progress: number
          level: number
          mood: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bond?: number
          energy?: number
          evolution_stage?: string
          experience?: number
          hatch_progress?: number
          level?: number
          mood?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bond?: number
          energy?: number
          evolution_stage?: string
          experience?: number
          hatch_progress?: number
          level?: number
          mood?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_avatar_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_characters: {
        Row: {
          character_id: string
          experience: number
          id: string
          is_selected: boolean
          level: number
          unlocked_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id: string
          experience?: number
          id?: string
          is_selected?: boolean
          level?: number
          unlocked_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          character_id?: string
          experience?: number
          id?: string
          is_selected?: boolean
          level?: number
          unlocked_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_insight_cards: {
        Row: {
          body: string
          category_slug: string | null
          confidence: number
          created_at: string
          evidence: Json
          id: string
          insight_key: string
          is_read: boolean
          primary_trait_key: string | null
          secondary_trait_key: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          category_slug?: string | null
          confidence?: number
          created_at?: string
          evidence?: Json
          id?: string
          insight_key: string
          is_read?: boolean
          primary_trait_key?: string | null
          secondary_trait_key?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category_slug?: string | null
          confidence?: number
          created_at?: string
          evidence?: Json
          id?: string
          insight_key?: string
          is_read?: boolean
          primary_trait_key?: string | null
          secondary_trait_key?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_insight_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mission_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          mission_id: string
          progress_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          mission_id: string
          progress_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          mission_id?: string
          progress_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "daily_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mission_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_personality_snapshots: {
        Row: {
          calm_express_score: number
          computed_at: string
          id: string
          plan_flow_score: number
          primary_trait_key: string | null
          safe_adventure_score: number
          secondary_trait_key: string | null
          solo_social_score: number
          type_code: string
          type_title: string
          user_id: string
        }
        Insert: {
          calm_express_score?: number
          computed_at?: string
          id?: string
          plan_flow_score?: number
          primary_trait_key?: string | null
          safe_adventure_score?: number
          secondary_trait_key?: string | null
          solo_social_score?: number
          type_code: string
          type_title: string
          user_id: string
        }
        Update: {
          calm_express_score?: number
          computed_at?: string
          id?: string
          plan_flow_score?: number
          primary_trait_key?: string | null
          safe_adventure_score?: number
          secondary_trait_key?: string | null
          solo_social_score?: number
          type_code?: string
          type_title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_personality_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pet_state: {
        Row: {
          assigned_at: string
          assigned_trait_snapshot: Json
          bond: number
          energy: number
          experience: number
          level: number
          mood: number
          nickname: string | null
          species_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_trait_snapshot?: Json
          bond?: number
          energy?: number
          experience?: number
          level?: number
          mood?: number
          nickname?: string | null
          species_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_trait_snapshot?: Json
          bond?: number
          energy?: number
          experience?: number
          level?: number
          mood?: number
          nickname?: string | null
          species_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pet_state_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "pet_species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pet_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_theme_inventory: {
        Row: {
          duplicate_count: number
          first_acquired_at: string
          is_equipped: boolean
          level: number
          theme_skin_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          duplicate_count?: number
          first_acquired_at?: string
          is_equipped?: boolean
          level?: number
          theme_skin_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          duplicate_count?: number
          first_acquired_at?: string
          is_equipped?: boolean
          level?: number
          theme_skin_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_theme_inventory_theme_skin_id_fkey"
            columns: ["theme_skin_id"]
            isOneToOne: false
            referencedRelation: "theme_skins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_theme_inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_theme_pity: {
        Row: {
          legendary_miss_count: number
          pool_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          legendary_miss_count?: number
          pool_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          legendary_miss_count?: number
          pool_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_theme_pity_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "theme_draw_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_theme_pity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_traits: {
        Row: {
          id: string
          score: number
          trait_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          score?: number
          trait_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          score?: number
          trait_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_traits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          question_id: string
          response_time_ms: number | null
          selected_option: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          response_time_ms?: number | null
          selected_option: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          response_time_ms?: number | null
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_shell_delta: {
        Args: {
          p_amount: number
          p_idempotency_key: string
          p_reason: string
          p_source_id: string
          p_source_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      assign_personality_pet: {
        Args: never
        Returns: {
          assigned_at: string
          assigned_trait_snapshot: Json
          bond: number
          energy: number
          experience: number
          level: number
          mood: number
          nickname: string | null
          species_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_pet_state"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      care_avatar: {
        Args: { p_care_type?: string; p_request_id?: string }
        Returns: {
          bond: number
          energy: number
          evolution_stage: string
          experience: number
          hatch_progress: number
          level: number
          mood: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_avatar_state"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_ai_rate_limit: {
        Args: {
          p_function_name: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: {
          allowed: boolean
          retry_after_seconds: number
        }[]
      }
      claim_daily_checkin: {
        Args: never
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          idempotency_key: string
          reason: string
          source_id: string | null
          source_type: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "shell_ledger"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_daily_theme_draw: {
        Args: { p_request_id?: string }
        Returns: {
          display_name: string
          draw_index: number
          inventory_level_after: number
          rarity: string
          slug: string
          theme_skin_id: string
          was_duplicate: boolean
        }[]
      }
      compute_user_trait_contradictions: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      draw_theme_pack: {
        Args: {
          p_draw_count?: number
          p_pool_slug?: string
          p_request_id?: string
        }
        Returns: {
          display_name: string
          draw_index: number
          inventory_level_after: number
          rarity: string
          slug: string
          theme_skin_id: string
          was_duplicate: boolean
        }[]
      }
      ensure_user_gamification_state: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      fetch_feed_questions: {
        Args: {
          p_cursor_created_at?: string
          p_limit?: number
          p_sort?: string
        }
        Returns: {
          category: Json
          category_id: string
          comment_count: number
          created_at: string
          description: string
          id: string
          option_a_description: string
          option_a_image_url: string
          option_a_title: string
          option_b_description: string
          option_b_image_url: string
          option_b_title: string
          reaction_fun_count: number
          reaction_hard_count: number
          reaction_like_count: number
          tags: string[]
          title: string
          user_reaction: string
          user_vote: string
          vote_count_a: number
          vote_count_b: number
        }[]
      }
      get_personality_insight_graph: {
        Args: { p_depth?: number; p_focus_node_id?: string }
        Returns: Json
      }
      get_theme_probability_disclosure: {
        Args: { p_pool_slug?: string }
        Returns: Json
      }
      mark_insight_card_read: {
        Args: { p_insight_id: string }
        Returns: {
          body: string
          category_slug: string | null
          confidence: number
          created_at: string
          evidence: Json
          id: string
          insight_key: string
          is_read: boolean
          primary_trait_key: string | null
          secondary_trait_key: string | null
          title: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_insight_cards"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      match_questions_by_embedding: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category_id: string
          id: string
          option_a_title: string
          option_b_title: string
          similarity: number
          title: string
        }[]
      }
      refresh_user_insight_cards: {
        Args: never
        Returns: {
          body: string
          category_slug: string | null
          confidence: number
          created_at: string
          evidence: Json
          id: string
          insight_key: string
          is_read: boolean
          primary_trait_key: string | null
          secondary_trait_key: string | null
          title: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "user_insight_cards"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_reaction: {
        Args: { p_question_id: string; p_reaction_type: string }
        Returns: {
          created_at: string
          id: string
          question_id: string
          reaction_type: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "question_reactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_vote: {
        Args: {
          p_question_id: string
          p_response_time_ms?: number
          p_selected_option: string
        }
        Returns: {
          created_at: string
          id: string
          question_id: string
          response_time_ms: number | null
          selected_option: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "votes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_profile_display: {
        Args: {
          p_age_range?: string
          p_avatar_url?: string
          p_bio?: string
          p_gender?: string
          p_home_island_id?: string
          p_nickname?: string
          p_selected_character_id?: string
        }
        Returns: {
          age_range: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          gender: string | null
          home_island_id: string | null
          id: string
          nickname: string
          selected_character_id: string | null
          shell_balance: number
          streak_count: number
          today_participation_count: number
          total_participation_count: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
