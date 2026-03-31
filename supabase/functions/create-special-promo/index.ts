import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SPECIAL-PROMO] ${step}${detailsStr}`);
};

function productNameForTier(tier: string): string {
  const map: Record<string, string> = {
    basic: "PetroDealHub Basic Plan",
    professional: "PetroDealHub Professional Plan",
  };
  return map[tier] || `PetroDealHub ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`;
}

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
  }

  if (!secretKey) {
    throw new Error(`Stripe secret key not configured for ${mode} mode`);
  }

  return { secretKey, mode };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      logStep("ERROR", { message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
      return new Response(JSON.stringify({ success: false, message: "Server configuration error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabaseService = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");
    const token = authHeader.replace("Bearer ", "");

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    // Check admin role
    const { data: roleData } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error("Admin access required");

    const body = await req.json();
    const code = (body.code || '').toString().trim().toUpperCase().replace(/\s/g, '');
    const { discount_percentage, free_months, plan_tier, valid_until, max_redemptions } = body;

    if (!code || !discount_percentage || !free_months || !plan_tier) {
      throw new Error("Missing required fields: code, discount_percentage, free_months, plan_tier");
    }

    if (free_months < 1 || free_months > 12) throw new Error("free_months must be 1-12");
    if (discount_percentage < 1 || discount_percentage > 100) throw new Error("discount_percentage must be 1-100");
    if (!['basic', 'professional'].includes(plan_tier)) throw new Error("plan_tier must be basic or professional");

    logStep("Creating special promo", { code, discount_percentage, free_months, plan_tier });

    const { secretKey, mode } = await getStripeConfig(supabaseService);
    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

    // Find the Stripe product for this plan tier
    const productName = productNameForTier(plan_tier);
    const products = await stripe.products.search({
      query: `name:"${productName}" AND active:"true"`,
      limit: 1,
    });

    let productId: string;
    if (products.data.length > 0) {
      productId = products.data[0].id;
    } else {
      // Create the product if it doesn't exist
      const product = await stripe.products.create({
        name: productName,
        description: `PetroDealHub ${plan_tier} Subscription`,
        metadata: { plan_tier },
      });
      productId = product.id;
    }

    logStep("Found/created product", { productId, productName });

    // Cap valid_until to 5 years max (Stripe limit)
    let redeemBy: number | undefined;
    if (valid_until) {
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 5);
      maxDate.setDate(maxDate.getDate() - 1);
      const validDate = new Date(valid_until);
      const cappedDate = validDate > maxDate ? maxDate : validDate;
      redeemBy = Math.floor(cappedDate.getTime() / 1000);
    }

    // Create Stripe coupon with repeating duration
    // Stripe coupon name must be ≤40 chars; keep details in metadata
    const shortName = `${code} ${discount_percentage}%off ${free_months}mo`.slice(0, 40);
    const couponParams: any = {
      percent_off: discount_percentage,
      duration: 'repeating',
      duration_in_months: free_months,
      name: shortName,
      applies_to: { products: [productId] },
      metadata: {
        special_promo: 'true',
        plan_tier,
        free_months: free_months.toString(),
        code,
        description: `${discount_percentage}% off for ${free_months} months on ${plan_tier}`,
      },
    };

    if (redeemBy) {
      couponParams.redeem_by = redeemBy;
    }

    if (max_redemptions) {
      couponParams.max_redemptions = max_redemptions;
    }

    const coupon = await stripe.coupons.create(couponParams);
    logStep("Created Stripe coupon", { couponId: coupon.id });

    // Create Stripe promotion code
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code.toUpperCase(),
      metadata: {
        special_promo: 'true',
        plan_tier,
        free_months: free_months.toString(),
      },
    });
    logStep("Created Stripe promo code", { promoCodeId: promoCode.id });

    // Save to database
    const { error: dbError } = await supabaseService
      .from('special_promo_codes')
      .insert({
        code: code.toUpperCase(),
        discount_percentage,
        free_months,
        plan_tier,
        is_active: true,
        max_redemptions: max_redemptions || null,
        valid_until: valid_until || null,
        stripe_coupon_id: coupon.id,
        stripe_promo_code_id: promoCode.id,
      });

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    logStep("Saved to database successfully");

    return new Response(JSON.stringify({
      success: true,
      message: `Special promo code ${code.toUpperCase()} created successfully`,
      coupon_id: coupon.id,
      promo_code_id: promoCode.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ success: false, message: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
