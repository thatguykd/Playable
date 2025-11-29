-- Fix OAuth user creation to handle Google's 'full_name' metadata field
-- This migration updates the trigger function to check both 'name' (email/password signup)
-- and 'full_name' (Google OAuth) when creating user profiles

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    -- Try multiple metadata fields in order of preference:
    -- 1. 'name' field (set by email/password signup)
    -- 2. 'full_name' field (set by Google OAuth)
    -- 3. Fallback to email if neither exists
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.email
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- No need to recreate the trigger as it already exists and points to this function
-- The trigger will automatically use the updated function definition
