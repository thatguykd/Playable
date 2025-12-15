    -- Supabase Database Cleanup Script
    -- Run this in Supabase Dashboard → SQL Editor to remove all async job infrastructure

    -- Step 1: Drop cron jobs
    SELECT cron.unschedule('detect-stuck-jobs');
    SELECT cron.unschedule('cleanup-old-jobs');

    -- Step 2: Drop database functions
    DROP FUNCTION IF EXISTS detect_stuck_jobs();
    DROP FUNCTION IF EXISTS cleanup_old_jobs();
    DROP FUNCTION IF EXISTS refund_job_credits(UUID);

    -- Step 3: Remove table from Realtime publication (if exists)
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND tablename = 'game_generation_jobs'
        ) THEN
            ALTER PUBLICATION supabase_realtime DROP TABLE game_generation_jobs;
        END IF;
    END $$;

    -- Step 4: Drop the main table (cascades to indexes, triggers, policies)
    DROP TABLE IF EXISTS game_generation_jobs CASCADE;

    -- Step 5: Optionally disable pg_cron if not used elsewhere
    -- Uncomment the line below if you're not using pg_cron for anything else
    -- DROP EXTENSION IF EXISTS pg_cron;

    -- Verification queries (should return 0 rows)
    SELECT 'Checking for game_generation_jobs table...' as step;
    SELECT * FROM pg_tables WHERE tablename = 'game_generation_jobs';

    SELECT 'Checking for cron jobs...' as step;
    SELECT * FROM cron.job WHERE jobname IN ('detect-stuck-jobs', 'cleanup-old-jobs');

    SELECT 'Cleanup complete!' as status;
