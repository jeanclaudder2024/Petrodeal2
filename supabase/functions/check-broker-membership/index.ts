import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-BROKER-MEMBERSHIP] ${step}${detailsStr}`);
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

  if (!secretKey) {
    throw new Error(`Stripe secret key not configured for ${mode} mode`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email, mode });

    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

    // FIRST: Check if user has broker subscription activated in subscribers table (admin manual activation)
    const { data: subscriberData } = await supabaseClient
      .from("subscribers")
      .select("has_broker_subscription")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriberData?.has_broker_subscription === true) {
      logStep("Broker subscription active via admin activation");
      return new Response(JSON.stringify({
        has_membership: true,
        payment_status: 'paid',
        membership_status: 'active',
        verification_status: 'pending',
        source: 'admin_activation'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // SECOND: Check broker_memberships table for payment-based membership
    const { data: membership } = await supabaseClient
      .from("broker_memberships")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      logStep("No membership found");
      return new Response(JSON.stringify({ 
        has_membership: false,
        payment_status: null,
        membership_status: null,
        verification_status: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If we have a Stripe session, check its status
    if (membership.stripe_session_id && membership.payment_status === 'pending') {
      try {
        const session = await stripe.checkout.sessions.retrieve(membership.stripe_session_id);
        logStep("Retrieved Stripe session", { sessionId: session.id, paymentStatus: session.payment_status });

        if (session.payment_status === 'paid' && membership.payment_status !== 'paid') {
          // Update membership to paid
          await supabaseClient
            .from("broker_memberships")
            .update({
              payment_status: 'paid',
              membership_status: 'active',
              payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

          // Also update subscribers table
          await supabaseClient
            .from("subscribers")
            .update({
              has_broker_subscription: true,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", user.id);

          logStep("Updated membership to paid");
          
          return new Response(JSON.stringify({
            has_membership: true,
            payment_status: 'paid',
            membership_status: 'active',
            verification_status: membership.verification_status
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } catch (stripeError) {
        logStep("Error checking Stripe session", { error: stripeError });
      }
    }

    logStep("Returning membership status", { 
      has_membership: membership.payment_status === 'paid',
      payment_status: membership.payment_status,
      membership_status: membership.membership_status,
      verification_status: membership.verification_status
    });

    return new Response(JSON.stringify({
      has_membership: membership.payment_status === 'paid',
      payment_status: membership.payment_status,
      membership_status: membership.membership_status,
      verification_status: membership.verification_status
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-broker-membership", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
