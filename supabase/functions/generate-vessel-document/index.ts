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

    const { vessel_id, template_id, document_type, entity_ids, user_id } = await req.json();

    if (!vessel_id) {
      return new Response(
        JSON.stringify({ error: 'vessel_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get vessel data
    const { data: vessel } = await supabase
      .from('vessels')
      .select('*')
      .eq('id', vessel_id)
      .single();

    if (!vessel) throw new Error('Vessel not found');

    // If template_id provided, use template-based generation
    if (template_id) {
      const { data: template } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', template_id)
        .single();

      if (!template) throw new Error('Template not found');

      // Get mappings
      const { data: mappings } = await supabase
        .from('template_placeholders')
        .select('*')
        .eq('template_id', template_id);

      // Build vessel data map
      const vesselData: Record<string, string> = {};
      for (const [key, value] of Object.entries(vessel)) {
        vesselData[`vessel_${key}`] = String(value ?? '');
        vesselData[key] = String(value ?? '');
      }

      // Resolve other entity data
      if (entity_ids) {
        for (const [table, id] of Object.entries(entity_ids)) {
          if (table === 'vessels') continue;
          const { data: row } = await supabase.from(table).select('*').eq('id', id).single();
          if (row) {
            for (const [key, value] of Object.entries(row)) {
              vesselData[`${table}_${key}`] = String(value ?? '');
            }
          }
        }
      }

      // Download and process template
      const templateUrl = template.file_url || template.storage_path;
      if (templateUrl) {
        const response = await fetch(templateUrl);
        if (response.ok) {
          let content = await response.text();
          for (const [key, value] of Object.entries(vesselData)) {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            content = content.replace(regex, value);
          }

          const encoder = new TextEncoder();
          const processedBytes = encoder.encode(content);
          const processedBase64 = btoa(String.fromCharCode(...processedBytes));

          // Log download
          if (user_id) {
            await supabase.from('user_document_downloads').insert({
              user_id, template_id, download_type: 'vessel_document',
              metadata: { vessel_id, vessel_name: vessel.name }
            });
          }

          return new Response(
            JSON.stringify({ success: true, docx_base64: processedBase64, vessel_name: vessel.name }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Fallback: return vessel data for client-side generation
    return new Response(
      JSON.stringify({ success: true, vessel, document_type: document_type || 'vessel_report' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[generate-vessel-document] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
