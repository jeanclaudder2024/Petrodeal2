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

    const { template_id, entity_ids, placeholder_mappings, output_format } = await req.json();

    if (!template_id) {
      return new Response(
        JSON.stringify({ error: 'template_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[process-document-template] Processing template: ${template_id}`);

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    // Get placeholder mappings
    const { data: mappings } = await supabase
      .from('template_placeholders')
      .select('*')
      .eq('template_id', template_id);

    // Resolve placeholder values from database
    const resolvedData: Record<string, string> = {};

    if (mappings && entity_ids) {
      for (const mapping of mappings) {
        if (mapping.source_type === 'database' && mapping.source_table && mapping.source_column) {
          const entityId = entity_ids[mapping.source_table] || entity_ids[`${mapping.source_table}_id`];
          if (entityId) {
            const { data: row } = await supabase
              .from(mapping.source_table)
              .select(mapping.source_column)
              .eq('id', entityId)
              .single();

            if (row) {
              resolvedData[mapping.placeholder_name] = String(row[mapping.source_column] || '');
            }
          }
        } else if (mapping.source_type === 'static' && mapping.default_value) {
          resolvedData[mapping.placeholder_name] = mapping.default_value;
        } else if (mapping.source_type === 'ai') {
          resolvedData[mapping.placeholder_name] = `[AI Generated: ${mapping.placeholder_name}]`;
        }
      }
    }

    // Merge with any provided placeholder_mappings
    if (placeholder_mappings) {
      Object.assign(resolvedData, placeholder_mappings);
    }

    // Download and process template file
    const templateUrl = template.file_url || template.storage_path;
    if (templateUrl) {
      const response = await fetch(templateUrl);
      if (response.ok) {
        let content = await response.text();

        for (const [key, value] of Object.entries(resolvedData)) {
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
          content = content.replace(regex, value);
        }

        const encoder = new TextEncoder();
        const processedBytes = encoder.encode(content);
        const processedBase64 = btoa(String.fromCharCode(...processedBytes));

        return new Response(
          JSON.stringify({
            success: true,
            docx_base64: processedBase64,
            resolved_placeholders: Object.keys(resolvedData).length,
            output_format: output_format || 'docx'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        resolved_data: resolvedData,
        message: 'Data resolved but no template file to process'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[process-document-template] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
