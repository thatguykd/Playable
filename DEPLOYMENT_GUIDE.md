# Deployment Guide: Claude API Streaming

This guide will help you deploy the new Claude API streaming implementation.

## Overview

We've replaced the complex async job system with a simple, reliable streaming solution:
- ✅ Direct Supabase Edge Function with Claude API
- ✅ Real-time SSE streaming (150-second timeout)
- ✅ Simple architecture, no job polling/tracking
- ✅ Better user experience with live progress updates

---

## Prerequisites

1. **Claude API Key**
   - Go to https://console.anthropic.com/
   - Sign in or create an account
   - Navigate to Settings → API Keys
   - Create a new key (starts with `sk-ant-api03-...`)
   - Copy the key (you'll need it in step 3)

2. **Supabase CLI** (for deploying Edge Functions)
   ```bash
   npm install -g supabase
   ```

3. **Database Cleanup Completed**
   - ✅ You should have already run `cleanup_async_db.sql` in Supabase SQL Editor

---

## Step 1: Configure Claude API Key in Supabase

You need to add the Claude API key as a secret for the Edge Function:

```bash
# Login to Supabase CLI (if not already logged in)
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Set the Claude API key secret
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
```

**To find your PROJECT_REF:**
- Go to your Supabase dashboard
- Your project URL is: `https://YOUR_PROJECT_REF.supabase.co`
- The `YOUR_PROJECT_REF` part is what you need

---

## Step 2: Deploy the Edge Function

```bash
# Deploy the generate-game-stream Edge Function
npx supabase functions deploy generate-game-stream
```

This will:
- Upload the Edge Function to Supabase
- Make it available at: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate-game-stream`
- Use the ANTHROPIC_API_KEY secret you set in Step 1

**Verify deployment:**
```bash
# List all deployed functions
npx supabase functions list
```

You should see `generate-game-stream` in the list.

---

## Step 3: Update Netlify Environment Variables

1. Go to Netlify Dashboard → Your Site → Site settings → Environment variables

2. **Add new variable:**
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-YOUR-KEY-HERE`
   - Scopes: Production, Deploy Previews, Branch deploys

3. **Remove old variable (if exists):**
   - Delete `WORKER_INVOKE_SECRET` (no longer needed)

4. **Verify these variables still exist:**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY` (can keep for now as fallback, or remove)
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

---

## Step 4: Deploy Frontend to Netlify

```bash
# Commit all changes
git add .
git commit -m "Implement Claude API streaming with Supabase Edge Functions"

# Push to GitHub (force push since we did git reset)
git push origin master --force

# Netlify will automatically deploy the changes
# Or you can manually deploy:
netlify deploy --prod
```

---

## Step 5: Test the Implementation

### Test Simple Game Generation
1. Go to your deployed site
2. Log in
3. Go to Studio
4. Try generating a simple game: "Create a basic pong game"
5. **Expected behavior:**
   - You should see real-time progress updates
   - Generation should complete without timeout
   - Game should load and be playable

### Test Complex Game Generation
1. Try a complex prompt: "Create a chess game with AI opponent"
2. **Expected behavior:**
   - Should take longer but not timeout (up to 150 seconds)
   - Progress updates stream in real-time
   - Final game is generated successfully

### Test Game Iteration
1. Generate a simple game
2. Request a modification: "Add a score multiplier powerup"
3. **Expected behavior:**
   - Edge Function receives existing HTML
   - Claude modifies the game
   - Credits deducted correctly (10 instead of 50)

---

## Step 6: Monitor and Debug

### View Edge Function Logs

```bash
# Stream real-time logs from the Edge Function
npx supabase functions logs generate-game-stream --follow
```

This will show you:
- Incoming requests
- Claude API responses
- Any errors
- Credit deductions

### Check Supabase Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. Click on `generate-game-stream`
3. View logs and invocations

### Frontend Console

Open browser DevTools → Console to see:
- SSE stream events
- Progress updates
- Any errors

---

## Troubleshooting

### Error: "Unable to read response stream"
**Cause:** Browser doesn't support streaming or CORS issue
**Fix:** Check CORS headers in Edge Function (already configured)

### Error: "Unauthorized: Invalid token"
**Cause:** Supabase session expired or invalid
**Fix:** Log out and log back in

### Error: "Failed to fetch user data"
**Cause:** SUPABASE_SERVICE_ROLE_KEY not set or invalid
**Fix:**
```bash
# Verify secret exists
npx supabase secrets list

# Set it if missing
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key-here
```

### Error: Claude API rate limit exceeded
**Cause:** Too many requests to Claude API
**Fix:**
- Wait a few minutes
- Check your Anthropic dashboard for rate limits
- Consider upgrading your Anthropic plan

### No progress updates showing
**Cause:** Frontend not receiving SSE events
**Fix:**
- Check browser console for errors
- Verify Edge Function is deployed: `npx supabase functions list`
- Check Edge Function logs: `npx supabase functions logs generate-game-stream`

### Timeout after 150 seconds
**Cause:** Game too complex for single generation
**Fix:**
- This is Supabase Edge Function's hard limit
- Suggest user simplify prompt
- Break into iterations instead

---

## Architecture Overview

### Old System (Removed)
```
Frontend → Netlify Function → Create DB Job → Edge Function (async)
                           ↓
                    Poll/Realtime for updates
```
**Issues:** Complex, unreliable Realtime, polling delays

### New System (Current)
```
Frontend → Supabase Edge Function → Claude API (streaming)
              ↓
         Real-time SSE updates
```
**Benefits:** Simple, direct, real-time, 150s timeout

---

## Cost Monitoring

### Claude API Pricing
- **Sonnet 4.5:** $3/M input tokens, $15/M output tokens
- **Average game:** ~2K input + ~4K output tokens
- **Cost per game:** ~$0.07

### Monitor Usage
1. Go to https://console.anthropic.com/
2. Check Settings → Usage
3. Set up billing alerts

### Cost Optimization Tips
- Use Claude Haiku for simple games (much cheaper)
- Implement prompt optimization
- Cache common system prompts (future enhancement)

---

## Rollback Plan

If something goes wrong:

### Option 1: Rollback to async version
```bash
git reset --hard backup-async-attempt
git push origin master --force
```

Then restore database:
- Re-run migrations 007, 008, 009, 010
- Re-enable Edge Functions
- Restore env vars

### Option 2: Use Gemini fallback
Keep `GEMINI_API_KEY` in Netlify and modify code to fallback to Gemini if Claude fails.

---

## Next Steps

After successful deployment:

1. **Remove Gemini dependency** (optional):
   ```bash
   npm uninstall @google/generative-ai
   ```

2. **Update documentation:**
   - Update README with Claude API setup
   - Remove async-related docs

3. **Monitor performance:**
   - Track generation times
   - Monitor API costs
   - Collect user feedback

4. **Future enhancements:**
   - Add model selection (Haiku vs Sonnet)
   - Implement prompt caching
   - Add generation analytics

---

## Support

If you encounter issues:

1. Check Edge Function logs: `npx supabase functions logs generate-game-stream --follow`
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Test Edge Function directly with curl (see below)

### Test Edge Function with Curl

```bash
# Replace with your values
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export ACCESS_TOKEN="your-session-access-token"

curl -X POST \
  "${SUPABASE_URL}/functions/v1/generate-game-stream" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a simple pong game",
    "currentHistory": []
  }' \
  --no-buffer
```

You should see SSE events streaming back.

---

## Summary

✅ **What we removed:**
- Async job system (database tables, functions, cron jobs)
- Realtime pub/sub complexity
- Polling fallbacks
- Job status tracking
- WORKER_INVOKE_SECRET

✅ **What we added:**
- Claude API integration with proper streaming
- Supabase Edge Function for game generation
- Real-time SSE progress updates
- Simpler, more reliable architecture
- Better user experience

✅ **Benefits:**
- No more async complexity
- 150-second timeout (vs 10-26s)
- Real-time progress
- Simpler to maintain
- Better error handling

🎉 **Result:** A solid, reliable game generation system!
