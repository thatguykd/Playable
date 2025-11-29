// TypeScript types for Supabase database schema
// These types are generated based on the database schema in supabase/migrations/001_initial_schema.sql

export type SubscriptionTier = 'free' | 'gamedev' | 'pro';
export type GameCategory = 'Arcade' | 'Puzzle' | 'Action' | 'Strategy' | 'Experimental';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';
export type TransactionType = 'purchase' | 'subscription_refill' | 'game_generation' | 'game_iteration' | 'refund';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar: string | null;
          tier: SubscriptionTier;
          credits: number;
          games_created: number;
          joined_at: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: SubscriptionStatus | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar?: string | null;
          tier?: SubscriptionTier;
          credits?: number;
          games_created?: number;
          joined_at?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: SubscriptionStatus | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar?: string | null;
          tier?: SubscriptionTier;
          credits?: number;
          games_created?: number;
          joined_at?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: SubscriptionStatus | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          title: string;
          description: string;
          author_id: string | null;
          author_name: string;
          html: string;
          thumbnail: string | null;
          category: GameCategory;
          plays: number;
          is_official: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          author_id?: string | null;
          author_name: string;
          html: string;
          thumbnail?: string | null;
          category?: GameCategory;
          plays?: number;
          is_official?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          author_id?: string | null;
          author_name?: string;
          html?: string;
          thumbnail?: string | null;
          category?: GameCategory;
          plays?: number;
          is_official?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      leaderboard: {
        Row: {
          id: string;
          game_id: string;
          player_name: string;
          score: number;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          player_name: string;
          score: number;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          player_name?: string;
          score?: number;
          user_id?: string | null;
          created_at?: string;
        };
      };
      saved_games: {
        Row: {
          user_id: string;
          game_id: string;
          saved_at: string;
        };
        Insert: {
          user_id: string;
          game_id: string;
          saved_at?: string;
        };
        Update: {
          user_id?: string;
          game_id?: string;
          saved_at?: string;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: TransactionType;
          description: string | null;
          stripe_payment_intent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: TransactionType;
          description?: string | null;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          type?: TransactionType;
          description?: string | null;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      increment_game_plays: {
        Args: { game_uuid: string };
        Returns: void;
      };
      deduct_user_credits: {
        Args: {
          user_uuid: string;
          credit_amount: number;
          transaction_type: TransactionType;
          transaction_description: string;
        };
        Returns: boolean;
      };
      add_user_credits: {
        Args: {
          user_uuid: string;
          credit_amount: number;
          transaction_type: TransactionType;
          transaction_description: string;
          payment_intent_id?: string;
        };
        Returns: void;
      };
    };
  };
}
