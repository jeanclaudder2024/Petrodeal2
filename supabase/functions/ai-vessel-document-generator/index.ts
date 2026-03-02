import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { vessel_id, document_type, template_id, additional_context } = await req.json();

    if (!vessel_id) {
      return new Response(
        JSON.stringify({ error: 'vessel_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get vessel data
    const { data: vessel, error: vesselError } = await supabase
      .from('vessels')
      .select('*')
      .eq('id', vessel_id)
      .single();

    if (vesselError || !vessel) throw new Error('Vessel not found');

    const docType = document_type || 'vessel_report';
    const prompt = `Generate a professional maritime ${docType} document for the following vessel:

Vessel Details:
- Name: ${vessel.name || 'N/A'}
- IMO: ${vessel.imo_number || 'N/A'}
- MMSI: ${vessel.mmsi || 'N/A'}
- Type: ${vessel.type || 'N/A'}
- Flag: ${vessel.flag || 'N/A'}
- Built: ${vessel.year_built || 'N/A'}
- DWT: ${vessel.deadweight || 'N/A'}
- Length: ${vessel.length_overall || 'N/A'}m
- Beam: ${vessel.beam || 'N/A'}m
- Draft: ${vessel.draft || 'N/A'}m
- Status: ${vessel.status || 'N/A'}
- Owner: ${vessel.owner || 'N/A'}
- Operator: ${vessel.operator || 'N/A'}
- Classification: ${vessel.classification_society || 'N/A'}

${additional_context ? `Additional Context: ${additional_context}` : ''}

Generate a comprehensive, professionally formatted document in HTML format with proper headings, tables, and sections. Include all relevant maritime standards and references.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a maritime document specialist. Generate professional, comprehensive vessel documents in HTML format.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI error: ${errorData.error?.message}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        success: true,
        document_type: docType,
        vessel_name: vessel.name,
        content: generatedContent,
        model: data.model,
        usage: data.usage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[ai-vessel-document-generator] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
