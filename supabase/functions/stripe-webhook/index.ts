import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}`, details ? JSON.stringify(details, null, 2) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      logStep('Missing required environment variables');
      return new Response('Missing environment variables', {
        status: 500,
        headers: corsHeaders
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      logStep('Missing Stripe signature');
      return new Response('Missing signature', {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep('Webhook signature verified', { eventType: event.type, eventId: event.id });
    } catch (err) {
      logStep('Webhook signature verification failed', { error: err.message });
      return new Response('Invalid signature', {
        status: 400,
        headers: corsHeaders
      });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabaseClient, stripe);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabaseClient);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object as Stripe.Subscription, supabaseClient);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription, supabaseClient);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.Invoice, supabaseClient);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabaseClient);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer, supabaseClient);
        break;

      default:
        logStep('Unhandled event type', { eventType: event.type });
    }

    return new Response('Webhook processed successfully', {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in stripe-webhook', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Handle subscription creation/updates
async function handleSubscriptionChange(subscription: Stripe.Subscription, supabaseClient: any) {
  logStep('Processing subscription change', { subscriptionId: subscription.id, status: subscription.status });

  const customerId = subscription.customer as string;
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: "2023-10-16" });
  
  // Get customer details
  const customer = await stripe.customers.retrieve(customerId);
  if (!customer || customer.deleted) {
    logStep('Customer not found or deleted', { customerId });
    return;
  }

  const customerEmail = (customer as Stripe.Customer).email;
  if (!customerEmail) {
    logStep('Customer email not found', { customerId });
    return;
  }

  // Determine subscription tier
  let subscriptionTier = 'basic';
  const priceId = subscription.items.data[0]?.price?.id;
  if (priceId) {
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;
    const interval = price.recurring?.interval || 'month';
    
    // Convert to monthly amount for comparison
    const monthlyAmount = interval === 'year' ? Math.round(amount / 10) : amount;
    
    if (monthlyAmount <= 3500) {
      subscriptionTier = 'basic';
    } else if (monthlyAmount <= 9500) {
      subscriptionTier = 'premium';
    } else {
      subscriptionTier = 'enterprise';
    }
  }

  // Get plan limits from database
  const { data: planData } = await supabaseClient
    .from('subscription_plans')
    .select('*')
    .eq('plan_tier', subscriptionTier)
    .eq('is_active', true)
    .single();

  const planLimits = planData || {
    vessel_limit: 10,
    port_limit: 5,
    regions_limit: 1,
    refinery_limit: 5,
    document_access: ['basic'],
    support_level: 'email',
    user_seats: 1,
    api_access: false,
    real_time_analytics: false
  };

  // Check if this is a trial subscription
  const isTrialActive = subscription.status === 'trialing';
  const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;

  // Update subscriber record
  const { error } = await supabaseClient
    .from('subscribers')
    .upsert({
      email: customerEmail,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscribed: subscription.status === 'active' || subscription.status === 'trialing',
      subscription_tier: subscriptionTier,
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
      vessel_limit: planLimits.vessel_limit,
      port_limit: planLimits.port_limit,
      regions_limit: planLimits.regions_limit,
      refinery_limit: planLimits.refinery_limit,
      document_access: planLimits.document_access,
      support_level: planLimits.support_level,
      user_seats: planLimits.user_seats,
      api_access: planLimits.api_access,
      real_time_analytics: planLimits.real_time_analytics,
      is_trial_active: isTrialActive,
      trial_end_date: trialEndDate,
      trial_ending_soon: false, // Reset trial ending flag
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });

  if (error) {
    logStep('Error updating subscriber', { error: error.message, email: customerEmail });
  } else {
    logStep('Subscriber updated successfully', { email: customerEmail, tier: subscriptionTier });
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancellation(subscription: Stripe.Subscription, supabaseClient: any) {
  logStep('Processing subscription cancellation', { subscriptionId: subscription.id });

  const { error } = await supabaseClient
    .from('subscribers')
    .update({
      subscribed: false,
      subscription_tier: null,
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    logStep('Error updating cancelled subscription', { error: error.message });
  } else {
    logStep('Subscription cancellation processed successfully');
  }
}

// Handle successful payment
async function handlePaymentSuccess(invoice: Stripe.Invoice, supabaseClient: any) {
  logStep('Processing payment success', { invoiceId: invoice.id, subscriptionId: invoice.subscription });

  if (invoice.subscription) {
    // Update subscription status to ensure it's active
    const { error } = await supabaseClient
      .from('subscribers')
      .update({
        subscribed: true,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      logStep('Error updating payment success', { error: error.message });
    } else {
      logStep('Payment success processed successfully');
    }
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice, supabaseClient: any) {
  logStep('Processing payment failure', { invoiceId: invoice.id, subscriptionId: invoice.subscription });

  // Note: Don't immediately cancel subscription on first failure
  // Stripe handles retry logic automatically
  logStep('Payment failure logged - Stripe will handle retries');
}

// Handle customer creation
async function handleCustomerCreated(customer: Stripe.Customer, supabaseClient: any) {
  logStep('Processing customer creation', { customerId: customer.id, email: customer.email });

  if (customer.email) {
    // Update subscriber record with Stripe customer ID
    const { error } = await supabaseClient
      .from('subscribers')
      .update({
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString()
      })
      .eq('email', customer.email);

    if (error) {
      logStep('Error updating customer creation', { error: error.message });
    } else {
      logStep('Customer creation processed successfully');
    }
  }
}

// Handle checkout session completion (for trial subscriptions)
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabaseClient: any, stripe: Stripe) {
  logStep('Processing checkout session completion', { sessionId: session.id, mode: session.mode });

  if (session.mode === 'subscription') {
    const customerEmail = session.customer_details?.email || session.metadata?.user_email;
    const userId = session.metadata?.user_id;
    let tier = session.metadata?.tier || 'professional'; // Default to professional for direct checkout
    const isTrialSubscription = session.metadata?.trial_subscription === 'true';
    
    if (!customerEmail) {
      logStep('No customer email found in session', { sessionId: session.id });
      return;
    }

    // Get subscription details
    let subscription: Stripe.Subscription | null = null;
    if (session.subscription) {
      subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    }

    // For direct checkout sessions (without trial metadata), determine tier from subscription amount
    if (!isTrialSubscription && subscription) {
      const subscriptionAmount = subscription.items.data[0]?.price?.unit_amount || 0;
      // Assuming professional plan is around $49/month (4900 cents)
      if (subscriptionAmount >= 4000) {
        tier = 'professional';
      } else if (subscriptionAmount >= 2000) {
        tier = 'premium';
      } else {
        tier = 'basic';
      }
      logStep('Determined tier from subscription amount', { tier, amount: subscriptionAmount });
    }

    // Get plan limits from database
    const { data: planData } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('plan_tier', tier)
      .eq('is_active', true)
      .single();

    const planLimits = planData || {
      vessel_limit: tier === 'professional' ? 100 : 10,
      port_limit: tier === 'professional' ? 50 : 5,
      regions_limit: tier === 'professional' ? 10 : 1,
      refinery_limit: tier === 'professional' ? 50 : 5,
      document_access: tier === 'professional' ? ['basic', 'premium', 'advanced'] : ['basic'],
      support_level: tier === 'professional' ? 'priority' : 'email',
      user_seats: tier === 'professional' ? 10 : 1,
      api_access: tier === 'professional' ? true : false,
      real_time_analytics: tier === 'professional' ? true : false
    };

    // For trial subscriptions, set trial end date
    // For direct paid subscriptions, set subscription end based on billing cycle
    let subscriptionEndDate: string;
    let isTrialActive = false;
    let trialEndDate: string | null = null;

    if (isTrialSubscription) {
      // Trial subscription
      subscriptionEndDate = subscription ? new Date(subscription.trial_end! * 1000).toISOString() : 
                           new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days from now
      isTrialActive = true;
      trialEndDate = subscriptionEndDate;
    } else {
      // Direct paid subscription
      if (subscription) {
        subscriptionEndDate = new Date(subscription.current_period_end * 1000).toISOString();
      } else {
        // Fallback: assume monthly subscription
        subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    // Create or update subscriber record
    const { error } = await supabaseClient
      .from('subscribers')
      .upsert({
        email: customerEmail,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription?.id,
        subscribed: true,
        subscription_tier: tier,
        subscription_end: subscriptionEndDate,
        vessel_limit: planLimits.vessel_limit,
        port_limit: planLimits.port_limit,
        regions_limit: planLimits.regions_limit,
        refinery_limit: planLimits.refinery_limit,
        document_access: planLimits.document_access,
        support_level: planLimits.support_level,
        user_seats: planLimits.user_seats,
        api_access: planLimits.api_access,
        real_time_analytics: planLimits.real_time_analytics,
        is_trial_active: isTrialActive,
        trial_end_date: trialEndDate,
        stripe_session_id: session.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (error) {
      logStep('Error creating/updating subscriber', { error: error.message, email: customerEmail });
    } else {
      logStep('Subscriber created/updated successfully', { 
        email: customerEmail, 
        tier, 
        subscriptionEnd: subscriptionEndDate,
        isTrialActive 
      });
    }
  }
}

// Handle trial will end notification
async function handleTrialWillEnd(subscription: Stripe.Subscription, supabaseClient: any) {
  logStep('Processing trial will end', { subscriptionId: subscription.id });

  // Update subscriber to indicate trial is ending soon
  const { error } = await supabaseClient
    .from('subscribers')
    .update({
      trial_ending_soon: true,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    logStep('Error updating trial will end', { error: error.message });
  } else {
    logStep('Trial will end notification processed successfully');
  }
}