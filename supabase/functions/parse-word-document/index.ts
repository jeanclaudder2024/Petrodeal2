import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_content, template_url } = await req.json();

    if (!file_content && !template_url) {
      return new Response(
        JSON.stringify({ error: 'file_content or template_url is required' }),
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
    } else {
      const response = await fetch(template_url);
      if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
      fileBytes = new Uint8Array(await response.arrayBuffer());
    }

    const decoder = new TextDecoder();
    const content = decoder.decode(fileBytes);

    // Extract structure: headings, paragraphs, tables, placeholders
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = placeholderRegex.exec(content)) !== null) {
      const p = match[1].trim();
      if (!placeholders.includes(p)) placeholders.push(p);
    }

    // Basic structure detection from XML
    const sections: any[] = [];
    const headingRegex = /<w:pStyle w:val="Heading(\d)"/g;
    let headingMatch;
    let headingCount = 0;
    while ((headingMatch = headingRegex.exec(content)) !== null) {
      headingCount++;
      sections.push({ type: 'heading', level: parseInt(headingMatch[1]) });
    }

    const tableCount = (content.match(/<w:tbl>/g) || []).length;
    const paragraphCount = (content.match(/<w:p[ >]/g) || []).length;
    const imageCount = (content.match(/<wp:inline|<wp:anchor/g) || []).length;

    return new Response(
      JSON.stringify({
        success: true,
        structure: {
          headings: headingCount,
          tables: tableCount,
          paragraphs: paragraphCount,
          images: imageCount,
          sections
        },
        placeholders,
        file_size: fileBytes.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[parse-word-document] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
