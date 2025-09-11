import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaveDocumentRequest {
  documentId: string;
  vesselId: number;
  vesselName: string;
  documentTitle: string;
  pdfBase64: string;
  fileName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SAVE-VESSEL-DOCUMENT FUNCTION STARTED ===');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    const { documentId, vesselId, vesselName, documentTitle, pdfBase64, fileName }: SaveDocumentRequest = requestBody;

    console.log('Request parameters:', {
      documentId,
      vesselId,
      vesselName,
      documentTitle,
      fileName,
      pdfSize: pdfBase64?.length || 0
    });

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log('Authenticated user:', user.id);

    if (!documentId || !vesselId || !pdfBase64 || !fileName) {
      throw new Error('Missing required parameters');
    }

    // Create directory structure: documents/vessel_{vesselId}/document_{documentId}/
    const folderPath = `documents/vessel_${vesselId}/document_${documentId}`;
    const fullFileName = `${fileName}_${Date.now()}.pdf`;
    const filePath = `${folderPath}/${fullFileName}`;
    
    console.log('Creating file at path:', filePath);

    try {
      // Convert base64 to Uint8Array
      const pdfBytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
      
      // Create the directory structure if it doesn't exist
      try {
        await Deno.mkdir(`./project_documents/${folderPath}`, { recursive: true });
        console.log('Directory created successfully');
      } catch (dirError) {
        console.log('Directory might already exist or creation failed:', dirError.message);
      }

      // Write the PDF file to the project directory
      const projectFilePath = `./project_documents/${filePath}`;
      await Deno.writeFile(projectFilePath, pdfBytes);
      console.log('PDF file saved to:', projectFilePath);

      // Calculate file size
      const fileSize = pdfBytes.length;

      // Save record to user_document_storage table
      const { data: savedRecord, error: saveError } = await supabaseClient
        .from('user_document_storage')
        .insert({
          user_id: user.id,
          document_id: documentId,
          vessel_id: vesselId,
          document_title: documentTitle,
          vessel_name: vesselName,
          file_url: filePath, // Store the relative file path
          file_size: fileSize,
          downloaded_at: new Date().toISOString(),
          view_count: 0
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving to database:', saveError);
        // Try to clean up the file if database save failed
        try {
          await Deno.remove(projectFilePath);
        } catch (cleanupError) {
          console.error('Failed to cleanup file after database error:', cleanupError);
        }
        throw new Error(`Failed to save document record: ${saveError.message}`);
      }

      console.log('Document saved successfully:', savedRecord);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Document saved successfully',
          filePath: filePath,
          documentRecord: savedRecord
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (fileError) {
      console.error('Error saving file:', fileError);
      throw new Error(`Failed to save PDF file: ${fileError.message}`);
    }

  } catch (error) {
    console.error('=== ERROR IN SAVE-VESSEL-DOCUMENT ===');
    console.error('Error message:', error?.message || 'Unknown error');
    console.error('Full error:', error);
    
    return new Response(
      JSON.stringify({
        error: error?.message || 'Unknown error occurred',
        details: {
          timestamp: new Date().toISOString(),
          function: 'save-vessel-document'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});