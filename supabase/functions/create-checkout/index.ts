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
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create a Supabase client using the anon key for auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    let user = null;
    let userEmail = null;

    // Check if this is an authenticated request
    if (authHeader && authHeader !== "Bearer null" && authHeader !== "Bearer undefined") {
      const token = authHeader.replace("Bearer ", "");
      logStep("Getting user from token");
      
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError) {
        logStep("Authentication error", { error: userError.message });
        // Don't throw error for registration flow - continue without auth
      } else if (userData.user?.email) {
        user = userData.user;
        userEmail = user.email;
        logStep("User authenticated", { userId: user.id, email: user.email });
      }
    }

    // Get request body to check for email (for registration flow)
    let requestBody;
    try {
      requestBody = await req.json();
      logStep("Request body parsed", requestBody);
    } catch (parseError) {
      logStep("Error parsing request body", { error: parseError.message });
      throw new Error("Invalid request body - please check your request");
    }

    // For registration flow, get email from request body
    if (!userEmail && requestBody.email) {
      userEmail = requestBody.email;
      logStep("Using email from registration flow", { email: userEmail });
    }

    if (!userEmail) {
      logStep("No user email found");
      throw new Error("User email required for checkout");
    }


    const { tier, billing_cycle = 'monthly' } = requestBody;
    if (!tier) {
      throw new Error("Subscription tier is required");
    }
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Stripe secret key missing");
      throw new Error("Stripe configuration error - please contact support");
    }
    logStep("Stripe key found");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found, will create during checkout");
    }

    // Check for active discounts for this plan tier and billing cycle
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let discountPercentage = 0;
    try {
      const { data: discountData } = await supabaseService
        .from('subscription_discounts')
        .select('discount_percentage')
        .eq('plan_tier', tier)
        .eq('billing_cycle', billing_cycle)
        .eq('is_active', true)
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
        .order('discount_percentage', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (discountData) {
        discountPercentage = discountData.discount_percentage;
        logStep("Discount found", { discountPercentage, billing_cycle });
      }
    } catch (discountError) {
      logStep("Error fetching discount, continuing without", { error: discountError.message });
    }

    // Get pricing and plan details from subscription_plans table
    let monthlyAmount = 2999; // Default fallback
    let productName = "PetroDealHub Subscription";
    
    try {
      const { data: planData } = await supabaseService
        .from('subscription_plans')
        .select('*')
        .eq('plan_tier', tier)
        .eq('is_active', true)
        .single();
        
      if (planData) {
        monthlyAmount = Math.round(planData.monthly_price * 100); // Convert to cents
        productName = planData.plan_name;
        logStep("Plan data found", { tier, monthlyAmount, productName, planData });
      } else {
        logStep("No plan found in database, using fallback pricing", { tier });
        // Fallback pricing if plan not found
        if (tier === 'basic') {
          monthlyAmount = 2999;
          productName = "PetroDealHub Basic Plan";
        } else if (tier === 'premium') {
          monthlyAmount = 8999;
          productName = "PetroDealHub Premium Plan";
        } else if (tier === 'enterprise') {
          monthlyAmount = 19999;
          productName = "PetroDealHub Enterprise Plan";
        }
      }
    } catch (planError) {
      logStep("Error fetching plan data, using fallback", { error: planError.message });
      // Use fallback pricing
      if (tier === 'basic') {
        monthlyAmount = 2999;
        productName = "PetroDealHub Basic Plan";
      } else if (tier === 'premium') {
        monthlyAmount = 8999;
        productName = "PetroDealHub Premium Plan";
      } else if (tier === 'enterprise') {
        monthlyAmount = 19999;
        productName = "PetroDealHub Enterprise Plan";
      }
    }
    logStep("Pricing determined", { tier, monthlyAmount, productName });

    // Apply annual discount (2 months free = ~17% discount)
    let unitAmount = monthlyAmount;
    let interval = 'month';
    
    if (billing_cycle === 'annual') {
      unitAmount = Math.round(monthlyAmount * 10); // 10 months price for 12 months
      interval = 'year';
      productName += ' (Annual)';
    }

    // Apply admin discount if available
    if (discountPercentage > 0) {
      unitAmount = Math.round(unitAmount * (100 - discountPercentage) / 100);
      productName += ` (${discountPercentage}% OFF)`;
    }
    logStep("Final pricing", { unitAmount, interval, discountPercentage });

    const origin = req.headers.get("origin") || "https://preview--aivessel-trade-flow.lovable.app";
    logStep("Creating Stripe session", { origin });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: productName,
              description: `MaritimeAI ${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription`
            },
            unit_amount: unitAmount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/payment-success?success=true`,
      cancel_url: `${origin}/auth?mode=signup&cancelled=true`,
      metadata: {
        tier: tier,
        billing_cycle: billing_cycle,
        discount_applied: discountPercentage.toString(),
        user_id: user?.id || 'registration_pending',
        email: userEmail
      },
      subscription_data: {
        metadata: {
          tier: tier,
          billing_cycle: billing_cycle,
          user_id: user?.id || 'registration_pending',
          email: userEmail
        }
      }
    });

    logStep("Stripe session created successfully", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage, stack: error?.stack });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      message: "Checkout creation failed. Please try again or contact support if the problem persists."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});