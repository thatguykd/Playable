-- Game Version Control Migration
-- This adds support for storing game version history for undo/redo functionality

-- =====================================================
-- GAME_VERSIONS TABLE
-- =====================================================
CREATE TABLE public.game_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  html TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.game_versions IS 'Version history for game iterations - keeps last 5 versions per session';
COMMENT ON COLUMN public.game_versions.session_id IS 'Groups versions together for a single game project';
COMMENT ON COLUMN public.game_versions.version_number IS 'Sequential version number starting from 1';
COMMENT ON COLUMN public.game_versions.html IS 'Complete HTML5 game code for this version';
COMMENT ON COLUMN public.game_versions.prompt IS 'User prompt that created this version';

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_game_versions_session ON public.game_versions(session_id, version_number DESC);
CREATE INDEX idx_game_versions_user ON public.game_versions(user_id);
CREATE INDEX idx_game_versions_created_at ON public.game_versions(created_at DESC);

-- =====================================================
-- AUTO-CLEANUP FUNCTION (Keep only last 5 versions)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_game_versions()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete versions beyond the 5 most recent for this session
  DELETE FROM public.game_versions
  WHERE session_id = NEW.session_id
    AND id NOT IN (
      SELECT id FROM public.game_versions
      WHERE session_id = NEW.session_id
      ORDER BY version_number DESC
      LIMIT 5
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_game_versions IS 'Automatically deletes game versions beyond the 5 most recent per session';

-- =====================================================
-- TRIGGER
-- =====================================================
CREATE TRIGGER trigger_cleanup_old_game_versions
  AFTER INSERT ON public.game_versions
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_game_versions();

COMMENT ON TRIGGER trigger_cleanup_old_game_versions ON public.game_versions IS 'Runs cleanup after each version insert';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.game_versions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own game versions
CREATE POLICY "Users can view own game versions"
  ON public.game_versions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own game versions
CREATE POLICY "Users can create own game versions"
  ON public.game_versions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own game versions
CREATE POLICY "Users can delete own game versions"
  ON public.game_versions
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- RPC FUNCTION: Get Game Versions for Session
-- =====================================================
CREATE OR REPLACE FUNCTION get_game_versions(session_uuid UUID)
RETURNS TABLE (
  id UUID,
  version_number INTEGER,
  html TEXT,
  prompt TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gv.id,
    gv.version_number,
    gv.html,
    gv.prompt,
    gv.created_at
  FROM public.game_versions gv
  WHERE gv.session_id = session_uuid
    AND gv.user_id = auth.uid()
  ORDER BY gv.version_number DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_game_versions IS 'Fetches last 5 game versions for a session (user-scoped)';

-- =====================================================
-- RPC FUNCTION: Save Game Version
-- =====================================================
CREATE OR REPLACE FUNCTION save_game_version(
  user_uuid UUID,
  session_uuid UUID,
  version_num INTEGER,
  game_html TEXT,
  user_prompt TEXT
)
RETURNS UUID AS $$
DECLARE
  new_version_id UUID;
BEGIN
  -- Insert new version
  INSERT INTO public.game_versions (
    user_id,
    session_id,
    version_number,
    html,
    prompt
  ) VALUES (
    user_uuid,
    session_uuid,
    version_num,
    game_html,
    user_prompt
  )
  RETURNING id INTO new_version_id;

  RETURN new_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION save_game_version IS 'Saves a new game version and returns its ID';
