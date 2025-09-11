import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SETUP-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get request body
    let requestBody;
    try {
      requestBody = await req.json();
      logStep("Request body parsed", requestBody);
    } catch (parseError) {
      logStep("Error parsing request body", { error: parseError.message });
      throw new Error("Invalid request body - please check your request");
    }

    const { email, user_id } = requestBody;
    if (!email || !user_id) {
      throw new Error("Email and user_id are required for setup session");
    }
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Stripe secret key missing");
      throw new Error("Stripe configuration error - please contact support");
    }
    logStep("Stripe key found");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          supabase_user_id: user_id
        }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create setup session for payment method collection
    const setupSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'setup',
      success_url: `${Deno.env.get("SITE_URL") || "http://localhost:8080"}/auth?mode=register&step=6&trial_setup=success`,
      cancel_url: `${Deno.env.get("SITE_URL") || "http://localhost:8080"}/auth?mode=register&step=5`,
      metadata: {
        user_id: user_id,
        email: email,
        setup_type: 'trial'
      }
    });

    logStep("Setup session created", { sessionId: setupSession.id, url: setupSession.url });

    return new Response(
      JSON.stringify({ url: setupSession.url, session_id: setupSession.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    logStep("Error occurred", { error: error.message });
    console.error("Setup session creation error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to create setup session",
        details: "Please try again or contact support if the issue persists"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});