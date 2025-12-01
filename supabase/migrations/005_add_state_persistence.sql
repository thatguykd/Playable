-- Migration: Add State Persistence Tables
-- Description: Adds tables for play history, studio sessions, and user preferences

-- ============================================================================
-- 1. PLAY HISTORY TABLE
-- ============================================================================
-- Tracks which games users have played and when
CREATE TABLE IF NOT EXISTS play_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  last_played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  play_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Index for fast retrieval of user's recent games
CREATE INDEX idx_play_history_user_recent ON play_history(user_id, last_played_at DESC);

-- RLS Policies for play_history
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own play history"
  ON play_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own play history"
  ON play_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own play history"
  ON play_history FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. STUDIO SESSIONS TABLE
-- ============================================================================
-- Saves in-progress studio work so users can resume after refresh
CREATE TABLE IF NOT EXISTS studio_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  current_game_html TEXT,
  current_version INTEGER DEFAULT 1,
  suggested_title TEXT,
  suggested_description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- Index for fast retrieval of user's active session
CREATE INDEX idx_studio_sessions_user_active ON studio_sessions(user_id, is_active, last_updated_at DESC);

-- RLS Policies for studio_sessions
ALTER TABLE studio_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own studio sessions"
  ON studio_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own studio sessions"
  ON studio_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own studio sessions"
  ON studio_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own studio sessions"
  ON studio_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. USER PREFERENCES TABLE
-- ============================================================================
-- Stores UI state preferences like current view and active game
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_view TEXT DEFAULT 'feed',
  active_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  active_studio_session_id UUID REFERENCES studio_sessions(id) ON DELETE SET NULL,
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to upsert play history (increment play count or create new entry)
CREATE OR REPLACE FUNCTION record_game_play(
  p_user_id UUID,
  p_game_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO play_history (user_id, game_id, last_played_at, play_count)
  VALUES (p_user_id, p_game_id, NOW(), 1)
  ON CONFLICT (user_id, game_id)
  DO UPDATE SET
    last_played_at = NOW(),
    play_count = play_history.play_count + 1;
END;
$$;

-- Function to get or create user preferences
CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id UUID)
RETURNS user_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_preferences user_preferences;
BEGIN
  SELECT * INTO v_preferences
  FROM user_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  RETURN v_preferences;
END;
$$;

-- Function to clean up old inactive studio sessions (keep last 5 per user)
CREATE OR REPLACE FUNCTION cleanup_old_studio_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM studio_sessions
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY last_updated_at DESC) as rn
      FROM studio_sessions
      WHERE is_active = false
    ) sub
    WHERE rn > 5
  );
END;
$$;

-- ============================================================================
-- 5. TRIGGER TO AUTO-CREATE USER PREFERENCES
-- ============================================================================
-- Create user preferences automatically when a user is created
CREATE OR REPLACE FUNCTION create_user_preferences_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created_create_preferences
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences_on_signup();

-- ============================================================================
-- 6. GRANTS
-- ============================================================================
-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION record_game_play TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_studio_sessions TO authenticated;
