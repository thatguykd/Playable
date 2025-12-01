# Supabase CLI Setup Guide

## Why Use Supabase CLI?

- ✅ Run migrations locally before production
- ✅ Test database changes safely
- ✅ Version control your database schema
- ✅ Local development database
- ✅ Type-safe database types generation

---

## Step 1: Install Supabase CLI

### macOS (Homebrew)
```bash
brew install supabase/tap/supabase
```

### macOS/Linux (npm)
```bash
npm install -g supabase
```

### Windows (Scoop)
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Verify Installation
```bash
supabase --version
# Should show: supabase version X.X.X
```

---

## Step 2: Login to Supabase

```bash
supabase login
```

This will:
1. Open your browser
2. Ask you to authorize the CLI
3. Generate an access token
4. Store it locally for future commands

---

## Step 3: Link Your Project

```bash
# Initialize Supabase in your project (if not already done)
supabase init

# Link to your remote Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

**Where to find your project ref:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
4. Or go to Settings → General → Reference ID

You'll be prompted for your database password (the one you set when creating the project).

---

## Step 4: Configure Your Project

### Create/Update `.env.local`

Create a `.env.local` file in your project root with your Supabase credentials:

```bash
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (for migrations)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.YOUR_PROJECT_REF.supabase.co:5432/postgres

# Gemini
VITE_GEMINI_API_KEY=your-gemini-key
GEMINI_API_KEY=your-gemini-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
VITE_GAMEDEV_PRICE_ID=price_xxx
VITE_PRO_PRICE_ID=price_xxx
VITE_FUEL_PACK_PRICE_ID=price_xxx

# Dev Mode (optional)
VITE_DEV_MODE=false
DEV_MODE=false
```

### Add to `.gitignore`

Make sure `.env.local` is in your `.gitignore`:

```bash
echo ".env.local" >> .gitignore
```

---

## Step 5: Verify Existing Migrations

Your existing migrations should already be in `supabase/migrations/`:

```bash
ls -la supabase/migrations/
```

You should see:
- `001_initial_schema.sql`
- `002_seed_demo_games.sql`
- `003_game_versions.sql`
- `004_fix_oauth_user_creation.sql`
- `005_add_state_persistence.sql` (the new one)

---

## Step 6: Run the Migration

### Option A: Push to Remote Database (Production)

⚠️ **This affects your live database!**

```bash
# Check status first
supabase db diff

# Push all pending migrations
supabase db push

# Or push to a specific environment
supabase db push --db-url "$DATABASE_URL"
```

### Option B: Start Local Database and Test

This is the **recommended approach** for testing:

```bash
# Start local Supabase (includes Postgres, Auth, Storage, etc.)
supabase start

# This will:
# - Download Docker images (first time only)
# - Start local Postgres database
# - Run all migrations in supabase/migrations/
# - Start Supabase Studio at http://localhost:54323
```

After starting, you'll see output like:
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJh...
service_role key: eyJh...
```

### Test the Migration Locally

1. **Open Supabase Studio:** http://localhost:54323
2. **Check tables:** Table Editor → Should see `play_history`, `studio_sessions`, `user_preferences`
3. **Check functions:** Database → Functions → Should see `record_game_play`, etc.
4. **Run app against local DB:**

Update your `.env.local` to point to local Supabase:
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<anon-key-from-supabase-start-output>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-output>
```

5. **Start your app:**
```bash
npm run dev
```

6. **Test features:**
   - Create a game, refresh → should restore
   - Play games → should track in play_history
   - Check Supabase Studio → verify data in tables

### Stop Local Supabase

```bash
supabase stop
```

---

## Step 7: Update Package.json Scripts

Add these helpful scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "netlify dev",
    "dev:vite": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:status": "supabase status",
    "db:push": "supabase db push",
    "db:diff": "supabase db diff",
    "db:types": "supabase gen types typescript --local > types/database.ts"
  }
}
```

Now you can run:
- `npm run db:start` - Start local Supabase
- `npm run db:stop` - Stop local Supabase
- `npm run db:reset` - Reset and re-run all migrations
- `npm run db:push` - Push migrations to remote
- `npm run db:types` - Generate TypeScript types from schema

---

## Step 8: Create a New Migration (Example)

When you need to create future migrations:

```bash
# Create a new migration file
supabase migration new add_new_feature

# This creates: supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql
# Edit the file, then test locally:
supabase db reset  # Resets and runs all migrations

# When ready, push to production:
supabase db push
```

---

## Common Commands Cheat Sheet

```bash
# Project Management
supabase login                    # Login to Supabase
supabase init                     # Initialize new project
supabase link --project-ref XXX   # Link to remote project

# Local Development
supabase start                    # Start local Supabase
supabase stop                     # Stop local Supabase
supabase status                   # Check local status

# Database Migrations
supabase db diff                  # Check pending migrations
supabase db push                  # Push migrations to remote
supabase db reset                 # Reset local DB and rerun migrations
supabase migration new NAME       # Create new migration file

# Type Generation
supabase gen types typescript --local > types/database.ts

# Functions
supabase functions new NAME       # Create new edge function
supabase functions serve          # Run functions locally
```

---

## Recommended Workflow

### For New Features

1. **Start local Supabase:**
   ```bash
   npm run db:start
   ```

2. **Create migration:**
   ```bash
   supabase migration new my_feature
   ```

3. **Edit migration file:**
   ```sql
   -- supabase/migrations/XXX_my_feature.sql
   CREATE TABLE my_table (...);
   ```

4. **Test locally:**
   ```bash
   npm run db:reset
   npm run dev  # Test your app
   ```

5. **Generate types:**
   ```bash
   npm run db:types
   ```

6. **Commit migration:**
   ```bash
   git add supabase/migrations/
   git commit -m "Add my_feature migration"
   ```

7. **Push to production:**
   ```bash
   npm run db:push
   ```

---

## Troubleshooting

### Docker not running
```
Error: Cannot connect to Docker daemon
```
**Solution:** Install and start Docker Desktop

### Port already in use
```
Error: Port 54321 is already in use
```
**Solution:**
```bash
supabase stop
# Or find and kill the process using the port
lsof -ti:54321 | xargs kill
```

### Migration fails
```
Error: migration XXX failed
```
**Solution:**
```bash
# Check the error message
supabase db reset --debug

# Fix the SQL in the migration file
# Then reset and try again
```

### Can't connect to remote DB
```
Error: failed to connect to database
```
**Solution:**
- Check your database password
- Verify project ref is correct
- Check network/firewall settings

---

## Next Steps

Now you can:

1. ✅ **Test the new migration locally:**
   ```bash
   npm run db:start
   npm run dev
   # Test all persistence features
   ```

2. ✅ **Verify data in Supabase Studio:**
   - Open http://localhost:54323
   - Check play_history, studio_sessions, user_preferences tables

3. ✅ **Push to production when ready:**
   ```bash
   npm run db:push
   ```

4. ✅ **Generate updated types:**
   ```bash
   npm run db:types
   ```
