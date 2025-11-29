-- Playable Database Schema Migration
-- This schema supports the AI game engine with user management, game publishing, leaderboards, and payments

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'gamedev', 'pro')),
  credits INTEGER NOT NULL DEFAULT 50,
  games_created INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', NULL)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Extended user profiles with subscription and credit information';
COMMENT ON COLUMN public.users.tier IS 'Subscription tier: free (1 game, 50 credits), gamedev ($9/mo, 2500 credits), pro ($29/mo, 15000 credits)';
COMMENT ON COLUMN public.users.credits IS 'Available credits for game generation (new game = 50, iteration = 10)';

-- =====================================================
-- GAMES TABLE
-- =====================================================
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  html TEXT NOT NULL,
  thumbnail TEXT,
  category TEXT NOT NULL DEFAULT 'Arcade' CHECK (category IN ('Arcade', 'Puzzle', 'Action', 'Strategy', 'Experimental')),
  plays INTEGER NOT NULL DEFAULT 0,
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.games IS 'Published games available in the feed';
COMMENT ON COLUMN public.games.html IS 'Complete HTML5 game code (single file with embedded CSS/JS)';
COMMENT ON COLUMN public.games.plays IS 'Total number of times this game has been played';
COMMENT ON COLUMN public.games.is_official IS 'Whether this is an officially featured game';

-- =====================================================
-- LEADERBOARD TABLE
-- =====================================================
CREATE TABLE public.leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.leaderboard IS 'High scores for each game';
COMMENT ON COLUMN public.leaderboard.user_id IS 'Optional link to authenticated user (can be null for anonymous players)';

-- =====================================================
-- SAVED GAMES (Junction Table)
-- =====================================================
CREATE TABLE public.saved_games (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, game_id)
);

COMMENT ON TABLE public.saved_games IS 'User library - games saved/bookmarked by users';

-- =====================================================
-- CREDIT TRANSACTIONS (Audit Log)
-- =====================================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'subscription_refill', 'game_generation', 'game_iteration', 'refund')),
  description TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.credit_transactions IS 'Audit log of all credit changes';
COMMENT ON COLUMN public.credit_transactions.amount IS 'Credit change amount (positive = added, negative = deducted)';

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_games_author ON public.games(author_id);
CREATE INDEX idx_games_created_at ON public.games(created_at DESC);
CREATE INDEX idx_games_plays ON public.games(plays DESC);
CREATE INDEX idx_games_category ON public.games(category);
CREATE INDEX idx_leaderboard_game_score ON public.leaderboard(game_id, score DESC);
CREATE INDEX idx_leaderboard_created_at ON public.leaderboard(created_at DESC);
CREATE INDEX idx_saved_games_user ON public.saved_games(user_id);
CREATE INDEX idx_saved_games_game ON public.saved_games(game_id);
CREATE INDEX idx_credit_transactions_user_time ON public.credit_transactions(user_id, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users: Can read own profile, update own profile
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Games: Anyone can read, only owner can insert/update
CREATE POLICY "Anyone can read games"
  ON public.games FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authors can insert games"
  ON public.games FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own games"
  ON public.games FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- Leaderboard: Anyone can read, authenticated can insert
CREATE POLICY "Anyone can read leaderboard"
  ON public.leaderboard FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated can insert scores"
  ON public.leaderboard FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Saved Games: Users can only manage their own saved games
CREATE POLICY "Users can read own saved games"
  ON public.saved_games FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save games"
  ON public.saved_games FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave games"
  ON public.saved_games FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Credit Transactions: Users can only read own transactions
CREATE POLICY "Users can read own transactions"
  ON public.credit_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for games table
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to increment game plays atomically
CREATE OR REPLACE FUNCTION public.increment_game_plays(game_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.games
  SET plays = plays + 1
  WHERE id = game_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits with validation
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  user_uuid UUID,
  credit_amount INTEGER,
  transaction_type TEXT,
  transaction_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO current_credits
  FROM public.users
  WHERE id = user_uuid
  FOR UPDATE;

  -- Check if user has enough credits
  IF current_credits < credit_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct credits
  UPDATE public.users
  SET credits = credits - credit_amount
  WHERE id = user_uuid;

  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (user_uuid, -credit_amount, transaction_type, transaction_description);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits
CREATE OR REPLACE FUNCTION public.add_user_credits(
  user_uuid UUID,
  credit_amount INTEGER,
  transaction_type TEXT,
  transaction_description TEXT,
  payment_intent_id TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Add credits
  UPDATE public.users
  SET credits = credits + credit_amount
  WHERE id = user_uuid;

  -- Log transaction
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    type,
    description,
    stripe_payment_intent_id
  )
  VALUES (
    user_uuid,
    credit_amount,
    transaction_type,
    transaction_description,
    payment_intent_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA (Demo Games)
-- =====================================================

-- Insert demo games (these will be added after the first user is created via the application)
-- You can manually insert these after setup if needed
