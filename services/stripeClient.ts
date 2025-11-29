import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

// Stripe publishable key (safe to expose in frontend)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn(
    'Missing Stripe publishable key. Payment features will not work.\n' +
    'Please set VITE_STRIPE_PUBLISHABLE_KEY in your .env.local file'
  );
}

// Load Stripe instance (lazy loaded)
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise || Promise.resolve(null);
}

// Stripe Product IDs (these will be set in your Stripe dashboard)
// After creating products in Stripe, update these with actual price IDs
export const STRIPE_PRICE_IDS = {
  gamedev_monthly: import.meta.env.VITE_STRIPE_GAMEDEV_PRICE_ID || 'price_gamedev_monthly',
  pro_monthly: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  fuel_pack: import.meta.env.VITE_STRIPE_FUEL_PACK_PRICE_ID || 'price_fuel_pack',
};

// Create a checkout session and redirect to Stripe
export async function createCheckoutSession(
  priceId: string,
  mode: 'subscription' | 'payment' = 'subscription'
): Promise<void> {
  try {
    // Get current session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('You must be logged in to make a purchase');
    }

    // Call our Netlify function to create the checkout session
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        priceId,
        mode,
        successUrl: `${window.location.origin}?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: window.location.origin,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const { url } = await response.json();

    // Redirect to Stripe Checkout using the URL
    if (!url) {
      throw new Error('No checkout URL returned from server');
    }

    // Direct redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Redirect to Stripe Customer Portal for subscription management
export async function redirectToCustomerPortal(): Promise<void> {
  try {
    // Get current session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('You must be logged in to access the customer portal');
    }

    const response = await fetch('/.netlify/functions/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        returnUrl: window.location.origin,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create portal session');
    }

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

export default getStripe;
