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

    const { template_id, template_url, file_content, data, placeholders } = await req.json();

    if (!file_content && !template_url && !template_id) {
      return new Response(
        JSON.stringify({ error: 'template_id, template_url, or file_content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let fileBytes: Uint8Array;

    if (file_content) {
      const binaryString = atob(file_content);
      fileBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileBytes[i] = binaryString.charCodeAt(i);
      }
    } else if (template_url) {
      const response = await fetch(template_url);
      if (!response.ok) throw new Error(`Failed to download template: ${response.status}`);
      fileBytes = new Uint8Array(await response.arrayBuffer());
    } else {
      // Get from storage via template_id
      const { data: template } = await supabase
        .from('document_templates')
        .select('file_url, storage_path')
        .eq('id', template_id)
        .single();

      if (!template) throw new Error('Template not found');

      const url = template.file_url || template.storage_path;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to download template: ${response.status}`);
      fileBytes = new Uint8Array(await response.arrayBuffer());
    }

    // Process template: replace placeholders with data
    const decoder = new TextDecoder();
    let content = decoder.decode(fileBytes);

    const replacementData = data || placeholders || {};
    let replacedCount = 0;

    for (const [key, value] of Object.entries(replacementData)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, String(value || ''));
        replacedCount += matches.length;
      }
    }

    // Convert back to bytes
    const encoder = new TextEncoder();
    const processedBytes = encoder.encode(content);
    const processedBase64 = btoa(String.fromCharCode(...processedBytes));

    return new Response(
      JSON.stringify({
        success: true,
        docx_base64: processedBase64,
        replacements_made: replacedCount,
        file_size: processedBytes.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[process-word-template] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
