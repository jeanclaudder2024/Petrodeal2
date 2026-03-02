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

    const { template_url, template_id, file_content } = await req.json();

    if (!template_url && !file_content) {
      return new Response(
        JSON.stringify({ error: 'template_url or file_content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let fileBytes: Uint8Array;

    if (file_content) {
      // Base64 encoded content
      const binaryString = atob(file_content);
      fileBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileBytes[i] = binaryString.charCodeAt(i);
      }
    } else {
      // Download from URL
      const response = await fetch(template_url);
      if (!response.ok) throw new Error(`Failed to download template: ${response.status}`);
      fileBytes = new Uint8Array(await response.arrayBuffer());
    }

    // Extract placeholders using regex pattern matching on the raw XML
    const decoder = new TextDecoder();
    const content = decoder.decode(fileBytes);
    
    // Find {{placeholder}} patterns
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = placeholderRegex.exec(content)) !== null) {
      const placeholder = match[1].trim();
      if (!placeholders.includes(placeholder)) {
        placeholders.push(placeholder);
      }
    }

    // Categorize placeholders
    const categories: Record<string, string[]> = {
      vessel: [],
      port: [],
      company: [],
      buyer: [],
      seller: [],
      product: [],
      deal: [],
      broker: [],
      general: [],
      other: []
    };

    for (const p of placeholders) {
      const lower = p.toLowerCase();
      if (lower.includes('vessel') || lower.includes('ship') || lower.includes('imo') || lower.includes('mmsi')) {
        categories.vessel.push(p);
      } else if (lower.includes('port') || lower.includes('terminal') || lower.includes('berth')) {
        categories.port.push(p);
      } else if (lower.includes('buyer')) {
        categories.buyer.push(p);
      } else if (lower.includes('seller')) {
        categories.seller.push(p);
      } else if (lower.includes('company') || lower.includes('operator') || lower.includes('owner')) {
        categories.company.push(p);
      } else if (lower.includes('product') || lower.includes('cargo') || lower.includes('commodity')) {
        categories.product.push(p);
      } else if (lower.includes('deal') || lower.includes('contract') || lower.includes('order')) {
        categories.deal.push(p);
      } else if (lower.includes('broker') || lower.includes('agent')) {
        categories.broker.push(p);
      } else if (lower.includes('date') || lower.includes('time') || lower.includes('number') || lower.includes('ref')) {
        categories.general.push(p);
      } else {
        categories.other.push(p);
      }
    }

    // Update template record if template_id provided
    if (template_id) {
      await supabase
        .from('document_templates')
        .update({
          detected_placeholders: placeholders,
          placeholder_categories: categories,
          updated_at: new Date().toISOString()
        })
        .eq('id', template_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        placeholders,
        categories,
        total_count: placeholders.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[analyze-word-template] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
