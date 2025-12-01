# Quick Start: Running the State Persistence Migration

Follow these steps to properly set up and run the migration using Supabase CLI.

---

## Prerequisites

- ✅ Docker Desktop installed and running
- ✅ Node.js and npm installed
- ✅ Supabase project created

---

## Step-by-Step Guide

### 1. Install Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Or using npm (any OS):**
```bash
npm install -g supabase
```

**Verify:**
```bash
supabase --version
```

---

### 2. Login to Supabase

```bash
supabase login
```

This will open your browser to authorize the CLI.

---

### 3. Initialize Supabase in Your Project

```bash
# From your project root directory
supabase init
```

This creates a `supabase/` directory with config files.

---

### 4. Link to Your Remote Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**Find your project ref:**
- Go to https://supabase.com/dashboard
- Select your project
- URL shows: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- Or: Settings → General → Reference ID

You'll be prompted for your database password.

---

### 5. Test Migration Locally (Recommended)

```bash
# Start local Supabase (first time will download Docker images)
npm run db:start
```

Wait for it to start. You'll see output like:
```
Started supabase local development setup.

         API URL: http://localhost:54321
      Studio URL: http://localhost:54323
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

**Verify in Supabase Studio:**
1. Open http://localhost:54323
2. Go to Table Editor
3. Check for new tables:
   - ✅ `play_history`
   - ✅ `studio_sessions`
   - ✅ `user_preferences`

**All migrations in `supabase/migrations/` are automatically applied!**

---

### 6. Test Your App Locally

Update `.env.local` (create if it doesn't exist):

```bash
# Copy from supabase start output
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<anon-key-from-output>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-output>

# Your other keys
VITE_GEMINI_API_KEY=your-gemini-key
GEMINI_API_KEY=your-gemini-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key
# ... etc
```

**Run your app:**
```bash
npm run dev
```

**Test the features:**
1. Create an account / Login
2. Create a game in Studio
3. Refresh the page → Game should be restored ✅
4. Play some games
5. Refresh → Should see them in "Recently Played" ✅
6. Navigate to Library, refresh → Should stay on Library ✅

---

### 7. Push to Production

Once you've tested locally and everything works:

```bash
# Check what will be pushed
npm run db:diff

# Push migration to production database
npm run db:push
```

⚠️ **This will modify your production database!**

---

### 8. Stop Local Supabase (When Done)

```bash
npm run db:stop
```

---

## Useful Commands

```bash
# Start local database
npm run db:start

# Stop local database
npm run db:stop

# Reset local database (reruns all migrations)
npm run db:reset

# Check status
npm run db:status

# Push migrations to production
npm run db:push

# Check differences
npm run db:diff

# Generate TypeScript types from schema
npm run db:types
```

---

## What Just Happened?

1. ✅ **Local Supabase started** with all migrations applied
2. ✅ **3 new tables created:**
   - `play_history` - Tracks games you've played
   - `studio_sessions` - Auto-saves your work
   - `user_preferences` - Remembers your UI state
3. ✅ **Helper functions created:**
   - `record_game_play()` - Records play history
   - `get_or_create_user_preferences()` - Gets/creates prefs
4. ✅ **Row Level Security enabled** - Users only see their data
5. ✅ **Triggers created** - Auto-create preferences on signup

---

## Troubleshooting

### "Docker is not running"
**Solution:** Start Docker Desktop

### "Port 54321 already in use"
**Solution:**
```bash
npm run db:stop
# Or kill the process
lsof -ti:54321 | xargs kill
```

### "Cannot connect to remote database"
**Solution:**
- Verify project ref is correct
- Check database password
- Ensure you have network access

### Migration fails
**Solution:**
```bash
# Reset and try again
npm run db:reset
```

### Need to see logs
**Solution:**
```bash
supabase start --debug
```

---

## Next Steps

After the migration is running successfully:

1. **Test all features thoroughly locally**
2. **Push to production** when ready: `npm run db:push`
3. **Update your production .env** variables in Netlify
4. **Deploy your updated code** to Netlify
5. **Test in production**

---

## File Overview

- `supabase/migrations/005_add_state_persistence.sql` - The migration
- `netlify/functions/save-studio-session.ts` - Save session API
- `netlify/functions/get-studio-session.ts` - Get session API
- `netlify/functions/record-play.ts` - Record play API
- `services/storageService.ts` - Updated with new functions
- `App.tsx` - Updated with auto-save and restore logic
- `types/database.ts` - Updated with new table types

---

## Questions?

See the detailed guides:
- `SUPABASE_CLI_SETUP.md` - Full CLI setup documentation
- `MIGRATION_INSTRUCTIONS.md` - Manual migration steps (if not using CLI)
- `STATE_PERSISTENCE_SUMMARY.md` - Technical implementation details

Happy coding! 🚀
