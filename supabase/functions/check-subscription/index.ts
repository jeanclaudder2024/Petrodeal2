import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Get Stripe config based on mode from database
async function getStripeConfig(supabaseClient: any) {
  const { data: configData } = await supabaseClient
    .from('stripe_configuration')
    .select('stripe_mode')
    .single();

  const mode = configData?.stripe_mode === 'live' ? 'live' : 'test';
  
  let secretKey = mode === 'live' 
    ? Deno.env.get("STRIPE_SECRET_KEY_LIVE")
    : Deno.env.get("STRIPE_SECRET_KEY_TEST");

  // Fallback to legacy key
  if (!secretKey) {
    secretKey = Deno.env.get("STRIPE_SECRET_KEY");
    logStep(`Using legacy STRIPE_SECRET_KEY (mode: ${mode})`);
  }

  logStep(`Using Stripe ${mode.toUpperCase()} mode`);
  return { secretKey, mode };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Get Stripe config based on mode
    const { secretKey, mode } = await getStripeConfig(supabaseClient);
    
    if (!secretKey) {
      logStep("Stripe secret key not found, returning no access");
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        trial_active: false,
        trial_days_left: 0,
        access_type: 'none',
        is_locked: false,
        vessel_limit: 0,
        port_limit: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      return new Response(JSON.stringify({ 
        subscribed: false,
        trial_active: false,
        access_type: 'none',
        is_locked: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      logStep("User not authenticated", { error: userError?.message });
      return new Response(JSON.stringify({ 
        subscribed: false,
        trial_active: false,
        access_type: 'none',
        is_locked: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("User authenticated", { email: user.email, mode });

    // Use the new function that includes lock status
    const { data: accessData, error: accessError } = await supabaseClient.rpc('check_user_access_with_lock', {
      user_email: user.email
    });

    // If error or no data found, DO NOT create new trial - return locked/expired status
    if (accessError) {
      logStep("Error checking access", { error: accessError.message });
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        trial_active: false,
        trial_days_left: 0,
        access_type: 'none',
        is_locked: false,
        vessel_limit: 0,
        port_limit: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If no subscriber record found - user needs to be added by admin or complete registration
    if (!accessData || accessData.length === 0) {
      logStep("No subscriber record found - DO NOT auto-create trial");
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        trial_active: false,
        trial_days_left: 0,
        access_type: 'no_subscription',
        is_locked: false,
        vessel_limit: 0,
        port_limit: 0,
        message: 'No subscription found. Please contact admin or subscribe.'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const access = accessData[0];
    logStep("Access data found", { 
      access_type: access.access_type,
      trial_days_left: access.trial_days_left,
      is_subscribed: access.is_subscribed,
      is_locked: access.is_locked
    });

    // If account is locked, return immediately with locked status
    if (access.is_locked) {
      logStep("Account is locked", { reason: access.locked_reason });
      return new Response(JSON.stringify({
        subscribed: false,
        subscription_tier: access.subscription_tier,
        trial_active: false,
        trial_days_left: 0,
        access_type: 'locked',
        is_locked: true,
        locked_reason: access.locked_reason,
        vessel_limit: 0,
        port_limit: 0,
        regions_limit: 0,
        refinery_limit: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If trial expired and not subscribed, lock the account automatically
    if (access.access_type === 'expired' && !access.is_subscribed) {
      logStep("Trial expired - locking account");
      await supabaseClient.rpc('lock_expired_accounts');
      
      return new Response(JSON.stringify({
        subscribed: false,
        subscription_tier: access.subscription_tier,
        trial_active: false,
        trial_days_left: 0,
        access_type: 'locked',
        is_locked: true,
        locked_reason: 'Trial expired - payment required',
        vessel_limit: 0,
        port_limit: 0,
        regions_limit: 0,
        refinery_limit: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Set limits based on subscription tier
    let vesselLimit = 10, portLimit = 20, regionLimit = 1, refineryLimit = 5;
    let documentAccess = ['basic'], supportLevel = 'email', userSeats = 1;
    let apiAccess = false, realTimeAnalytics = false;

    if (access.subscription_tier === 'professional') {
      vesselLimit = 180; portLimit = 100; regionLimit = 6; refineryLimit = 70;
      documentAccess = ['basic', 'advanced']; supportLevel = 'priority';
      userSeats = 5; realTimeAnalytics = true;
    } else if (access.subscription_tier === 'enterprise') {
      vesselLimit = 500; portLimit = 120; regionLimit = 7; refineryLimit = 999;
      documentAccess = ['basic', 'advanced', 'complete']; supportLevel = 'dedicated';
      userSeats = 20; apiAccess = true; realTimeAnalytics = true;
    }

    return new Response(JSON.stringify({
      subscribed: access.is_subscribed,
      subscription_tier: access.subscription_tier,
      trial_active: access.access_type === 'trial',
      trial_days_left: access.trial_days_left,
      access_type: access.access_type,
      trial_end_date: access.trial_end_date,
      is_locked: false,
      vessel_limit: vesselLimit,
      port_limit: portLimit,
      regions_limit: regionLimit,
      refinery_limit: refineryLimit,
      document_access: documentAccess,
      support_level: supportLevel,
      user_seats: userSeats,
      api_access: apiAccess,
      real_time_analytics: realTimeAnalytics,
      stripe_mode: mode
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error in check-subscription", { error: errorMessage });
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      subscribed: false,
      trial_active: false,
      access_type: 'error',
      is_locked: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
