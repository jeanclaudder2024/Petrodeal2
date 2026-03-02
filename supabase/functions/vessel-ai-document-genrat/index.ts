import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This is a variant/alias of ai-vessel-document-generator
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const { vessel_id, document_type, additional_data } = await req.json();

    if (!vessel_id) {
      return new Response(
        JSON.stringify({ error: 'vessel_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: vessel } = await supabase
      .from('vessels')
      .select('*')
      .eq('id', vessel_id)
      .single();

    if (!vessel) throw new Error('Vessel not found');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a maritime document specialist. Generate professional vessel documents in HTML format.' },
          { role: 'user', content: `Generate a ${document_type || 'vessel report'} for vessel: ${JSON.stringify(vessel)}${additional_data ? `\nAdditional: ${JSON.stringify(additional_data)}` : ''}` }
        ],
        max_tokens: 3000
      })
    });

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        content: data.choices[0].message.content,
        vessel_name: vessel.name,
        document_type: document_type || 'vessel_report'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[vessel-ai-document-genrat] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
