import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    if (!stripeKey) {
      logStep("STRIPE_SECRET_KEY not found, returning trial status");
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: 'trial',
        trial_active: true,
        trial_days_left: 5,
        vessel_limit: 10,
        port_limit: 20
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      return new Response(JSON.stringify({ 
        subscribed: false,
        trial_active: false,
        access_type: 'none'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      logStep("User not authenticated", { error: userError?.message });
      return new Response(JSON.stringify({ 
        subscribed: false,
        trial_active: false,
        access_type: 'none'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("User authenticated", { email: user.email });

    // استخدام الدالة المحسنة للتحقق من الوصول
    const { data: accessData, error: accessError } = await supabaseClient.rpc('check_user_access_enhanced', {
      user_email: user.email
    });

    if (accessError) {
      logStep("Error checking access, creating new trial", { error: accessError.message });
      // إنشاء trial للمستخدم الجديد إذا لم يكن موجوداً
      const { error: trialError } = await supabaseClient.rpc('start_trial_with_plan', {
        user_email: user.email,
        user_id_param: user.id,
        plan_tier_param: 'basic',
        trial_days: 5
      });
      if (trialError) {
        logStep("Error creating trial", { error: trialError.message });
      }
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: 'trial',
        trial_active: true,
        trial_days_left: 5,
        access_type: 'trial',
        vessel_limit: 10,
        port_limit: 20
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (accessData && accessData.length > 0) {
      const access = accessData[0];
      logStep("Access data found", { 
        access_type: access.access_type,
        trial_days_left: access.trial_days_left,
        is_subscribed: access.is_subscribed
      });
      // تحديث التجارب المنتهية تلقائياً
      if (access.access_type === 'expired') {
        await supabaseClient.rpc('update_expired_trials');
      }
      // تحديد حدود الخطة
      let vesselLimit = 10, portLimit = 20, regionLimit = 1, refineryLimit = 5;
      let documentAccess = ['basic'], supportLevel = 'email', userSeats = 1;
      let apiAccess = false, realTimeAnalytics = false;
      if (access.subscription_tier === 'professional') {
        vesselLimit = 180; portLimit = 100; regionLimit = 6; refineryLimit = 70;
        documentAccess = ['basic', 'advanced']; supportLevel = 'priority';
        userSeats = 5; realTimeAnalytics = true;
      } else if (access.subscription_tier === 'enterprise') {
        vesselLimit = 500; portLimit = 120; regionLimit = 7; refineryLimit = 999;
        documentAccess = ['basic', 'advanced', 'complete']; supportLevel = 'dedicated';
        userSeats = 20; apiAccess = true; realTimeAnalytics = true;
      }
      return new Response(JSON.stringify({
        subscribed: access.is_subscribed,
        subscription_tier: access.subscription_tier,
        trial_active: access.access_type === 'trial',
        trial_days_left: access.trial_days_left,
        access_type: access.access_type,
        can_upgrade: access.can_upgrade,
        trial_end_date: access.trial_end_date,
        vessel_limit: vesselLimit,
        port_limit: portLimit,
        regions_limit: regionLimit,
        refinery_limit: refineryLimit,
        document_access: documentAccess,
        support_level: supportLevel,
        user_seats: userSeats,
        api_access: apiAccess,
        real_time_analytics: realTimeAnalytics
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // إذا لم يتم العثور على بيانات، إنشاء trial جديد
    logStep("No access data found, creating new trial");
    const { error: trialError } = await supabaseClient.rpc('start_trial_with_plan', {
      user_email: user.email,
      user_id_param: user.id,
      plan_tier_param: 'basic',
      trial_days: 5
    });
    if (trialError) {
      logStep("Error creating trial", { error: trialError.message });
    }
    return new Response(JSON.stringify({ 
      subscribed: false,
      subscription_tier: 'trial',
      trial_active: true,
      trial_days_left: 5,
      access_type: 'trial',
      vessel_limit: 10,
      port_limit: 20,
      regions_limit: 1,
      refinery_limit: 5,
      document_access: ['basic'],
      support_level: 'email',
      user_seats: 1,
      api_access: false,
      real_time_analytics: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error in check-subscription", { error: errorMessage });
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      subscribed: false,
      trial_active: false,
      access_type: 'error'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});