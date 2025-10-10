import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-BROKER-CHECKOUT] ${step}${detailsStr}`);
};

// Helper function to clean up stuck membership records
const cleanupStuckMembership = async (userId: string, supabaseClient: any) => {
  try {
    const { data: stuckMembership } = await supabaseClient
      .from("broker_memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("payment_status", "pending")
      .single();

    if (stuckMembership) {
      // Check if the Stripe session is expired (older than 24 hours)
      const sessionAge = Date.now() - new Date(stuckMembership.created_at).getTime();
      const hoursOld = sessionAge / (1000 * 60 * 60);
      
      if (hoursOld > 24) {
        logStep("Cleaning up expired membership record", { 
          membershipId: stuckMembership.id,
          hoursOld: Math.round(hoursOld)
        });
        
        await supabaseClient
          .from("broker_memberships")
          .delete()
          .eq("id", stuckMembership.id);
          
        return true;
      }
    }
    return false;
  } catch (error) {
    logStep("Error cleaning up stuck membership", { error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
};

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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user already has a PAID broker membership
    const { data: existingMembership, error: membershipError } = await supabaseClient
      .from("broker_memberships")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Only block if there's a paid membership (ignore errors for missing records)
    if (existingMembership && existingMembership.payment_status === 'paid') {
      logStep("User already has paid membership", { 
        membershipId: existingMembership.id,
        paymentStatus: existingMembership.payment_status 
      });
      return new Response(JSON.stringify({ error: "You already have a broker membership" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // If there's a pending membership, check if it's stuck and clean it up
    if (existingMembership && existingMembership.payment_status === 'pending') {
      const wasCleaned = await cleanupStuckMembership(user.id, supabaseClient);
      if (wasCleaned) {
        logStep("Cleaned up stuck membership, proceeding with new checkout");
      } else {
        logStep("Found pending membership, allowing retry", { 
          membershipId: existingMembership.id,
          sessionId: existingMembership.stripe_session_id 
        });
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    // Create checkout session for lifetime broker membership
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: "Broker Lifetime Membership",
              description: "Lifetime access to broker features including deal management, verification badge, and admin support"
            },
            unit_amount: 49900, // $499 lifetime membership (50% discount from $999)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/broker-setup?success=true`,
      cancel_url: `${req.headers.get("origin")}/broker-membership?canceled=true`,
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Create or update broker membership record
    const { error: upsertError } = await supabaseClient.from("broker_memberships").upsert({
      user_id: user.id,
      email: user.email,
      stripe_session_id: session.id,
      payment_status: "pending",
      membership_status: "pending",
      amount: 49900,
      currency: "usd",
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (upsertError) {
      logStep("Error creating/updating membership record", { error: upsertError.message });
      throw new Error(`Failed to create membership record: ${upsertError.message}`);
    }

    logStep("Membership record created/updated successfully", { 
      sessionId: session.id,
      userId: user.id 
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-broker-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});