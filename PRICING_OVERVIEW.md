# Playable Pricing Model Overview

**Last Updated:** 2025-11-27

---

## Table of Contents
1. [Subscription Tiers](#subscription-tiers)
2. [Credit Economics](#credit-economics)
3. [Credit Costs Per Action](#credit-costs-per-action)
4. [Monthly Credit Allocations](#monthly-credit-allocations)
5. [One-Time Purchases](#one-time-purchases)
6. [Stripe Price IDs](#stripe-price-ids)
7. [Usage Examples](#usage-examples)
8. [Current Pricing Summary Table](#current-pricing-summary-table)

---

## Subscription Tiers

### Free (Starter)
- **Price:** $0/month
- **Initial Credits:** 50 credits (one-time on signup)
- **Monthly Credits:** 0 (no refills)
- **Game Limit:** 1 game maximum
- **Iterations:** ❌ Not allowed
- **Features:**
  - Basic AI models
  - Public game publishing
  - Leaderboard access

### GameDev
- **Price:** $9/month
- **Initial Credits:** 50 credits (from free tier before upgrade)
- **Monthly Credits:** 2,500 credits
- **Game Limit:** Unlimited
- **Iterations:** ✅ Allowed
- **Features:**
  - Everything in Free
  - Edit & iterate games (10 credits each)
  - Priority queue
  - Unlimited projects

### Pro Studio
- **Price:** $29/month
- **Initial Credits:** 50 credits (from free tier before upgrade)
- **Monthly Credits:** 15,000 credits
- **Game Limit:** Unlimited
- **Iterations:** ✅ Allowed
- **Features:**
  - Everything in GameDev
  - 6x more credits than GameDev
  - Fastest generation times
  - Early access to new features

---

## Credit Economics

### Initial Credits on Signup
- **All new users:** 50 credits (set in database default)
- Location: `supabase/migrations/001_initial_schema.sql:15`

### Monthly Subscription Refills
Credits are automatically added on:
1. Initial subscription purchase
2. Monthly renewal (invoice payment)

**Refill amounts:**
- GameDev: 2,500 credits/month
- Pro: 15,000 credits/month

Location: `netlify/functions/stripe-webhook.ts:26-29`

---

## Credit Costs Per Action

### Game Generation
- **New Game:** 50 credits
- **Game Iteration:** 10 credits

Location: `services/storageService.ts:5-6` and `netlify/functions/generate-game.ts:6-7`

### Breakdown
| Action | Credits | Free Tier | GameDev | Pro |
|--------|---------|-----------|---------|-----|
| Create new game | 50 | 1 game max | ✅ | ✅ |
| Iterate/edit game | 10 | ❌ | ✅ | ✅ |

---

## Monthly Credit Allocations

### Credits per Month by Tier

| Tier | Monthly Credits | New Games Possible | Iterations Possible |
|------|----------------|-------------------|---------------------|
| Free | 0 | 0 (only 1 total) | 0 |
| GameDev | 2,500 | 50 games | 250 iterations |
| Pro | 15,000 | 300 games | 1,500 iterations |

### Realistic Mixed Usage Examples

**GameDev ($9/mo with 2,500 credits):**
- 10 new games (500 credits) + 200 iterations (2,000 credits) = 2,500 credits
- 25 new games (1,250 credits) + 125 iterations (1,250 credits) = 2,500 credits
- 50 new games (2,500 credits) + 0 iterations = 2,500 credits

**Pro ($29/mo with 15,000 credits):**
- 50 new games (2,500 credits) + 1,250 iterations (12,500 credits) = 15,000 credits
- 100 new games (5,000 credits) + 1,000 iterations (10,000 credits) = 15,000 credits
- 300 new games (15,000 credits) + 0 iterations = 15,000 credits

---

## One-Time Purchases

### Fuel Pack
- **Credits:** 1,000 credits
- **Price:** $5.00 (one-time payment)
- **Mode:** 'payment' (not subscription)
- **Use Case:** Top up credits without changing subscription tier

Location: `netlify/functions/stripe-webhook.ts:32`

**Fuel Pack provides:**
- 20 new games OR
- 100 iterations OR
- Mixed usage (e.g., 10 new games + 50 iterations)

---

## Stripe Price IDs

Current Stripe configuration in `.env.local`:

```env
# Subscription Products
VITE_STRIPE_GAMEDEV_PRICE_ID=price_1SY59kEnWojKMJLwZcrDSspt
VITE_STRIPE_PRO_PRICE_ID=price_1SY5AKEnWojKMJLwfXqFjkUh

# One-time Purchase
VITE_STRIPE_FUEL_PACK_PRICE_ID=price_1SY5AhEnWojKMJLwsbj4UQvb
```

**Note:** These are test mode price IDs. You'll need to create production price IDs before launch.

---

## Usage Examples

### Free Tier User Journey
1. Signs up → Receives 50 credits
2. Creates 1 new game → -50 credits = 0 credits remaining
3. Cannot create more games (limit: 1)
4. Cannot iterate existing game (not allowed on free tier)
5. Must upgrade to GameDev or Pro to continue

### GameDev User Journey
1. Starts on Free with 50 credits
2. Upgrades to GameDev ($9/mo) → +2,500 credits = 2,550 total
3. Creates 5 new games → -250 credits = 2,300 remaining
4. Makes 50 iterations → -500 credits = 1,800 remaining
5. Next month: Subscription renews → +2,500 credits = 4,300 total
6. Running low mid-month → Buys Fuel Pack (+1,000) = 5,300 total

### Pro User Journey
1. Upgrades directly to Pro ($29/mo) → 50 (initial) + 15,000 = 15,050 total
2. Heavy usage: 50 games, 200 iterations → -4,500 credits = 10,550 remaining
3. Still has 10,550 credits for the rest of the month
4. Next month: Auto-refill +15,000 credits

---

## Current Pricing Summary Table

| Item | Credits | Cost | Notes |
|------|---------|------|-------|
| **Initial Signup** | +50 | Free | One-time for all users |
| **GameDev Subscription** | +2,500/mo | $9/mo | Recurring monthly |
| **Pro Subscription** | +15,000/mo | $29/mo | Recurring monthly |
| **Fuel Pack** | +1,000 | $5 | One-time purchase |
| **New Game Generation** | -50 | — | Per game created |
| **Game Iteration** | -10 | — | Per edit/update |

---

## Cost-Benefit Analysis

### Price per Credit
- **GameDev:** $9 ÷ 2,500 = $0.0036 per credit
- **Pro:** $29 ÷ 15,000 = $0.00193 per credit (46% cheaper per credit!)
- **Fuel Pack:** $5 ÷ 1,000 = $0.005 per credit

### Cost per New Game
- **GameDev:** 50 credits × $0.0036 = $0.18 per game
- **Pro:** 50 credits × $0.00193 = $0.0965 per game
- **Fuel Pack:** 50 credits × $0.005 = $0.25 per game

### Cost per Iteration
- **GameDev:** 10 credits × $0.0036 = $0.036 per iteration
- **Pro:** 10 credits × $0.00193 = $0.0193 per iteration
- **Fuel Pack:** 10 credits × $0.005 = $0.05 per iteration

**Conclusion:** Pro tier offers best value per credit (46% savings vs GameDev)

---

## Files Reference

Key files containing pricing logic:

1. **Frontend:**
   - `components/PricingModal.tsx` - UI pricing display
   - `services/stripeClient.ts` - Stripe integration constants
   - `.env.local` - Stripe price IDs

2. **Backend:**
   - `netlify/functions/generate-game.ts` - Credit deduction logic
   - `netlify/functions/stripe-webhook.ts` - Credit refills & tier management
   - `services/storageService.ts` - Cost constants

3. **Database:**
   - `supabase/migrations/001_initial_schema.sql` - User defaults, tier constraints
   - User table default: `credits INTEGER NOT NULL DEFAULT 50`

---

## Notes for Pricing Changes

### To Change Credit Costs:
1. Update `COST_NEW_GAME` and `COST_ITERATION` in:
   - `services/storageService.ts`
   - `netlify/functions/generate-game.ts`

### To Change Monthly Credits:
1. Update `TIER_CREDITS` in `netlify/functions/stripe-webhook.ts`
2. Update UI in `components/PricingModal.tsx` (lines 110, 137)

### To Change Subscription Prices:
1. Create new price in Stripe Dashboard
2. Update price IDs in `.env.local`
3. Update UI display in `components/PricingModal.tsx` (lines 106, 133)

### To Change Fuel Pack:
1. Update `FUEL_PACK_CREDITS` in `netlify/functions/stripe-webhook.ts`
2. Update UI in `components/PricingModal.tsx` (line 159)
3. Create new Stripe price and update `.env.local`

### To Change Initial Credits:
1. Update database default in migration file (requires new migration)
2. Alternative: Update via database trigger or RPC function

---

## Development Mode Notes

**Current State:** Dev mode is enabled for testing
- `DEV_MODE=true` (backend)
- `VITE_DEV_MODE=true` (frontend)

**Impact:**
- ❌ No credit deduction
- ❌ No tier limit checks
- ❌ No authentication requirements

**IMPORTANT:** Remove before production deployment!

Files to update:
1. `.env.local` - Remove DEV_MODE flags
2. `netlify/functions/generate-game.ts` - Remove dev mode bypass code
3. `App.tsx` - Remove dev mode bypass code
