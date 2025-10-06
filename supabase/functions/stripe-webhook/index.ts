import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err instanceof Error ? err.message : 'Signature error' });
        return new Response("Webhook signature verification failed", { status: 400 });
      }
    } else {
      // For development/testing without webhook signature
      event = JSON.parse(body);
      logStep("Processing webhook without signature verification (development mode)");
    }

    logStep("Processing event", { type: event.type, id: event.id });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id });
        
        if (session.subscription) {
          await handleSubscriptionCreated(session, stripe, supabaseClient);
        }
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription event", { 
          type: event.type, 
          subscriptionId: subscription.id,
          status: subscription.status 
        });
        
        await handleSubscriptionUpdate(subscription, stripe, supabaseClient);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });
        
        await handleSubscriptionCancellation(subscription, supabaseClient);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", { 
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription 
        });
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionUpdate(subscription, stripe, supabaseClient);
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { 
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription 
        });
        
        await handlePaymentFailure(invoice, supabaseClient);
        break;
      }
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionCreated(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  supabaseClient: any
) {
  const customer = await stripe.customers.retrieve(session.customer as string);
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  
  const customerEmail = (customer as Stripe.Customer).email;
  if (!customerEmail) {
    logStep("No customer email found for subscription");
    return;
  }

  await updateSubscriberFromStripe(subscription, customerEmail, supabaseClient, stripe);
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  stripe: Stripe,
  supabaseClient: any
) {
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  const customerEmail = (customer as Stripe.Customer).email;
  
  if (!customerEmail) {
    logStep("No customer email found for subscription update");
    return;
  }

  await updateSubscriberFromStripe(subscription, customerEmail, supabaseClient, stripe);
}

async function handleSubscriptionCancellation(
  subscription: Stripe.Subscription,
  supabaseClient: any
) {
  logStep("Handling subscription cancellation", { subscriptionId: subscription.id });
  
  const { error } = await supabaseClient
    .from("subscribers")
    .update({
      subscribed: false,
      subscription_status: 'canceled',
      subscription_end: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    logStep("Error updating cancelled subscription", { error: error.message });
  } else {
    logStep("Successfully cancelled subscription in database");
  }
}

async function handlePaymentFailure(
  invoice: Stripe.Invoice,
  supabaseClient: any
) {
  if (!invoice.subscription) return;
  
  logStep("Handling payment failure", { 
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription 
  });
  
  const { error } = await supabaseClient
    .from("subscribers")
    .update({
      payment_failed_count: supabaseClient.rpc('increment_payment_failures'),
      last_payment_failure: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", invoice.subscription);

  if (error) {
    logStep("Error updating payment failure", { error: error.message });
  }
}

async function updateSubscriberFromStripe(
  subscription: Stripe.Subscription,
  customerEmail: string,
  supabaseClient: any,
  stripe: Stripe
) {
  try {
    // Get price information to determine tier
    const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
    const amount = price.unit_amount || 0;
    const interval = price.recurring?.interval || 'month';
    const monthlyAmount = interval === 'year' ? Math.round(amount / 10) : amount;

    // Determine subscription tier and limits
    let subscriptionTier = 'basic';
    let vesselLimit = 90, portLimit = 30, regionLimit = 4, refineryLimit = 15;
    let documentAccess = ['basic'], supportLevel = 'email', userSeats = 1;
    let apiAccess = false, realTimeAnalytics = false;

    if (monthlyAmount <= 3500) { // Basic: $29.99
      subscriptionTier = "basic";
      vesselLimit = 90; portLimit = 30; regionLimit = 4; refineryLimit = 15;
    } else if (monthlyAmount <= 9500) { // Professional: $89.99
      subscriptionTier = "professional";
      vesselLimit = 180; portLimit = 100; regionLimit = 6; refineryLimit = 70;
      documentAccess = ['basic', 'advanced']; supportLevel = 'priority';
      userSeats = 5; realTimeAnalytics = true;
    } else { // Enterprise: $199.99+
      subscriptionTier = "enterprise";
      vesselLimit = 500; portLimit = 120; regionLimit = 7; refineryLimit = 999;
      documentAccess = ['basic', 'advanced', 'complete']; supportLevel = 'dedicated';
      userSeats = 20; apiAccess = true; realTimeAnalytics = true;
    }

    const subscriptionStatus = subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : subscription.status;
    const isActive = subscriptionStatus === 'active';
    
    // 🔧 FIX: Check if subscription is in trial period
    const isInTrial = subscription.status === 'trialing' || 
                     (subscription.trial_end && new Date(subscription.trial_end * 1000) > new Date());
    
    // 🔧 FIX: Set trial dates correctly
    const trialEndDate = subscription.trial_end ? 
      new Date(subscription.trial_end * 1000).toISOString() : 
      null;

    logStep("Updating subscriber from Stripe", { 
      email: customerEmail,
      tier: subscriptionTier,
      status: subscriptionStatus,
      subscriptionId: subscription.id,
      isInTrial: isInTrial,
      trialEndDate: trialEndDate
    });

    const { error } = await supabaseClient.from("subscribers").upsert({
      email: customerEmail,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      subscribed: isActive,
      subscription_status: subscriptionStatus,
      subscription_tier: subscriptionTier,
      billing_cycle: interval,
      subscription_start_date: new Date(subscription.created * 1000).toISOString(),
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
      vessel_limit: vesselLimit,
      port_limit: portLimit,
      regions_limit: regionLimit,
      refinery_limit: refineryLimit,
      document_access: documentAccess,
      support_level: supportLevel,
      user_seats: userSeats,
      api_access: apiAccess,
      real_time_analytics: realTimeAnalytics,
      // 🔧 FIX: Set trial status correctly based on actual trial state
      is_trial_active: isInTrial,
      trial_used: !isInTrial,
      trial_end_date: trialEndDate,
      unified_trial_end_date: trialEndDate,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    if (error) {
      logStep("Error updating subscriber from webhook", { error: error.message });
    } else {
      logStep("Successfully updated subscriber from webhook", { 
        email: customerEmail,
        tier: subscriptionTier,
        status: subscriptionStatus,
        isInTrial: isInTrial
      });
    }
  } catch (error) {
    logStep("Error in updateSubscriberFromStripe", { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}