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
  console.log(`[CREATE-TRIAL-CHECKOUT] ${step}${detailsStr}`);
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

    const { email, user_id, billing_cycle = 'monthly' } = requestBody;
    if (!email || !user_id) {
      throw new Error("Email and user_id are required for trial checkout");
    }
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Stripe secret key missing");
      throw new Error("Stripe configuration error - please contact support");
    }
    logStep("Stripe key found");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }
    
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get Basic plan pricing from database
    const { data: planData } = await supabaseService
      .from('subscription_plans')
      .select('*')
      .eq('plan_tier', 'basic')
      .eq('is_active', true)
      .single();
    
    if (!planData) {
      throw new Error("Basic plan not found in database");
    }
    
    const monthlyAmount = Math.round(planData.monthly_price * 100); // Convert to cents
    const finalAmount = billing_cycle === 'annual' ? monthlyAmount * 12 : monthlyAmount;
    
    logStep("Plan data retrieved", { 
      planTier: 'basic', 
      monthlyAmount, 
      finalAmount, 
      billing_cycle 
    });
    
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

    const origin = req.headers.get("origin") || "https://preview--aivessel-trade-flow.lovable.app";
    
    // Create checkout session with $0 trial and future subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planData.plan_name} - 5-Day Free Trial`,
              description: `Free trial for 5 days, then ${billing_cycle === 'annual' ? 'annual' : 'monthly'} billing at $${planData.monthly_price}${billing_cycle === 'annual' ? '/year' : '/month'}`,
            },
            unit_amount: finalAmount,
            recurring: {
              interval: billing_cycle === 'annual' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 5, // 5-day free trial
        metadata: {
          user_id: user_id,
          user_email: email,
          tier: 'basic',
          billing_cycle: billing_cycle,
          trial_subscription: 'true'
        },
      },
      success_url: `${origin}/auth?mode=register&step=6&trial_payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/auth?mode=register&step=5&cancelled=true`,
      metadata: {
        user_id: user_id,
        user_email: email,
        tier: 'basic',
        billing_cycle: billing_cycle,
        trial_subscription: 'true'
      },
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    });

    logStep("Trial checkout session created", { 
      sessionId: session.id, 
      url: session.url,
      subscriptionId: session.subscription 
    });

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        session_id: session.id,
        subscription_id: session.subscription 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    logStep("Error occurred", { error: error.message });
    console.error("Trial checkout creation error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to create trial checkout",
        details: "Please try again or contact support if the issue persists"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});