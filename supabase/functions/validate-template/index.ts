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

    const { template_id, file_content, template_url } = await req.json();

    const issues: { type: string; message: string; severity: string }[] = [];
    let placeholders: string[] = [];

    // Get content
    let content = '';
    if (file_content) {
      const binaryString = atob(file_content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      content = new TextDecoder().decode(bytes);
    } else if (template_url) {
      const response = await fetch(template_url);
      if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
      content = await response.text();
    } else if (template_id) {
      const { data: template } = await supabase
        .from('document_templates')
        .select('file_url, storage_path')
        .eq('id', template_id)
        .single();
      if (!template) throw new Error('Template not found');
      const url = template.file_url || template.storage_path;
      const response = await fetch(url);
      content = await response.text();
    } else {
      return new Response(
        JSON.stringify({ error: 'template_id, template_url, or file_content required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract placeholders
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    let match;
    while ((match = placeholderRegex.exec(content)) !== null) {
      const p = match[1].trim();
      if (!placeholders.includes(p)) placeholders.push(p);
    }

    // Validate
    if (placeholders.length === 0) {
      issues.push({ type: 'no_placeholders', message: 'No {{placeholders}} found in template', severity: 'warning' });
    }

    // Check for malformed placeholders
    const malformedRegex = /\{[^{]|[^}]\}/g;
    const singleBraces = content.match(malformedRegex);
    if (singleBraces && singleBraces.length > 0) {
      issues.push({ type: 'malformed_braces', message: 'Possible malformed placeholder (single braces found)', severity: 'warning' });
    }

    // Check for duplicate placeholders
    const duplicates = placeholders.filter((p, i) => placeholders.indexOf(p) !== i);
    if (duplicates.length > 0) {
      issues.push({ type: 'duplicates', message: `Duplicate placeholders: ${duplicates.join(', ')}`, severity: 'info' });
    }

    // Check for split placeholders (Word sometimes splits text across XML runs)
    const splitPattern = /\{[^}]*<[^>]+>[^}]*\}/g;
    if (splitPattern.test(content)) {
      issues.push({
        type: 'split_placeholders',
        message: 'Some placeholders may be split across XML elements. This can prevent proper replacement.',
        severity: 'error'
      });
    }

    // Check if mappings exist (if template_id provided)
    if (template_id) {
      const { data: mappings } = await supabase
        .from('template_placeholders')
        .select('placeholder_name')
        .eq('template_id', template_id);

      const mappedNames = (mappings || []).map(m => m.placeholder_name);
      const unmapped = placeholders.filter(p => !mappedNames.includes(p));

      if (unmapped.length > 0) {
        issues.push({
          type: 'unmapped_placeholders',
          message: `Unmapped placeholders: ${unmapped.join(', ')}`,
          severity: 'warning'
        });
      }
    }

    const isValid = !issues.some(i => i.severity === 'error');

    return new Response(
      JSON.stringify({
        success: true,
        is_valid: isValid,
        placeholders,
        placeholder_count: placeholders.length,
        issues,
        issue_count: issues.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[validate-template] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
