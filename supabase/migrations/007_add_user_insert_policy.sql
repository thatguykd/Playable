-- Migration: Add INSERT policy for users table
-- Description: Allows users to insert their own profile as a fallback if the trigger fails
-- This is a safety net in case the handle_new_user() trigger doesn't run or fails

-- Add INSERT policy for users table
-- Users can only insert their own profile (id must match auth.uid())
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Note: The trigger function handle_new_user() uses SECURITY DEFINER to bypass RLS,
-- but this policy provides a fallback for manual profile creation if needed.
