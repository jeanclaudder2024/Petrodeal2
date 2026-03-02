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

    const { template_id, data, entity_ids, user_id, output_format } = await req.json();

    if (!template_id) {
      return new Response(
        JSON.stringify({ error: 'template_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-filled-document] Template: ${template_id}`);

    // Get template
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

    // Resolve all data
    const resolvedData: Record<string, string> = { ...(data || {}) };

    if (mappings && entity_ids) {
      for (const mapping of mappings) {
        if (resolvedData[mapping.placeholder_name]) continue; // Skip if already provided

        if (mapping.source_type === 'database' && mapping.source_table && mapping.source_column) {
          const entityId = entity_ids[mapping.source_table] || entity_ids[`${mapping.source_table}_id`];
          if (entityId) {
            const { data: row } = await supabase
              .from(mapping.source_table)
              .select(mapping.source_column)
              .eq('id', entityId)
              .single();
            if (row) {
              resolvedData[mapping.placeholder_name] = String(row[mapping.source_column] ?? '');
            }
          }
        } else if (mapping.source_type === 'static' && mapping.default_value) {
          resolvedData[mapping.placeholder_name] = mapping.default_value;
        }
      }
    }

    // Download and fill template
    const templateUrl = template.file_url || template.storage_path;
    if (!templateUrl) throw new Error('No template file URL found');

    const response = await fetch(templateUrl);
    if (!response.ok) throw new Error(`Failed to download template: ${response.status}`);

    let content = await response.text();
    let replacedCount = 0;

    for (const [key, value] of Object.entries(resolvedData)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, value);
        replacedCount += matches.length;
      }
    }

    const encoder = new TextEncoder();
    const processedBytes = encoder.encode(content);
    const processedBase64 = btoa(String.fromCharCode(...processedBytes));

    // Log download if user_id provided
    if (user_id) {
      await supabase
        .from('user_document_downloads')
        .insert({
          user_id,
          template_id,
          download_type: 'filled',
          metadata: { entity_ids, replacements: replacedCount }
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        docx_base64: processedBase64,
        replacements_made: replacedCount,
        total_placeholders: Object.keys(resolvedData).length,
        output_format: output_format || 'docx'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[generate-filled-document] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
