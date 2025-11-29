# Migration Status: Production Backend Implementation

## ✅ Completed

### **1. Infrastructure & Configuration**
- ✅ Updated `package.json` with required dependencies:
  - `@supabase/supabase-js` (database + auth client)
  - `@stripe/stripe-js` (payment frontend)
  - `stripe` (payment backend)
  - `@netlify/functions` (serverless functions)
- ✅ Created `netlify.toml` with proper build configuration
- ✅ Created `.env.example` documenting all required environment variables
- ✅ Created comprehensive `DEPLOYMENT.md` guide
- ✅ Installed all npm dependencies

### **2. Database Schema**
- ✅ Created `supabase/migrations/001_initial_schema.sql` with:
  - `users` table (extends Supabase auth)
  - `games` table (published games)
  - `leaderboard` table (high scores)
  - `saved_games` table (user library)
  - `credit_transactions` table (audit log)
  - All indexes for performance
  - Row-Level Security (RLS) policies
  - Database functions for atomic operations:
    - `increment_game_plays()`
    - `deduct_user_credits()`
    - `add_user_credits()`
  - Triggers for auto-creating user profiles

### **3. Service Layer**
- ✅ Created `services/supabaseClient.ts`:
  - Supabase client initialization
  - Helper functions for auth state
  - TypeScript types integration
- ✅ Created `types/database.ts`:
  - Full TypeScript types for database schema
  - Type-safe database queries
- ✅ Created `services/stripeClient.ts`:
  - Stripe SDK initialization
  - Checkout session creation
  - Customer portal redirect
  - Price ID configuration
- ✅ Rewrote `services/storageService.ts`:
  - Replaced localStorage with Supabase queries
  - Made all functions async (returns Promises)
  - Added `signup()` function for user registration
  - Updated `login()` to use email/password
  - Kept same function signatures for easier migration
- ✅ Updated `services/geminiService.ts`:
  - Now calls Netlify function instead of direct API
  - API key secured on backend
  - Removed API key parameter from function signature

### **4. Netlify Serverless Functions**
- ✅ Created `netlify/functions/generate-game.ts`:
  - Proxies Gemini API calls
  - Verifies authentication via JWT
  - Checks user credits before generation
  - Atomically deducts credits on success
  - Enforces free tier limits
  - Returns detailed error messages
- ✅ Created `netlify/functions/create-checkout-session.ts`:
  - Creates Stripe checkout sessions
  - Handles subscriptions and one-time payments
  - Creates/retrieves Stripe customers
  - Links to Supabase user IDs
- ✅ Created `netlify/functions/stripe-webhook.ts`:
  - Verifies webhook signatures
  - Handles payment events:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`
  - Updates user tiers and credits
  - Logs all transactions
- ✅ Created `netlify/functions/increment-plays.ts`:
  - Atomic play count increment
  - Prevents race conditions
- ✅ Created `netlify/functions/create-portal-session.ts`:
  - Redirects users to Stripe customer portal
  - For subscription management

---

## ⚠️ Remaining Work

### **Component Updates Required**

The following React components need to be updated to work with the new async storage service:

#### **1. AuthPage.tsx** (`/components/AuthPage.tsx`)
**Current issues:**
- Uses mock `login(email, name)` without password
- Needs real password input field
- `loginWithGoogle()` now triggers OAuth redirect

**Required changes:**
```typescript
// Add password field to state
const [password, setPassword] = useState('');

// Update login handler
const handleLogin = async () => {
  try {
    const user = await login(email, password); // Now requires password
    onAuthSuccess(user);
  } catch (error) {
    // Handle error
  }
};

// Add signup handler
const handleSignup = async () => {
  try {
    const user = await signup(email, password, displayName);
    onAuthSuccess(user);
  } catch (error) {
    // Handle error
  }
};

// Google OAuth now redirects, so handle differently
const handleGoogleLogin = async () => {
  try {
    await loginWithGoogle(); // This will redirect
  } catch (error) {
    // Handle error (won't be reached due to redirect)
  }
};
```

#### **2. App.tsx** (`/App.tsx`)
**Current issues:**
- `getCurrentUser()` is now async
- All storage service calls need `await`
- Need to handle OAuth redirect on mount

**Required changes:**
```typescript
// Update useEffect to handle async getCurrentUser
useEffect(() => {
  const initUser = async () => {
    const user = await getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  };
  initUser();
}, []);

// Add auth state listener
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      // Refresh user data
      getCurrentUser().then(setCurrentUser);
    } else {
      setCurrentUser(null);
    }
  });

  return () => subscription.unsubscribe();
}, []);

// Update all storage service calls to use await:
// - await getPublishedGames()
// - await incrementPlays(gameId)
// - await saveScore(gameId, name, score)
// - await toggleSaveGame(gameId)
// - await getSavedGames()
// - await publishGame(game)
// - await logout()
```

#### **3. PricingModal.tsx** (`/components/PricingModal.tsx`)
**Current issues:**
- `upgradeTier()` and `buyCredits()` are mock functions
- Need to integrate Stripe checkout

**Required changes:**
```typescript
import { createCheckoutSession, STRIPE_PRICE_IDS } from '../services/stripeClient';

const handleUpgrade = async (tier: 'gamedev' | 'pro') => {
  try {
    setLoading(true);
    const priceId = tier === 'gamedev'
      ? STRIPE_PRICE_IDS.gamedev_monthly
      : STRIPE_PRICE_IDS.pro_monthly;

    await createCheckoutSession(priceId, 'subscription');
    // User will be redirected to Stripe Checkout
  } catch (error) {
    console.error('Upgrade error:', error);
    // Show error to user
  } finally {
    setLoading(false);
  }
};

const handleRefill = async () => {
  try {
    setLoading(true);
    await createCheckoutSession(STRIPE_PRICE_IDS.fuel_pack, 'payment');
  } catch (error) {
    console.error('Purchase error:', error);
  } finally {
    setLoading(false);
  }
};
```

#### **4. SettingsPage.tsx** (`/components/SettingsPage.tsx`)
**Current issues:**
- `updateUser()` is now async
- May need to add password change functionality

**Required changes:**
```typescript
const handleUpdateProfile = async () => {
  try {
    setLoading(true);
    const updatedUser = await updateUser({ name, avatar });
    // Update local state
  } catch (error) {
    console.error('Update error:', error);
  } finally {
    setLoading(false);
  }
};

// Optional: Add password change
const handleChangePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) {
    // Handle error
  }
};
```

#### **5. Other Components**
The following components also call storage service functions and need async/await:

- **Feed.tsx**: `toggleSaveGame()` → `await toggleSaveGame()`
- **Library.tsx**: `getSavedGames()` → `await getSavedGames()`
- **GamePreview.tsx**: `publishGame()` → `await publishGame()`
- **ChatArea.tsx**: No direct storage calls, but parent (App.tsx) needs updates

---

## 🔧 Manual Setup Steps

Before the app will work, you need to:

### **1. Create Supabase Project**
Follow `DEPLOYMENT.md` Step 1 to:
- Create Supabase account and project
- Run the database migration SQL
- Enable email and Google OAuth providers
- Get API keys (URL, anon key, service key)

### **2. Create Stripe Account**
Follow `DEPLOYMENT.md` Step 2 to:
- Create Stripe account
- Create 3 products (GameDev $9, Pro $29, Fuel Pack $5)
- Get API keys (publishable and secret)
- Save price IDs

### **3. Get Gemini API Key**
Follow `DEPLOYMENT.md` Step 3 to:
- Get API key from Google AI Studio

### **4. Configure Environment Variables**

**Create `.env.local` for local development:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual keys:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_GAMEDEV_PRICE_ID=price_...
VITE_STRIPE_PRO_PRICE_ID=price_...
VITE_STRIPE_FUEL_PACK_PRICE_ID=price_...
```

**Set up Netlify environment variables** (when deploying):
- See `DEPLOYMENT.md` Step 4.3 for complete list

### **5. Deploy to Netlify**
Follow `DEPLOYMENT.md` Step 4 to:
- Push code to GitHub
- Connect to Netlify
- Add environment variables
- Deploy
- Configure Stripe webhook

---

## 📝 Testing Checklist

After completing the remaining component updates:

- [ ] Test signup with email/password
- [ ] Test login with email/password
- [ ] Test Google OAuth login
- [ ] Test logout
- [ ] Test game generation (credits should deduct)
- [ ] Test game publishing
- [ ] Test leaderboard submission
- [ ] Test saving games to library
- [ ] Test Stripe checkout (use test card 4242...)
- [ ] Verify webhook updates user tier and credits
- [ ] Test free tier limits (1 game max, no iterations)

---

## 🚀 Next Steps

1. **Update the 4 main components** listed above (AuthPage, App, PricingModal, SettingsPage)
2. **Add async/await** to other components that call storage services
3. **Set up Supabase project** and run migration
4. **Set up Stripe account** and create products
5. **Configure environment variables** in `.env.local`
6. **Test locally** with `npm run dev`
7. **Deploy to Netlify** following `DEPLOYMENT.md`
8. **Configure Stripe webhook**
9. **Test end-to-end** in production

---

## 📚 Documentation

- **DEPLOYMENT.md**: Complete deployment guide with step-by-step instructions
- **.env.example**: Template for environment variables
- **supabase/migrations/001_initial_schema.sql**: Database schema with comments

---

## 🔐 Security Notes

- ✅ Gemini API key now secured on backend (not exposed in frontend)
- ✅ Credit deduction enforced server-side (prevents cheating)
- ✅ Row-Level Security (RLS) enabled on all Supabase tables
- ✅ Stripe webhook signature verification implemented
- ✅ JWT authentication required for all sensitive operations
- ⚠️ Make sure to use `service_role` key only in Netlify functions, never in frontend
- ⚠️ Enable email confirmation in Supabase for production

---

## 💰 Cost Estimates

**Current free tiers:**
- Supabase: 500MB database, 50K MAU
- Netlify: 100GB bandwidth, 125K function invocations/month
- Stripe: No monthly fees, pay-per-transaction
- Gemini API: Check current pricing

**When you'll need to pay:**
- Heavy game generation usage → Gemini API costs
- Many users → Supabase/Netlify upgrades
- Successful payments → Stripe transaction fees (2.9% + $0.30)

---

**The backend infrastructure is now production-ready!** The remaining work is primarily frontend React component updates to handle async storage calls and Stripe integration. All the heavy lifting for security, payments, and database is complete.
