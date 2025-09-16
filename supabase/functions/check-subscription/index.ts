import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes (upsert) in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("STRIPE_SECRET_KEY not found, returning trial status");
      // Return trial status instead of throwing error
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: 'trial',
        trial_active: true,
        trial_days_left: 5,
        vessel_limit: 10,
        port_limit: 20
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header provided, returning minimal defaults");
      // CRITICAL FIX: Don't assume trial for unauthenticated requests
      // This could be a paid user during auth loading
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null, // Don't assume trial
        trial_active: false,
        trial_days_left: 0,
        vessel_limit: 10,
        port_limit: 20
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    // Create a client with anon key for user authentication
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    // Try to get user, but handle authentication errors gracefully
    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    if (userError) {
      logStep("Authentication error, handling gracefully", { error: userError.message });
      // CRITICAL FIX: Don't assume trial for auth errors - could be paid user with expired token
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null, // Don't assume trial
        trial_active: false,
        trial_days_left: 0,
        vessel_limit: 10,
        port_limit: 20,
        error: "Authentication failed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("No user email available");
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        trial_active: false,
        trial_days_left: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check for existing subscriber record first
    const { data: existingSubscriber, error: subscriberError } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (subscriberError) {
      logStep("Error fetching subscriber", { error: subscriberError.message });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    // CRITICAL FIX: Check for paid subscription FIRST before defaulting to trial
    // If user has a Stripe customer ID, they might be a paid subscriber
    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      logStep("Found Stripe customer, checking for active subscriptions", { customerId });
      
      // Check for active subscriptions immediately
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      // If they have active subscription, process it (skip trial logic)
      if (subscriptions.data.length > 0) {
        logStep("Active subscription found, processing paid subscriber");
        // Continue to subscription processing logic below
      } else {
        logStep("Stripe customer exists but no active subscription");
      }
    }
    
    // Only start trial for completely new users (no Stripe customer AND no existing subscriber)
    if (customers.data.length === 0 && !existingSubscriber) {
      logStep("No customer found, starting trial for new user");
      
      // Start trial period for new users
      const { error: trialError } = await supabaseClient.rpc('start_trial_period', {
        user_email: user.email,
        user_id_param: user.id
      });

      if (trialError) {
        logStep("Error starting trial", { error: trialError.message });
      }

      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: 'trial',
        trial_active: true,
        trial_days_left: 5
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // CRITICAL FIX: Only show trial for users who don't have Stripe customers
    // If user has Stripe customer, prioritize checking their subscription status
    if (existingSubscriber && existingSubscriber.is_trial_active && customers.data.length === 0) {
      const trialEnd = new Date(existingSubscriber.trial_end_date);
      const now = new Date();
      const isTrialExpired = trialEnd < now;
      
      if (!isTrialExpired) {
        const trialDaysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        logStep("Active trial found for non-Stripe user", { 
          trialEnd: existingSubscriber.trial_end_date,
          trialDaysLeft 
        });
        
        return new Response(JSON.stringify({
          subscribed: false,
          subscription_tier: 'trial',
          trial_active: true,
          trial_days_left: trialDaysLeft,
          subscription_end: existingSubscriber.trial_end_date
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        logStep("Trial expired, updating subscriber status");
        await supabaseClient.from("subscribers").update({
          is_trial_active: false,
          subscription_tier: null,
          updated_at: new Date().toISOString(),
        }).eq("email", user.email);
      }
    }

    // If no Stripe customer and trial is expired/doesn't exist, return no access
    if (customers.data.length === 0) {
      logStep("No customer and no active trial");
      return new Response(JSON.stringify({ 
        subscribed: false,
        trial_active: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle Stripe customers with subscriptions
    const customerId = customers.data[0].id;
    logStep("Processing Stripe customer subscription status", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;
    let vesselLimit = 10;
    let portLimit = 5;
    let regionLimit = 1;
    let refineryLimit = 5;
    let documentAccess = ['basic'];
    let supportLevel = 'email';
    let userSeats = 1;
    let apiAccess = false;
    let realTimeAnalytics = false;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Get subscription tier from Stripe metadata or price lookup
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      const interval = price.recurring?.interval || 'month';
      
      // First try to get tier from subscription metadata
      if (subscription.metadata?.tier) {
        subscriptionTier = subscription.metadata.tier;
        logStep("Found tier in subscription metadata", { subscriptionTier });
      } else {
        // Fallback: determine tier from price amount
        const monthlyAmount = interval === 'year' ? Math.round(amount / 10) : amount;
        
        if (monthlyAmount <= 3500) {
          subscriptionTier = "basic";
        } else if (monthlyAmount <= 9500) {
          subscriptionTier = "premium";
        } else {
          subscriptionTier = "enterprise";
        }
        logStep("Determined tier from price", { priceId, amount, monthlyAmount, subscriptionTier });
      }
      
      // Get subscription plan details from database
      try {
        const { data: planData } = await supabaseClient
          .from('subscription_plans')
          .select('*')
          .eq('plan_tier', subscriptionTier)
          .eq('is_active', true)
          .single();
          
        if (planData) {
          vesselLimit = planData.vessel_limit;
          portLimit = planData.port_limit;
          regionLimit = planData.regions_limit;
          refineryLimit = planData.refinery_limit;
          documentAccess = planData.document_access || ['basic'];
          supportLevel = planData.support_level;
          userSeats = planData.user_seats;
          apiAccess = planData.api_access;
          realTimeAnalytics = planData.real_time_analytics;
          logStep("Applied plan limits from database", { planData });
        } else {
          logStep("No plan found in database, using defaults", { subscriptionTier });
        }
      } catch (planError) {
        logStep("Error fetching plan data, using defaults", { error: planError.message });
      }
    } else {
      logStep("No active subscription found");
    }

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      vessel_limit: vesselLimit,
      port_limit: portLimit,
      regions_limit: regionLimit,
      refinery_limit: refineryLimit,
      document_access: documentAccess,
      support_level: supportLevel,
      user_seats: userSeats,
      api_access: apiAccess,
      real_time_analytics: realTimeAnalytics,
      // Preserve trial data if it exists
      trial_start_date: existingSubscriber?.trial_start_date || null,
      trial_end_date: existingSubscriber?.trial_end_date || null,
      is_trial_active: hasActiveSub ? false : (existingSubscriber?.is_trial_active || false),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      vessel_limit: vesselLimit,
      port_limit: portLimit,
      regions_limit: regionLimit,
      refinery_limit: refineryLimit,
      document_access: documentAccess,
      support_level: supportLevel,
      user_seats: userSeats,
      api_access: apiAccess,
      real_time_analytics: realTimeAnalytics,
      trial_active: existingSubscriber?.is_trial_active || false,
      trial_days_left: existingSubscriber?.trial_end_date ? 
        Math.max(0, Math.ceil((new Date(existingSubscriber.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});