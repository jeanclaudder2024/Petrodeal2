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

    const { template_id, entity_ids, placeholder_mappings, use_ai, output_format } = await req.json();

    if (!template_id) {
      return new Response(
        JSON.stringify({ error: 'template_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[enhanced-document-processor] Processing template: ${template_id}, AI: ${use_ai}`);

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

    const resolvedData: Record<string, string> = {};
    const aiPlaceholders: string[] = [];

    // Resolve database placeholders
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
          aiPlaceholders.push(mapping.placeholder_name);
        }
      }
    }

    // Use AI for AI-sourced placeholders
    if (use_ai && OPENAI_API_KEY && aiPlaceholders.length > 0) {
      const contextData = { ...resolvedData, ...entity_ids };
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: 'Generate professional maritime/oil trading document content. Return a JSON object with placeholder names as keys and generated content as values.'
          }, {
            role: 'user',
            content: `Generate content for these placeholders: ${JSON.stringify(aiPlaceholders)}\nContext: ${JSON.stringify(contextData)}`
          }],
          response_format: { type: 'json_object' }
        })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        try {
          const generated = JSON.parse(aiData.choices[0].message.content);
          Object.assign(resolvedData, generated);
        } catch (e) {
          console.error('[enhanced-document-processor] AI parse error:', e);
        }
      }
    }

    // Merge with provided mappings
    if (placeholder_mappings) {
      Object.assign(resolvedData, placeholder_mappings);
    }

    // Process template file
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
            ai_generated: aiPlaceholders.length,
            output_format: output_format || 'docx'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, resolved_data: resolvedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[enhanced-document-processor] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
