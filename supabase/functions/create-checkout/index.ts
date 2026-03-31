import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

async function getStripeConfig(supabaseClient: any) {
  const { data: configData } = await supabaseClient
    .from('stripe_configuration')
    .select('stripe_mode')
    .single();

  const mode = configData?.stripe_mode === 'live' ? 'live' : 'test';
  
  let secretKey = mode === 'live' 
    ? Deno.env.get("STRIPE_SECRET_KEY_LIVE")
    : Deno.env.get("STRIPE_SECRET_KEY_TEST");

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

// Map plan tier to human-readable product name
function productNameForTier(tier: string): string {
  const map: Record<string, string> = {
    basic: "PetroDealHub Basic Plan",
    professional: "PetroDealHub Professional Plan",
    enterprise: "PetroDealHub Enterprise Plan",
  };
  return map[tier] || `PetroDealHub ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`;
}

// Find or create a persistent Stripe product for the plan tier
async function findOrCreateProduct(stripe: Stripe, tier: string, description: string): Promise<string> {
  const name = productNameForTier(tier);

  const products = await stripe.products.search({
    query: `name:"${name}" AND active:"true"`,
    limit: 1,
  });

  if (products.data.length > 0) {
    logStep("Found existing product", { tier, productId: products.data[0].id });
    return products.data[0].id;
  }

  const product = await stripe.products.create({
    name,
    description,
    metadata: { plan_tier: tier },
  });

  logStep("Created new product", { tier, productId: product.id });
  return product.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    let user = null;
    let userEmail = null;

    if (authHeader && authHeader !== "Bearer null" && authHeader !== "Bearer undefined") {
      const token = authHeader.replace("Bearer ", "");
      logStep("Getting user from token");
      
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError) {
        logStep("Authentication error", { error: userError.message });
      } else if (userData.user?.email) {
        user = userData.user;
        userEmail = user.email;
        logStep("User authenticated", { userId: user.id, email: user.email });
      }
    }

    let requestBody;
    try {
      requestBody = await req.json();
      logStep("Request body parsed", requestBody);
    } catch (parseError) {
      logStep("Error parsing request body", { error: parseError instanceof Error ? parseError.message : 'Parse error' });
      throw new Error("Invalid request body - please check your request");
    }

    if (!userEmail && requestBody.email) {
      userEmail = requestBody.email;
      logStep("Using email from registration flow", { email: userEmail });
    }

    if (!userEmail) {
      logStep("No user email found");
      throw new Error("User email required for checkout");
    }

    const { tier, billing_cycle = 'monthly', payment_type = 'subscribe_now', trial_days = 0, special_promo_code } = requestBody;
    if (!tier) {
      throw new Error("Subscription tier is required");
    }

    // Check for special promo code
    let specialPromo: any = null;
    if (special_promo_code) {
      logStep("Checking special promo code", { code: special_promo_code });
      const supabaseServiceEarly = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );
      const { data: promoData } = await supabaseServiceEarly
        .from('special_promo_codes')
        .select('*')
        .eq('code', special_promo_code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (promoData) {
        // Validate plan tier
        if (promoData.plan_tier !== tier) {
          logStep("Special promo not valid for this plan", { promoTier: promoData.plan_tier, requestedTier: tier });
        } else if (promoData.valid_until && new Date(promoData.valid_until) < new Date()) {
          logStep("Special promo expired", { valid_until: promoData.valid_until });
        } else if (promoData.max_redemptions && promoData.redemption_count >= promoData.max_redemptions) {
          logStep("Special promo max redemptions reached");
        } else {
          specialPromo = promoData;
          logStep("Valid special promo found", { code: promoData.code, discount: promoData.discount_percentage, months: promoData.free_months });
        }
      } else {
        logStep("Special promo code not found or inactive");
      }
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { secretKey, mode } = await getStripeConfig(supabaseService);
    logStep("Stripe key found", { mode });

    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
    
    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found, will create during checkout");
    }

    let discountPercentage = 0;
    try {
      const { data: discountData } = await supabaseService
        .from('subscription_discounts')
        .select('discount_percentage')
        .in('plan_tier', [tier, 'all'])
        .eq('is_active', true)
        .is('stripe_promo_code_id', null)
        .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
        .order('discount_percentage', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (discountData) {
        discountPercentage = discountData.discount_percentage;
        logStep("Subscription discount found", { discountPercentage });
      }

      const now = new Date().toISOString();
      const { data: promoData } = await supabaseService
        .from('promotion_frames')
        .select('discount_type, discount_value, eligible_plans, billing_cycle')
        .eq('is_active', true)
        .eq('show_on_subscription', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gt.${now}`)
        .order('discount_value', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (promoData && promoData.eligible_plans?.includes(tier)) {
        const promoDiscount = promoData.discount_type === 'percentage' ? promoData.discount_value : 0;
        if (promoDiscount > discountPercentage) {
          discountPercentage = promoDiscount;
          logStep("Promotion frame discount found (higher)", { discountPercentage });
        }
      }
    } catch (discountError) {
      logStep("Error fetching discount, continuing without", { error: discountError instanceof Error ? discountError.message : 'Discount error' });
    }

    // Fetch actual pricing from database
    let monthlyAmount = 2999;
    let productName = "PetroDealHub Basic Plan";
    
    try {
      const { data: planData } = await supabaseService
        .from('subscription_plans')
        .select('plan_name, monthly_price, annual_price')
        .eq('plan_tier', tier)
        .eq('is_active', true)
        .maybeSingle();

      if (planData) {
        monthlyAmount = Math.round(planData.monthly_price * 100);
        productName = planData.plan_name;
        logStep("Dynamic pricing fetched from database", { tier, monthlyAmount, productName });
      } else {
        if (tier === 'basic') {
          monthlyAmount = 2999;
          productName = "PetroDealHub Basic Plan";
        } else if (tier === 'professional') {
          monthlyAmount = 8999;
          productName = "PetroDealHub Professional Plan";
        } else if (tier === 'enterprise') {
          monthlyAmount = 19999;
          productName = "PetroDealHub Enterprise Plan";
        }
        logStep("Using fallback pricing (plan not found in database)", { tier, monthlyAmount, productName });
      }
    } catch (planError) {
      logStep("Error fetching plan pricing, using fallback", { error: planError instanceof Error ? planError.message : 'Plan error' });
    }

    // Apply annual discount
    let unitAmount = monthlyAmount;
    let interval = 'month';
    
    if (billing_cycle === 'annual') {
      try {
        const { data: annualPlanData } = await supabaseService
          .from('subscription_plans')
          .select('annual_price')
          .eq('plan_tier', tier)
          .eq('is_active', true)
          .maybeSingle();

        if (annualPlanData && annualPlanData.annual_price) {
          unitAmount = Math.round(annualPlanData.annual_price * 100);
          logStep("Using database annual pricing", { tier, annualPrice: annualPlanData.annual_price, unitAmount });
        } else {
          unitAmount = Math.round(monthlyAmount * 10);
          logStep("Using fallback annual pricing (17% discount)", { tier, unitAmount });
        }
      } catch (annualError) {
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

    // Find or create a persistent Stripe product for this tier
    const productDescription = `PetroDealHub ${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription with 5-day free trial`;
    const productId = await findOrCreateProduct(stripe, tier, productDescription);

    const origin = req.headers.get("origin") || "https://preview--aivessel-trade-flow.lovable.app";
    logStep("Creating Stripe session", { origin, mode });

    const subscriptionData: any = {
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product: productId,
            unit_amount: unitAmount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/auth?mode=signup&cancelled=true`,
      billing_address_collection: 'auto',
      metadata: {
        tier: tier,
        plan_tier: tier,
        billing_cycle: billing_cycle,
        discount_applied: discountPercentage.toString(),
        user_id: user?.id || 'registration_pending',
        email: userEmail,
        payment_type: payment_type,
        stripe_mode: mode,
      },
      subscription_data: {
        trial_period_days: specialPromo ? undefined : 5,
        metadata: {
          plan_tier: tier,
          billing_cycle: billing_cycle,
          signup_source: 'website',
          ...(specialPromo ? { special_promo_code: specialPromo.code, special_promo_months: specialPromo.free_months.toString() } : {})
        }
      }
    };

    if (specialPromo && specialPromo.stripe_promo_code_id) {
      // Attach the special promo discount directly — no trial, coupon pre-applied
      subscriptionData.discounts = [{ promotion_code: specialPromo.stripe_promo_code_id }];
      logStep("Applied special promo to session", { code: specialPromo.code, stripePromoId: specialPromo.stripe_promo_code_id });

      // Increment redemption count
      const supabaseServiceUpdate = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );
      await supabaseServiceUpdate
        .from('special_promo_codes')
        .update({ redemption_count: (specialPromo.redemption_count || 0) + 1 })
        .eq('id', specialPromo.id);
    } else {
      // Allow Stripe's native promo code field on the hosted checkout page
      subscriptionData.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(subscriptionData);

    logStep("Stripe session created successfully", { sessionId: session.id, url: session.url, mode });

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
