import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CouponRequest {
  promo_code: string;
  discount_name: string;
  discount_percentage: number;
  billing_cycle: 'monthly' | 'annual' | 'both';
  valid_until: string;
  max_redemptions?: number;
  first_time_only?: boolean;
  plan_tier?: string;
}

// Map plan_tier to a human-readable Stripe product name
function productNameForTier(tier: string): string {
  const map: Record<string, string> = {
    basic: "PetroDealHub Basic Plan",
    professional: "PetroDealHub Professional Plan",
    enterprise: "PetroDealHub Enterprise Plan",
    broker: "Broker Lifetime Membership",
  };
  return map[tier] || `PetroDealHub ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`;
}

// Find or create a Stripe product for the given plan tier
async function findOrCreateProduct(secretKey: string, tier: string): Promise<string> {
  const name = productNameForTier(tier);

  // Search for existing product
  const searchResp = await fetch(
    `https://api.stripe.com/v1/products/search?query=${encodeURIComponent(`name:"${name}" AND active:"true"`)}`,
    {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Stripe-Version': '2023-10-16',
      },
    }
  );

  if (searchResp.ok) {
    const searchData = await searchResp.json();
    if (searchData.data && searchData.data.length > 0) {
      console.log(`[CREATE-STRIPE-COUPON] Found existing product for tier "${tier}":`, searchData.data[0].id);
      return searchData.data[0].id;
    }
  }

  // Create new product
  const createParams = new URLSearchParams();
  createParams.append('name', name);
  createParams.append('metadata[plan_tier]', tier);

  const createResp = await fetch('https://api.stripe.com/v1/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2023-10-16',
    },
    body: createParams.toString(),
  });

  if (!createResp.ok) {
    const err = await createResp.json();
    throw new Error(`Failed to create Stripe product: ${err.error?.message || 'Unknown error'}`);
  }

  const product = await createResp.json();
  console.log(`[CREATE-STRIPE-COUPON] Created product for tier "${tier}":`, product.id);
  return product.id;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Stripe mode from database
    const { data: stripeConfig } = await supabaseClient
      .from('stripe_configuration')
      .select('stripe_mode')
      .single();

    const isLiveMode = stripeConfig?.stripe_mode === 'live';
    const secretKey = isLiveMode 
      ? Deno.env.get('STRIPE_SECRET_KEY_LIVE')
      : Deno.env.get('STRIPE_SECRET_KEY_TEST');

    if (!secretKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Stripe ${isLiveMode ? 'Live' : 'Test'} secret key is not configured` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const couponData: CouponRequest = await req.json();
    
    // Sanitize promo code
    const sanitizedPromoCode = couponData.promo_code
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9\-_]/g, '')
      .toUpperCase();
    
    if (!sanitizedPromoCode) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid promo code format. Use only letters, numbers, hyphens, and underscores.'
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log('[CREATE-STRIPE-COUPON] Creating coupon:', { ...couponData, promo_code: sanitizedPromoCode });

    // If plan_tier is specific (not 'all'), find or create a product for restriction
    let restrictProductId: string | undefined;
    const planTier = couponData.plan_tier || 'all';
    if (planTier !== 'all') {
      restrictProductId = await findOrCreateProduct(secretKey, planTier);
    }

    // Create the coupon in Stripe
    const couponParams = new URLSearchParams();
    couponParams.append('percent_off', couponData.discount_percentage.toString());
    couponParams.append('name', couponData.discount_name);
    couponParams.append('metadata[plan_tier]', planTier);
    
    // Set duration based on billing cycle
    if (couponData.billing_cycle === 'monthly') {
      couponParams.append('duration', 'repeating');
      couponParams.append('duration_in_months', '1');
    } else if (couponData.billing_cycle === 'annual') {
      couponParams.append('duration', 'repeating');
      couponParams.append('duration_in_months', '12');
    } else {
      couponParams.append('duration', 'forever');
    }

    if (couponData.max_redemptions) {
      couponParams.append('max_redemptions', couponData.max_redemptions.toString());
    }

    // Restrict coupon to specific product if plan_tier is not 'all'
    if (restrictProductId) {
      couponParams.append('applies_to[products][]', restrictProductId);
      console.log('[CREATE-STRIPE-COUPON] Restricting coupon to product:', restrictProductId);
    }

    // Set redeem_by
    let validUntil = new Date(couponData.valid_until);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    maxDate.setDate(maxDate.getDate() - 1);
    
    if (validUntil > maxDate) {
      console.log('[CREATE-STRIPE-COUPON] Date exceeds 5 year limit, capping to max date');
      validUntil = maxDate;
    }
    
    couponParams.append('redeem_by', Math.floor(validUntil.getTime() / 1000).toString());

    const couponResponse = await fetch('https://api.stripe.com/v1/coupons', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2023-10-16',
      },
      body: couponParams.toString(),
    });

    if (!couponResponse.ok) {
      const errorData = await couponResponse.json();
      console.error('[CREATE-STRIPE-COUPON] Coupon creation failed:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: errorData.error?.message || 'Failed to create coupon in Stripe'
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeCoupon = await couponResponse.json();
    console.log('[CREATE-STRIPE-COUPON] Coupon created:', stripeCoupon.id);

    // Create a promotion code for the coupon
    const promoBody = new URLSearchParams();
    promoBody.set('coupon', stripeCoupon.id);
    promoBody.set('code', sanitizedPromoCode);
    
    if (couponData.first_time_only) {
      promoBody.set('restrictions[first_time_transaction]', 'true');
    }

    console.log('[CREATE-STRIPE-COUPON] Creating promo code with params:', promoBody.toString());

    const promoResponse = await fetch('https://api.stripe.com/v1/promotion_codes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2023-10-16',
      },
      body: promoBody.toString(),
    });

    let stripePromo;
    
    if (!promoResponse.ok) {
      const errorData = await promoResponse.json();
      console.log('[CREATE-STRIPE-COUPON] Promo code creation response:', errorData);
      
      if (errorData.error?.message?.includes('already exists')) {
        console.log('[CREATE-STRIPE-COUPON] Promo code exists, fetching existing one...');
        
        const listResponse = await fetch(
          `https://api.stripe.com/v1/promotion_codes?code=${sanitizedPromoCode}&active=true`,
          {
            headers: {
              'Authorization': `Bearer ${secretKey}`,
              'Stripe-Version': '2023-10-16',
            },
          }
        );
        
        if (listResponse.ok) {
          const listData = await listResponse.json();
          if (listData.data && listData.data.length > 0) {
            stripePromo = listData.data[0];
            console.log('[CREATE-STRIPE-COUPON] Found existing promo code:', stripePromo.id);
          }
        }
        
        if (!stripePromo) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Promo code exists in Stripe but could not be retrieved. Please check Stripe dashboard.'
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        console.error('[CREATE-STRIPE-COUPON] Promo code creation failed:', errorData);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: errorData.error?.message || 'Failed to create promo code in Stripe'
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      stripePromo = await promoResponse.json();
      console.log('[CREATE-STRIPE-COUPON] Promo code created:', stripePromo.id);
    }

    // Use upsert to handle case where record might already exist
    const { error: dbError } = await supabaseClient
      .from('subscription_discounts')
      .upsert({
        promo_code: sanitizedPromoCode,
        plan_tier: planTier,
        discount_percentage: couponData.discount_percentage,
        billing_cycle: couponData.billing_cycle,
        discount_name: couponData.discount_name,
        valid_until: couponData.valid_until,
        max_redemptions: couponData.max_redemptions || null,
        first_time_only: couponData.first_time_only || false,
        stripe_coupon_id: stripeCoupon.id,
        stripe_promo_code_id: stripePromo.id,
        is_active: true
      }, { onConflict: 'promo_code' });

    if (dbError) {
      console.error('[CREATE-STRIPE-COUPON] Database error:', dbError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Coupon created in Stripe but failed to save to database'
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Discount code created successfully',
        coupon_id: stripeCoupon.id,
        promo_code_id: stripePromo.id,
        restricted_to_product: restrictProductId || null
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[CREATE-STRIPE-COUPON] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "Failed to create discount code" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
