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
      logStep("No authorization header provided, returning default trial");
      // For unauthenticated users, return basic trial info
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
      // Return trial status for authentication errors instead of failing
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: 'trial',
        trial_active: true,
        trial_days_left: 5,
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

    // Check for existing subscriber record first - prioritize database over Stripe
    const { data: existingSubscriber, error: subscriberError } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (subscriberError) {
      logStep("Error fetching subscriber", { error: subscriberError.message });
    } else if (existingSubscriber) {
      logStep("Found existing subscriber in database", { 
        subscribed: existingSubscriber.subscribed,
        tier: existingSubscriber.subscription_tier,
        stripeId: existingSubscriber.stripe_subscription_id,
        trial_used: existingSubscriber.trial_used,
        unified_trial_end: existingSubscriber.unified_trial_end_date
      });

      // If user has active paid subscription in database, return it immediately
      if (existingSubscriber.subscribed && existingSubscriber.subscription_status === 'active') {
        logStep("Returning active subscription from database");
        
        return new Response(JSON.stringify({
          subscribed: true,
          subscription_tier: existingSubscriber.subscription_tier,
          subscription_end: existingSubscriber.subscription_end,
          subscription_status: existingSubscriber.subscription_status,
          vessel_limit: existingSubscriber.vessel_limit || 90,
          port_limit: existingSubscriber.port_limit || 30,
          regions_limit: existingSubscriber.regions_limit || 4,
          refinery_limit: existingSubscriber.refinery_limit || 15,
          document_access: existingSubscriber.document_access || ['basic'],
          support_level: existingSubscriber.support_level || 'email',
          user_seats: existingSubscriber.user_seats || 1,
          api_access: existingSubscriber.api_access || false,
          real_time_analytics: existingSubscriber.real_time_analytics || false,
          trial_active: false,
          trial_days_left: 0,
          trial_used: existingSubscriber.trial_used || false
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Check if user has active trial (check unified_trial_end_date first, then regular trial)
      const now = new Date();
      
      // Check unified trial (subscription trial)
      if (existingSubscriber.unified_trial_end_date) {
        const unifiedTrialEnd = new Date(existingSubscriber.unified_trial_end_date);
        const isUnifiedTrialActive = unifiedTrialEnd > now && !existingSubscriber.subscribed;
        
        if (isUnifiedTrialActive) {
          const trialDaysLeft = Math.ceil((unifiedTrialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          logStep("Active unified trial found", { 
            trialEnd: existingSubscriber.unified_trial_end_date,
            trialDaysLeft 
          });
          
          return new Response(JSON.stringify({
            subscribed: false,
            subscription_tier: existingSubscriber.subscription_tier || 'trial',
            trial_active: true,
            trial_days_left: trialDaysLeft,
            subscription_end: existingSubscriber.unified_trial_end_date,
            vessel_limit: 10,
            port_limit: 20,
            regions_limit: 1,
            refinery_limit: 5,
            trial_used: false
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else if (unifiedTrialEnd <= now) {
          // Unified trial expired, mark as expired
          logStep("Unified trial expired, updating status");
          await supabaseClient.from("subscribers").update({
            is_trial_active: false,
            subscription_status: 'expired',
            updated_at: new Date().toISOString(),
          }).eq("email", user.email);
        }
      }

      // Check regular trial if no unified trial
      if (existingSubscriber.is_trial_active && existingSubscriber.trial_end_date && !existingSubscriber.trial_used) {
        const trialEnd = new Date(existingSubscriber.trial_end_date);
        const isTrialExpired = trialEnd < now;
        
        if (!isTrialExpired) {
          const trialDaysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          logStep("Active regular trial found", { 
            trialEnd: existingSubscriber.trial_end_date,
            trialDaysLeft 
          });
          
          return new Response(JSON.stringify({
            subscribed: false,
            subscription_tier: 'trial',
            trial_active: true,
            trial_days_left: trialDaysLeft,
            subscription_end: existingSubscriber.trial_end_date,
            vessel_limit: 10,
            port_limit: 20,
            regions_limit: 1,
            refinery_limit: 5,
            trial_used: false
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          logStep("Regular trial expired, updating subscriber status");
          await supabaseClient.from("subscribers").update({
            is_trial_active: false,
            subscription_tier: null,
            trial_used: true,
            subscription_status: 'expired',
            updated_at: new Date().toISOString(),
          }).eq("email", user.email);
        }
      }

      // If user has used their trial or trial is expired, don't offer trial again
      if (existingSubscriber.trial_used || 
          (existingSubscriber.unified_trial_end_date && new Date(existingSubscriber.unified_trial_end_date) <= now)) {
        logStep("Trial already used or expired, no access");
        return new Response(JSON.stringify({ 
          subscribed: false,
          trial_active: false,
          trial_used: true,
          access_type: 'expired'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
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

    // Check if user has active trial (no Stripe customer needed)
    if (existingSubscriber && existingSubscriber.is_trial_active) {
      const trialEnd = new Date(existingSubscriber.trial_end_date);
      const now = new Date();
      const isTrialExpired = trialEnd < now;
      
      if (!isTrialExpired) {
        const trialDaysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        logStep("Active trial found", { 
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
    logStep("Found Stripe customer for subscription check", { customerId });

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
      
      // Determine subscription tier from price amount (considering both monthly and annual)
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      const interval = price.recurring?.interval || 'month';
      
      // Normalize to monthly amount for comparison
      const monthlyAmount = interval === 'year' ? Math.round(amount / 10) : amount;
      
      // Fetch subscription plan data from database to determine tier and limits
      let tierDetermined = false;
      try {
        const { data: planData } = await supabaseClient
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('monthly_price', { ascending: true });

        if (planData && planData.length > 0) {
          // Find the matching plan based on price (convert monthly prices to cents for comparison)
          const matchingPlan = planData.find(plan => {
            const planMonthlyAmountCents = Math.round(plan.monthly_price * 100);
            const planAnnualAmountCents = Math.round(plan.annual_price * 100);
            
            if (interval === 'month') {
              return Math.abs(amount - planMonthlyAmountCents) <= 100; // Allow 1 cent tolerance
            } else {
              return Math.abs(amount - planAnnualAmountCents) <= 100; // Allow 1 cent tolerance
            }
          });

          if (matchingPlan) {
            subscriptionTier = matchingPlan.plan_tier;
            vesselLimit = matchingPlan.vessel_limit || 10;
            portLimit = matchingPlan.port_limit || 5;
            regionLimit = matchingPlan.regions_limit || 1;
            refineryLimit = matchingPlan.refinery_limit || 5;
            documentAccess = matchingPlan.document_access || ['basic'];
            supportLevel = matchingPlan.support_level || 'email';
            userSeats = matchingPlan.user_seats || 1;
            apiAccess = matchingPlan.api_access || false;
            realTimeAnalytics = matchingPlan.real_time_analytics || false;
            tierDetermined = true;
            logStep("Tier determined from database plan", { planTier: matchingPlan.plan_tier, priceId, amount });
          }
        }
      } catch (planError) {
        logStep("Error fetching plan data, using fallback tier determination", { error: planError instanceof Error ? planError.message : 'Plan error' });
      }

      // Fallback tier determination if database lookup failed
      if (!tierDetermined) {
        if (monthlyAmount <= 3500) { // Up to $35 monthly (Basic: $29.99)
          subscriptionTier = "basic";
          vesselLimit = 90;
          portLimit = 30;
          regionLimit = 4;
          refineryLimit = 15;
          documentAccess = ['basic'];
          supportLevel = 'email';
          userSeats = 1;
          apiAccess = false;
          realTimeAnalytics = false;
        } else if (monthlyAmount <= 9500) { // Up to $95 monthly (Professional: $89.99)
          subscriptionTier = "professional";
          vesselLimit = 180;
          portLimit = 100;
          regionLimit = 6;
          refineryLimit = 70;
          documentAccess = ['basic', 'advanced'];
          supportLevel = 'priority';
          userSeats = 5;
          apiAccess = false;
          realTimeAnalytics = true;
        } else { // Enterprise: $199.99+
          subscriptionTier = "enterprise";
          vesselLimit = 500;
          portLimit = 120;
          regionLimit = 7;
          refineryLimit = 999;
          documentAccess = ['basic', 'advanced', 'complete'];
          supportLevel = 'dedicated';
          userSeats = 20;
          apiAccess = true;
          realTimeAnalytics = true;
        }
        logStep("Using fallback tier determination", { monthlyAmount, subscriptionTier });
      }
      logStep("Determined subscription tier", { priceId, amount, monthlyAmount, subscriptionTier });
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