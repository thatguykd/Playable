import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}
if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

// Supabase client (server-side with service role key)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Credit amounts per tier (monthly refills)
const TIER_CREDITS = {
  gamedev: 2500,
  pro: 15000,
};

// One-time credit purchase amount
const FUEL_PACK_CREDITS = 1000;

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // 1. Verify webhook signature
    const signature = event.headers['stripe-signature'];
    if (!signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing stripe-signature header' }),
      };
    }

    let stripeEvent: Stripe.Event;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body!,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Webhook signature verification failed' }),
      };
    }

    // 2. Handle different event types
    console.log(`Processing webhook event: ${stripeEvent.type}`);

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    // 3. Return success
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Webhook processing failed',
        message: error.message || 'Unknown error',
      }),
    };
  }
};

// Handle successful checkout (subscription or one-time payment)
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error('No supabase_user_id in session metadata');
    return;
  }

  if (session.mode === 'subscription') {
    // Subscription checkout - update tier and add credits
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const priceId = subscription.items.data[0].price.id;

    // Determine tier from price ID
    let tier: 'gamedev' | 'pro' = 'gamedev';
    let credits = TIER_CREDITS.gamedev;

    // You'll need to map your actual Stripe price IDs here
    // For now, we'll use metadata or product name to determine tier
    const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
    if (product.name.toLowerCase().includes('pro')) {
      tier = 'pro';
      credits = TIER_CREDITS.pro;
    }

    // Update user tier and subscription info
    await supabase
      .from('users')
      .update({
        tier: tier,
        stripe_subscription_id: subscription.id,
        subscription_status: 'active',
      })
      .eq('id', userId);

    // Add subscription credits
    await supabase.rpc('add_user_credits', {
      user_uuid: userId,
      credit_amount: credits,
      transaction_type: 'subscription_refill',
      transaction_description: `${tier} subscription activated - monthly credit refill`,
      payment_intent_id: session.payment_intent as string,
    });

    console.log(`Subscription activated for user ${userId}: ${tier} tier with ${credits} credits`);
  } else if (session.mode === 'payment') {
    // One-time payment (Fuel Pack)
    await supabase.rpc('add_user_credits', {
      user_uuid: userId,
      credit_amount: FUEL_PACK_CREDITS,
      transaction_type: 'purchase',
      transaction_description: 'Fuel Pack purchase - 1000 credits',
      payment_intent_id: session.payment_intent as string,
    });

    console.log(`One-time credit purchase for user ${userId}: ${FUEL_PACK_CREDITS} credits`);
  }
}

// Handle subscription updates (tier changes, etc.)
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) {
    console.error('No supabase_user_id in subscription metadata');
    return;
  }

  // Determine new tier from price ID
  const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
  let tier: 'gamedev' | 'pro' = 'gamedev';
  if (product.name.toLowerCase().includes('pro')) {
    tier = 'pro';
  }

  // Update subscription status
  let status: 'active' | 'canceled' | 'past_due' = 'active';
  if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
    status = 'canceled';
  } else if (subscription.status === 'past_due') {
    status = 'past_due';
  }

  await supabase
    .from('users')
    .update({
      tier: status === 'active' ? tier : 'free',
      subscription_status: status,
    })
    .eq('id', userId);

  console.log(`Subscription updated for user ${userId}: ${tier} tier, status: ${status}`);
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) {
    console.error('No supabase_user_id in subscription metadata');
    return;
  }

  // Downgrade to free tier
  await supabase
    .from('users')
    .update({
      tier: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
    })
    .eq('id', userId);

  console.log(`Subscription canceled for user ${userId} - downgraded to free tier`);
}

// Handle successful recurring invoice payment (monthly billing)
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Skip if this is the first invoice (already handled by checkout.session.completed)
  if (invoice.billing_reason === 'subscription_create') {
    return;
  }

  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) {
    console.error('No supabase_user_id in subscription metadata');
    return;
  }

  // Determine tier and credits
  const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
  let tier: 'gamedev' | 'pro' = 'gamedev';
  let credits = TIER_CREDITS.gamedev;
  if (product.name.toLowerCase().includes('pro')) {
    tier = 'pro';
    credits = TIER_CREDITS.pro;
  }

  // Refill monthly credits
  await supabase.rpc('add_user_credits', {
    user_uuid: userId,
    credit_amount: credits,
    transaction_type: 'subscription_refill',
    transaction_description: `${tier} subscription renewal - monthly credit refill`,
    payment_intent_id: invoice.payment_intent as string,
  });

  console.log(`Monthly credits refilled for user ${userId}: ${credits} credits`);
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) {
    console.error('No supabase_user_id in subscription metadata');
    return;
  }

  // Update subscription status to past_due
  await supabase
    .from('users')
    .update({
      subscription_status: 'past_due',
    })
    .eq('id', userId);

  console.log(`Payment failed for user ${userId} - marked as past_due`);
}

export { handler };
