import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe configuration error");
    }

    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error("Session ID is required");
    }

    logStep("Verifying session", { session_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription', 'customer']
    });

    if (session.payment_status !== 'paid' && !session.subscription) {
      throw new Error("Payment not completed");
    }

    logStep("Session verified", { 
      customer_id: session.customer,
      subscription_id: session.subscription?.id,
      payment_status: session.payment_status
    });

    // Create Supabase client with service role for database updates
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get subscription details if it exists
    let subscriptionDetails = null;
    if (session.subscription) {
      const subscription = typeof session.subscription === 'string' 
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;
        
      subscriptionDetails = {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        trial_end: subscription.trial_end,
        customer_id: subscription.customer
      };

      // Update database with successful subscription
      const metadata = session.metadata || {};
      const customerEmail = session.customer_details?.email || metadata.email;
      
      if (customerEmail) {
        logStep("Updating database with successful subscription", { 
          email: customerEmail, 
          subscriptionId: subscription.id 
        });

        // Get customer information
        const customer = typeof session.customer === 'string' 
          ? await stripe.customers.retrieve(session.customer)
          : session.customer;

        // Determine subscription tier and limits from metadata or price
        let subscriptionTier = metadata.tier || 'basic';
        let vesselLimit = 90, portLimit = 30, regionLimit = 4, refineryLimit = 15;
        let documentAccess = ['basic'], supportLevel = 'email', userSeats = 1;
        let apiAccess = false, realTimeAnalytics = false;

        // Get price information to determine tier if not in metadata
        const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
        const amount = price.unit_amount || 0;
        const interval = price.recurring?.interval || 'month';
        const monthlyAmount = interval === 'year' ? Math.round(amount / 10) : amount;

        // Determine tier based on price if not in metadata
        if (!metadata.tier) {
          if (monthlyAmount <= 3500) { // Basic: $29.99
            subscriptionTier = "basic";
            vesselLimit = 90; portLimit = 30; regionLimit = 4; refineryLimit = 15;
          } else if (monthlyAmount <= 9500) { // Professional: $89.99
            subscriptionTier = "professional";
            vesselLimit = 180; portLimit = 100; regionLimit = 6; refineryLimit = 70;
            documentAccess = ['basic', 'advanced']; supportLevel = 'priority';
            userSeats = 5; realTimeAnalytics = true;
          } else { // Enterprise: $199.99+
            subscriptionTier = "enterprise";
            vesselLimit = 500; portLimit = 120; regionLimit = 7; refineryLimit = 999;
            documentAccess = ['basic', 'advanced', 'complete']; supportLevel = 'dedicated';
            userSeats = 20; apiAccess = true; realTimeAnalytics = true;
          }
        }

        // Update subscribers table
        const { error: updateError } = await supabaseClient.from("subscribers").upsert({
          email: customerEmail,
          user_id: metadata.user_id || null,
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer.id,
          stripe_subscription_id: subscription.id,
          subscribed: true,
          subscription_status: 'active',
          subscription_tier: subscriptionTier,
          billing_cycle: metadata.billing_cycle || 'monthly',
          subscription_start_date: new Date().toISOString(),
          subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
          vessel_limit: vesselLimit,
          port_limit: portLimit,
          regions_limit: regionLimit,
          refinery_limit: refineryLimit,
          document_access: documentAccess,
          support_level: supportLevel,
          user_seats: userSeats,
          api_access: apiAccess,
          real_time_analytics: realTimeAnalytics,
          // Clear trial status since user now has paid subscription
          is_trial_active: false,
          trial_used: true,
          // Clear unified trial as well
          unified_trial_end_date: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

        if (updateError) {
          logStep("Error updating subscriber", { error: updateError.message });
        } else {
          logStep("Successfully updated subscriber with active subscription", { 
            email: customerEmail, 
            tier: subscriptionTier 
          });
        }
      }
    }

    // Extract metadata from session
    const metadata = session.metadata || {};
    
    return new Response(JSON.stringify({
      success: true,
      session: {
        id: session.id,
        customer_id: session.customer,
        customer_email: session.customer_details?.email,
        payment_status: session.payment_status,
        subscription: subscriptionDetails,
        metadata: metadata
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-stripe-session", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});