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
      logStep("Error parsing request body", { error: parseError instanceof Error ? parseError.message : 'Parse error' });
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


    const { tier, billing_cycle = 'monthly', payment_type = 'subscribe_now', trial_days = 0 } = requestBody;
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

    // Check for active discounts for this plan tier
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
        .eq('is_active', true)
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
        .order('discount_percentage', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (discountData) {
        discountPercentage = discountData.discount_percentage;
        logStep("Discount found", { discountPercentage });
      }
    } catch (discountError) {
      logStep("Error fetching discount, continuing without", { error: discountError instanceof Error ? discountError.message : 'Discount error' });
    }

    // Fetch actual pricing from database
    let monthlyAmount = 2999; // Fallback Basic monthly ($29.99)
    let productName = "PetroDealHub Basic Plan";
    
    try {
      const { data: planData } = await supabaseService
        .from('subscription_plans')
        .select('plan_name, monthly_price, annual_price')
        .eq('plan_tier', tier)
        .eq('is_active', true)
        .maybeSingle();

      if (planData) {
        monthlyAmount = Math.round(planData.monthly_price * 100); // Convert to cents
        productName = planData.plan_name;
        logStep("Dynamic pricing fetched from database", { tier, monthlyAmount, productName });
      } else {
        // Fallback to hardcoded pricing if plan not found in database
        if (tier === 'basic') {
          monthlyAmount = 2999; // Basic: $29.99
          productName = "PetroDealHub Basic Plan";
        } else if (tier === 'professional') {
          monthlyAmount = 8999; // Professional: $89.99
          productName = "PetroDealHub Professional Plan";
        } else if (tier === 'enterprise') {
          monthlyAmount = 19999; // Enterprise: $199.99
          productName = "PetroDealHub Enterprise Plan";
        }
        logStep("Using fallback pricing (plan not found in database)", { tier, monthlyAmount, productName });
      }
    } catch (planError) {
      logStep("Error fetching plan pricing, using fallback", { error: planError instanceof Error ? planError.message : 'Plan error' });
      // Keep the fallback pricing already set above
    }

    // Apply annual discount (2 months free = ~17% discount)
    let unitAmount = monthlyAmount;
    let interval = 'month';
    
    if (billing_cycle === 'annual') {
      // For annual billing, fetch the annual price from database if available
      try {
        const { data: annualPlanData } = await supabaseService
          .from('subscription_plans')
          .select('annual_price')
          .eq('plan_tier', tier)
          .eq('is_active', true)
          .maybeSingle();

        if (annualPlanData && annualPlanData.annual_price) {
          unitAmount = Math.round(annualPlanData.annual_price * 100); // Convert to cents
          logStep("Using database annual pricing", { tier, annualPrice: annualPlanData.annual_price, unitAmount });
        } else {
          // Fallback: 10 months price for 12 months (17% discount)
          unitAmount = Math.round(monthlyAmount * 10);
          logStep("Using fallback annual pricing (17% discount)", { tier, unitAmount });
        }
      } catch (annualError) {
        // Fallback: 10 months price for 12 months (17% discount)
        unitAmount = Math.round(monthlyAmount * 10);
        logStep("Error fetching annual pricing, using fallback", { error: annualError instanceof Error ? annualError.message : 'Annual pricing error' });
      }
      
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

    // Configure subscription options based on payment type
    const subscriptionData: any = {
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: productName,
              description: `PetroDealHub ${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription with 5-day free trial`,
              images: [`${origin}/lovable-uploads/92162cb9-ec10-41e2-bb64-5e35030478d1.png`] // Company logo
            },
            unit_amount: unitAmount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/auth?mode=signup&cancelled=true`,
      // Enable promo codes
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        tier: tier,
        billing_cycle: billing_cycle,
        discount_applied: discountPercentage.toString(),
        user_id: user?.id || 'registration_pending',
        email: userEmail,
        payment_type: payment_type
      },
      // دائماً إضافة فترة تجربة 5 أيام
      subscription_data: {
        trial_period_days: 5,
        metadata: {
          plan_tier: tier,
          billing_cycle: billing_cycle,
          signup_source: 'website'
        }
      }
    };

    const session = await stripe.checkout.sessions.create(subscriptionData);

    logStep("Stripe session created successfully", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      message: "Checkout creation failed. Please try again or contact support if the problem persists."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});