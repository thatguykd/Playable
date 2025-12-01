-- Fix get_game_versions to accept user_uuid parameter
-- This ensures it works correctly when called from Netlify functions

DROP FUNCTION IF EXISTS get_game_versions(UUID);

CREATE OR REPLACE FUNCTION get_game_versions(
  session_uuid UUID,
  user_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  version_number INTEGER,
  html TEXT,
  prompt TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_uuid or fall back to auth.uid()
  target_user_id := COALESCE(user_uuid, auth.uid());

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No user ID provided';
  END IF;

  RETURN QUERY
  SELECT
    gv.id,
    gv.version_number,
    gv.html,
    gv.prompt,
    gv.created_at
  FROM public.game_versions gv
  WHERE gv.session_id = session_uuid
    AND gv.user_id = target_user_id
  ORDER BY gv.version_number DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_game_versions IS 'Fetches last 5 game versions for a session (user-scoped)';
