import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isLiveMode } = await req.json();
    
    // Get the appropriate secret key based on mode
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

    console.log(`[TEST-STRIPE] Testing ${isLiveMode ? 'Live' : 'Test'} mode connection...`);

    // Test the connection by fetching account info
    const response = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[TEST-STRIPE] Connection failed:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: errorData.error?.message || 'Failed to connect to Stripe',
          error: errorData.error
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accountData = await response.json();
    console.log(`[TEST-STRIPE] Connection successful! Account: ${accountData.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully connected to Stripe ${isLiveMode ? 'Live' : 'Test'} mode`,
        account: {
          id: accountData.id,
          email: accountData.email,
          business_name: accountData.settings?.dashboard?.display_name || accountData.business_profile?.name,
          country: accountData.country,
          charges_enabled: accountData.charges_enabled,
          payouts_enabled: accountData.payouts_enabled
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[TEST-STRIPE] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "Failed to test Stripe connection" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
