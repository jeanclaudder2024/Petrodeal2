import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONVERT_API_BASE_URL = 'https://v2.convertapi.com';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CONVERT_API_SECRET = Deno.env.get('CONVERT_API_SECRET');
    
    if (!CONVERT_API_SECRET) {
      console.error('CONVERT_API_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'ConvertAPI secret is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, docxBase64, fileName } = await req.json();
    console.log('Convert document request:', { action, fileName });

    if (action === 'test') {
      // Test connection to ConvertAPI
      const response = await fetch(`${CONVERT_API_BASE_URL}/user?Secret=${CONVERT_API_SECRET}`);
      
      if (response.ok) {
        console.log('ConvertAPI connection test successful');
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const errorText = await response.text();
        console.error('ConvertAPI connection test failed:', errorText);
        return new Response(
          JSON.stringify({ success: false, error: `Connection failed: ${response.status}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'convert') {
      if (!docxBase64 || !fileName) {
        return new Response(
          JSON.stringify({ error: 'Missing docxBase64 or fileName' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Converting DOCX to PDF:', fileName);

      // Convert base64 to blob for ConvertAPI
      const response = await fetch(
        `${CONVERT_API_BASE_URL}/convert/docx/to/pdf?Secret=${CONVERT_API_SECRET}&StoreFile=true`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Parameters: [
              {
                Name: 'File',
                FileValue: {
                  Name: 'document.docx',
                  Data: docxBase64,
                },
              },
              {
                Name: 'StoreFile',
                Value: true,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ConvertAPI conversion failed:', errorText);
        return new Response(
          JSON.stringify({ error: `Conversion failed: ${response.status}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await response.json();
      console.log('Conversion result:', { filesCount: result.Files?.length });

      if (result.Files && result.Files.length > 0) {
        const pdfFile = result.Files[0];
        return new Response(
          JSON.stringify({
            success: true,
            pdfUrl: pdfFile.Url,
            pdfBase64: pdfFile.FileData,
            fileName: fileName.replace('.docx', '.pdf'),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error('No files in conversion result');
        return new Response(
          JSON.stringify({ error: 'No PDF file in conversion result' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "test" or "convert"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Convert document error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
