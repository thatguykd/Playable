-- Update save_game_version function to accept user_uuid parameter
-- This fixes the "null value in column user_id" error

-- First, drop the old function with 4 parameters
DROP FUNCTION IF EXISTS save_game_version(UUID, INTEGER, TEXT, TEXT);

-- Now create the new function with 5 parameters (including user_uuid)
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

COMMENT ON FUNCTION save_game_version IS 'Saves a new game version and returns its ID (updated to accept user_uuid)';
