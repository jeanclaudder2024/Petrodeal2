import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility/test function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, data } = body;

    switch (action) {
      case 'ping':
        return new Response(
          JSON.stringify({ success: true, message: 'pong', timestamp: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'echo':
        return new Response(
          JSON.stringify({ success: true, echo: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'health':
        return new Response(
          JSON.stringify({
            success: true,
            status: 'healthy',
            environment: {
              has_openai: !!Deno.env.get('OPENAI_API_KEY'),
              has_stripe_live: !!Deno.env.get('STRIPE_SECRET_KEY_LIVE'),
              has_stripe_test: !!Deno.env.get('STRIPE_SECRET_KEY_TEST'),
              supabase_url: Deno.env.get('SUPABASE_URL') ? 'configured' : 'missing'
            },
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Bright function is running',
            available_actions: ['ping', 'echo', 'health'],
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
