import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error("Insufficient permissions - admin access required");
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'get_subscribers':
        const { data: subscribers, error: subError } = await supabaseClient
          .from('subscribers')
          .select('*')
          .order('created_at', { ascending: false });

        if (subError) throw subError;

        return new Response(JSON.stringify({ subscribers }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'update_subscription':
        const { userId, subscriptionData } = payload;
        
        const { error: updateError } = await supabaseClient
          .from('subscribers')
          .update(subscriptionData)
          .eq('user_id', userId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'get_discounts':
        const { data: discounts, error: discountError } = await supabaseClient
          .from('subscription_discounts')
          .select('*')
          .order('created_at', { ascending: false });

        if (discountError) throw discountError;

        return new Response(JSON.stringify({ discounts }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'create_discount':
        const { discountData } = payload;
        
        const { error: createDiscountError } = await supabaseClient
          .from('subscription_discounts')
          .insert({
            ...discountData,
            created_by: userData.user.id
          });

        if (createDiscountError) throw createDiscountError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'update_discount':
        const { discountId, updates } = payload;
        
        const { error: updateDiscountError } = await supabaseClient
          .from('subscription_discounts')
          .update(updates)
          .eq('id', discountId);

        if (updateDiscountError) throw updateDiscountError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'delete_discount':
        const { discountId: deleteId } = payload;
        
        const { error: deleteError } = await supabaseClient
          .from('subscription_discounts')
          .delete()
          .eq('id', deleteId);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'get_analytics':
        // Get subscription analytics
        const { data: analyticsData, error: analyticsError } = await supabaseClient
          .from('subscribers')
          .select('subscription_tier, subscribed, created_at');

        if (analyticsError) throw analyticsError;

        const analytics = {
          total_subscribers: analyticsData.length,
          active_subscribers: analyticsData.filter(s => s.subscribed).length,
          tier_breakdown: {
            basic: analyticsData.filter(s => s.subscription_tier === 'basic').length,
            professional: analyticsData.filter(s => s.subscription_tier === 'professional').length,
            enterprise: analyticsData.filter(s => s.subscription_tier === 'enterprise').length,
          },
          monthly_growth: calculateMonthlyGrowth(analyticsData)
        };

        return new Response(JSON.stringify({ analytics }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      default:
        throw new Error("Invalid action specified");
    }

  } catch (error) {
    console.error('Error in admin-subscription-management:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function calculateMonthlyGrowth(data: any[]) {
  const now = new Date();
  const thisMonth = data.filter(s => {
    const created = new Date(s.created_at);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const lastMonth = data.filter(s => {
    const created = new Date(s.created_at);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
    return created.getMonth() === lastMonthDate.getMonth() && 
           created.getFullYear() === lastMonthDate.getFullYear();
  }).length;

  return {
    this_month: thisMonth,
    last_month: lastMonth,
    growth_rate: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(2) : '0'
  };
}