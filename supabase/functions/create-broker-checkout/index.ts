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

const BROKER_PRODUCT_NAME = "Broker Lifetime Membership";

// Find or create a persistent Stripe product for brokers
async function findOrCreateBrokerProduct(stripe: Stripe): Promise<string> {
  const products = await stripe.products.search({
    query: `name:"${BROKER_PRODUCT_NAME}" AND active:"true"`,
    limit: 1,
  });

  if (products.data.length > 0) {
    logStep("Found existing broker product", { productId: products.data[0].id });
    return products.data[0].id;
  }

  const product = await stripe.products.create({
    name: BROKER_PRODUCT_NAME,
    description: "Lifetime access to broker features including deal management, verification badge, and admin support",
    metadata: { plan_tier: 'broker' },
  });

  logStep("Created new broker product", { productId: product.id });
  return product.id;
}

const cleanupStuckMembership = async (userId: string, supabaseClient: any) => {
  try {
    const { data: stuckMembership } = await supabaseClient
      .from("broker_memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("payment_status", "pending")
      .single();

    if (stuckMembership) {
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

// Validate and look up a promo code for broker tier
async function resolvePromoCode(stripe: Stripe, promoCode: string) {
  logStep("Looking up promo code", { code: promoCode });
  
  const promoCodes = await stripe.promotionCodes.list({
    code: promoCode,
    active: true,
    limit: 1,
  });

  if (!promoCodes.data.length) {
    throw new Error(`Promo code "${promoCode}" is not valid or has expired.`);
  }

  const promo = promoCodes.data[0];
  const coupon = await stripe.coupons.retrieve(promo.coupon.id as string);
  const planTier = coupon.metadata?.plan_tier;

  // Allow codes with plan_tier 'broker' or 'all'
  if (planTier && planTier !== 'broker' && planTier !== 'all') {
    throw new Error(`This promo code is not valid for the Broker membership. It is restricted to the "${planTier}" plan.`);
  }

  logStep("Promo code validated", { promoId: promo.id, couponId: coupon.id, planTier });
  return promo.id;
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

    const { secretKey, mode } = await getStripeConfig(supabaseClient);

    // Parse request body
    let promoCode: string | undefined;
    let validateOnly = false;
    try {
      const body = await req.json();
      promoCode = body?.promo_code;
      validateOnly = body?.validate_only === true;
    } catch {
      // No body or invalid JSON — that's fine
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user already has a PAID broker membership
    const { data: existingMembership } = await supabaseClient
      .from("broker_memberships")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingMembership && existingMembership.payment_status === 'paid') {
      logStep("User already has paid membership");
      return new Response(JSON.stringify({ error: "You already have a broker membership" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (existingMembership && existingMembership.payment_status === 'pending') {
      const wasCleaned = await cleanupStuckMembership(user.id, supabaseClient);
      if (wasCleaned) {
        logStep("Cleaned up stuck membership, proceeding with new checkout");
      }
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

    // Resolve promo code if provided
    let promoCodeId: string | undefined;
    let promoWarning: string | undefined;
    if (promoCode) {
      try {
        promoCodeId = await resolvePromoCode(stripe, promoCode);
      } catch (promoError) {
        const msg = promoError instanceof Error ? promoError.message : 'Invalid promo code';
        logStep("Promo code validation failed, continuing without promo", { error: msg });
        promoWarning = msg;
      }
    }

    // If validate_only, return validation result without creating checkout
    if (validateOnly) {
      if (promoCodeId) {
        const promoCodes = await stripe.promotionCodes.list({ code: promoCode!, active: true, limit: 1 });
        const coupon = promoCodes.data[0]?.coupon;
        const discountPct = coupon?.percent_off || 0;
        const originalAmount = 49900;
        const discountedAmount = Math.round(originalAmount * (100 - discountPct) / 100);
        return new Response(JSON.stringify({ 
          valid: true, 
          message: `${discountPct}% discount applied`,
          discount_percentage: discountPct,
          original_amount: originalAmount,
          discounted_amount: discountedAmount
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: promoWarning || 'Invalid promo code'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Find or create the persistent broker product
    const brokerProductId = await findOrCreateBrokerProduct(stripe);

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    // Build checkout session config using persistent product
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product: brokerProductId,
            unit_amount: 49900,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/broker-setup?success=true`,
      cancel_url: `${req.headers.get("origin")}/broker-membership?canceled=true`,
      metadata: {
        stripe_mode: mode,
        tier: 'broker',
        plan_tier: 'broker',
        ...(promoCodeId ? { applied_promotion_code: promoCodeId } : {})
      }
    };

    // Strict enforcement: only pre-validated promo codes from our app can be applied
    if (promoCodeId) {
      sessionConfig.discounts = [{ promotion_code: promoCodeId }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created", { sessionId: session.id, mode, hasPromo: !!promoCodeId });

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

    logStep("Membership record created/updated successfully");

    return new Response(JSON.stringify({ url: session.url, ...(promoWarning ? { promo_warning: promoWarning } : {}) }), {
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
