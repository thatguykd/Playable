# State Persistence Migration Instructions

## Overview
This migration adds database tables to persist user state across page refreshes, including:
- **Recently played games** - Track play history per user
- **Studio sessions** - Auto-save work-in-progress
- **User preferences** - Remember current view and active game

## How to Run the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/005_add_state_persistence.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration
7. Verify success - you should see: "Success. No rows returned"

### Option 2: Supabase CLI (if you have it installed)

```bash
# If you have Supabase CLI set up locally
supabase db push
```

## What This Migration Creates

### New Tables

1. **play_history**
   - Tracks which games users have played
   - Stores play count and last played timestamp
   - Used for "Recently Played" feature

2. **studio_sessions**
   - Saves in-progress game creation sessions
   - Stores chat history, current game code, and metadata
   - Allows users to resume work after refresh

3. **user_preferences**
   - Stores UI state (current view, active game)
   - Automatically created for all users
   - Persists navigation state

### Helper Functions

- `record_game_play()` - Atomically records or updates play history
- `get_or_create_user_preferences()` - Ensures preferences exist for user
- `cleanup_old_studio_sessions()` - Maintains only recent sessions

### Security

All tables have Row Level Security (RLS) enabled:
- Users can only see/modify their own data
- Proper indexes for performance
- Atomic operations prevent race conditions

## After Migration

Once the migration is complete:

1. **Refresh your app** - Page reload will activate the new persistence features
2. **Test the features:**
   - Create a game in Studio, refresh the page - your work should be restored
   - Play a few games, refresh - they should appear in "Recently Played"
   - Navigate to Library, refresh - you should stay on the Library view
   - Close and reopen your browser - your session should persist

## Troubleshooting

### If you see errors about existing tables/functions:

This is normal if you're re-running the migration. The `IF NOT EXISTS` clauses will skip creating duplicate objects.

### If RLS policies fail:

Make sure you're logged in as the database owner/service role when running the migration.

### If data isn't persisting:

1. Check browser console for errors
2. Verify the migration ran successfully in Supabase dashboard
3. Check that RLS policies are active: `SELECT * FROM pg_policies;`

## Rollback (if needed)

If you need to undo this migration:

```sql
-- Run this in the SQL Editor to remove the new tables
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS studio_sessions CASCADE;
DROP TABLE IF EXISTS play_history CASCADE;
DROP FUNCTION IF EXISTS record_game_play;
DROP FUNCTION IF EXISTS get_or_create_user_preferences;
DROP FUNCTION IF EXISTS cleanup_old_studio_sessions;
```

## Support

If you encounter issues, check:
- Supabase project logs
- Browser console for frontend errors
- Network tab for failed API calls
