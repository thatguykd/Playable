-- ============================================
-- TEMPORARY: Testing Period Credit Increase
-- ============================================
--
-- IMPORTANT: This is temporary for initial testing phase
-- Revert to 50 credits before official launch
--
-- Context: We're giving testers 10,000 credits so they can
-- fully test the platform without payment restrictions while
-- we await Stripe approval and domain setup.
--

-- Update default for NEW signups
ALTER TABLE public.users
  ALTER COLUMN credits SET DEFAULT 10000;

-- Update existing free tier users who haven't created games yet
-- (Gives them the testing bonus as well)
UPDATE public.users
SET credits = 10000
WHERE tier = 'free'
  AND games_created = 0
  AND credits < 10000;

-- Also update existing free users who have created games
-- (Give everyone the testing credit boost)
UPDATE public.users
SET credits = credits + 9950
WHERE tier = 'free'
  AND credits < 10000;

-- Update column comment to reflect temporary change
COMMENT ON COLUMN public.users.credits IS
  'Available credits for game generation (new game = 50, iteration = 10).
   TEMPORARY: Set to 10,000 for testing period before official launch.';
