# Playable Deployment Guide

This guide will walk you through deploying Playable to production with Supabase, Stripe, and Netlify.

## Prerequisites

- GitHub account
- Node.js 18+ installed locally
- npm installed locally

## Overview

Playable uses a modern serverless architecture:
- **Frontend**: React + Vite hosted on Netlify
- **Backend**: Netlify serverless functions
- **Database + Auth**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe

---

## Step 1: Create Supabase Project

### 1.1 Sign Up and Create Project

1. Go to [https://supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - **Name**: playable-production (or your choice)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Wait for project to initialize (~2 minutes)

### 1.2 Run Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" to execute the migration
6. You should see "Success. No rows returned" message

### 1.3 Enable Authentication Providers

1. Go to **Authentication** > **Providers** in Supabase dashboard
2. **Enable Email provider**:
   - Toggle "Enable Email provider" to ON
   - Enable "Confirm email" (recommended for production)
   - Save
3. **Enable Google OAuth** (optional but recommended):
   - Toggle "Google" to ON
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret
   - Paste into Supabase Google provider settings
   - Save

### 1.4 Get API Keys

1. Go to **Settings** > **API** in Supabase dashboard
2. Copy the following (you'll need these later):
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJhbG...` (safe to expose in frontend)
   - **service_role key**: `eyJhbG...` (SECRET - never expose in frontend!)

---

## Step 2: Create Stripe Account and Products

### 2.1 Sign Up for Stripe

1. Go to [https://stripe.com](https://stripe.com) and sign up
2. Complete account verification (may take a few days for live mode)
3. For now, use **Test Mode** (toggle in top right)

### 2.2 Create Products

1. Go to **Products** in Stripe dashboard
2. Click "+ Add Product"

**Product 1: GameDev Subscription**
- **Name**: GameDev
- **Description**: Create unlimited games with 2,500 monthly credits
- **Pricing**:
  - Model: Recurring
  - Price: $9.00 USD
  - Billing period: Monthly
- **Save** and copy the **Price ID** (starts with `price_...`)

**Product 2: Pro Studio Subscription**
- **Name**: Pro Studio
- **Description**: Professional game development with 15,000 monthly credits
- **Pricing**:
  - Model: Recurring
  - Price: $29.00 USD
  - Billing period: Monthly
- **Save** and copy the **Price ID**

**Product 3: Fuel Pack**
- **Name**: Fuel Pack
- **Description**: One-time credit pack - 1,000 credits
- **Pricing**:
  - Model: One time
  - Price: $5.00 USD
- **Save** and copy the **Price ID**

### 2.3 Get API Keys

1. Go to **Developers** > **API keys**
2. Copy:
   - **Publishable key**: `pk_test_...` (safe to expose)
   - **Secret key**: `sk_test_...` (SECRET - keep secure!)

### 2.4 Configure Webhook (will do after Netlify deployment)

We'll set this up in Step 4 after we have our Netlify URL.

---

## Step 3: Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the API key (starts with `AIza...`)
5. Keep this secure - it will be used server-side only

---

## Step 4: Deploy to Netlify

### 4.1 Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - production ready"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/playable.git
git branch -M main
git push -u origin main
```

### 4.2 Connect to Netlify

1. Go to [https://netlify.com](https://netlify.com) and sign up/login
2. Click "Add new site" > "Import an existing project"
3. Choose **GitHub** and authorize
4. Select your **playable** repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
6. Click "Show advanced" > "Add environment variable"

### 4.3 Add Environment Variables to Netlify

Add the following environment variables (click "Add variable" for each):

**Supabase Variables:**
```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_SERVICE_KEY = eyJhbG... (the service_role key, NOT anon key)
```

**Gemini API:**
```
GEMINI_API_KEY = AIza...
```

**Stripe Variables:**
```
STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = (leave blank for now, we'll add after webhook setup)
```

### 4.4 Deploy

1. Click "Deploy site"
2. Wait for deployment to complete (~2-3 minutes)
3. Copy your site URL (e.g., `https://playable-xyz.netlify.app`)

### 4.5 Configure Stripe Webhook

1. Go back to Stripe dashboard > **Developers** > **Webhooks**
2. Click "+ Add endpoint"
3. **Endpoint URL**: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
4. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Click on your new webhook to view details
7. Copy the **Signing secret** (starts with `whsec_...`)
8. Go back to Netlify > **Site settings** > **Environment variables**
9. Edit `STRIPE_WEBHOOK_SECRET` and paste the signing secret
10. **Redeploy** your site (Netlify > Deploys > Trigger deploy)

---

## Step 5: Configure Frontend Environment Variables

### 5.1 Create .env.local file locally

In your project root, create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Supabase (Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG... (anon key, NOT service key)

# Stripe (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs
VITE_STRIPE_GAMEDEV_PRICE_ID=price_... (from GameDev product)
VITE_STRIPE_PRO_PRICE_ID=price_... (from Pro Studio product)
VITE_STRIPE_FUEL_PACK_PRICE_ID=price_... (from Fuel Pack product)
```

### 5.2 Add to Netlify Environment Variables

Add these same frontend variables to Netlify as well:
1. Go to Netlify > **Site settings** > **Environment variables**
2. Add each `VITE_*` variable from above
3. Redeploy

---

## Step 6: Seed Demo Games (Optional)

If you want the demo games (Neon Drift, Quantum Pong) in your production database:

1. Create a user account through your deployed app
2. Go to Supabase dashboard > **Table Editor** > **games**
3. Click "Insert" > "Insert row"
4. Add the demo games manually or run this SQL:

```sql
INSERT INTO games (title, description, author_name, html, category, is_official, plays, thumbnail)
VALUES
(
  'Neon Drift',
  'A high-speed survival game where you dodge obstacles in a cyberpunk tunnel. The speed increases every 10 seconds.',
  'Playable Studios',
  '<!DOCTYPE html><html>...', -- Paste full HTML from storageService.ts demo games
  'Action',
  true,
  8420,
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop'
);
```

---

## Step 7: Test Your Deployment

### 7.1 Test Authentication
1. Visit your Netlify URL
2. Click "Sign In" > "Sign Up"
3. Create account with email/password
4. Check Supabase dashboard > **Authentication** > **Users** to verify

### 7.2 Test Game Generation
1. Log in to your app
2. Click "Studio"
3. Enter a game prompt
4. Verify game generates successfully
5. Check Supabase > **Table Editor** > **credit_transactions** to see deduction

### 7.3 Test Payments (Test Mode)
1. Click user avatar > "Settings"
2. Try to upgrade to GameDev tier
3. Use Stripe test card: `4242 4242 4242 4242`
4. Expiry: Any future date, CVC: Any 3 digits
5. Complete checkout
6. Verify in Supabase that credits were added and tier changed

### 7.4 Test Webhook
1. Go to Stripe > **Developers** > **Webhooks**
2. Click on your webhook
3. View webhook attempts - should see successful `checkout.session.completed` event

---

## Step 8: Go Live (Production)

### 8.1 Switch Stripe to Live Mode
1. Complete Stripe account verification
2. In Stripe dashboard, toggle from **Test mode** to **Live mode**
3. Recreate the 3 products (GameDev, Pro, Fuel Pack) in live mode
4. Get new live mode API keys
5. Update Netlify environment variables with live keys:
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `VITE_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - Update price IDs with live mode price IDs
6. Recreate webhook in live mode pointing to your Netlify URL
7. Update `STRIPE_WEBHOOK_SECRET` with new live webhook secret

### 8.2 Set Up Custom Domain (Optional)
1. Buy domain (e.g., from Namecheap, Google Domains)
2. In Netlify > **Domain settings** > **Add custom domain**
3. Follow Netlify's instructions to configure DNS
4. Enable HTTPS (automatic with Netlify)
5. Update Supabase OAuth redirect URLs if using Google auth

### 8.3 Configure Email (Production)
1. In Supabase, go to **Authentication** > **Email Templates**
2. Customize confirmation and recovery email templates
3. Set up custom SMTP (optional) in **Settings** > **Auth** > **SMTP Settings**

---

## Ongoing Maintenance

### Monitor Usage
- **Supabase**: Check database size, API requests in dashboard
- **Netlify**: Monitor function invocations and bandwidth
- **Stripe**: Review payments and subscription metrics
- **Gemini**: Track API usage in Google AI Studio

### Backup Database
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Backup
supabase db dump -f backup.sql
```

### Update Environment Variables
When rotating keys or updating configs:
1. Update in Netlify dashboard
2. Redeploy site
3. Update `.env.local` for local development

---

## Troubleshooting

### "Insufficient credits" error but user has credits
- Check that `SUPABASE_SERVICE_KEY` in Netlify is the **service_role** key, not anon key
- Verify credit_transactions table has proper entries

### Stripe webhook not firing
- Verify webhook URL is exactly: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
- Check Stripe dashboard for failed attempts
- Verify `STRIPE_WEBHOOK_SECRET` matches the webhook's signing secret

### Auth not working
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly
- Check Supabase > **Authentication** > **URL Configuration** matches your deployment URL
- For Google OAuth, verify redirect URIs in Google Console

### Functions timing out
- Netlify functions have 10-second timeout on free tier
- Consider upgrading Netlify plan if Gemini calls take too long

---

## Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Use service_role key only in backend (Netlify functions)
- [ ] Use anon key in frontend
- [ ] Enable RLS policies in Supabase (already done in migration)
- [ ] Enable email confirmation for production
- [ ] Use live mode Stripe keys in production
- [ ] Set up rate limiting (consider Netlify Edge Functions)
- [ ] Regular database backups
- [ ] Monitor Stripe webhook signature verification

---

## Cost Estimates

**Free Tier Limits:**
- **Supabase**: 500MB database, 50K monthly active users, 2GB bandwidth
- **Netlify**: 100GB bandwidth, 125K function invocations/month
- **Stripe**: No monthly fees, 2.9% + $0.30 per transaction
- **Gemini API**: Check current pricing at Google AI Studio

**When to upgrade:**
- Supabase: When database exceeds 500MB or need more bandwidth
- Netlify: When functions exceed 125K invocations (game generations)
- Consider caching strategies and CDN for assets

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Stripe Docs**: https://stripe.com/docs
- **Gemini API Docs**: https://ai.google.dev/docs

---

You're now ready to run Playable in production! 🎮
