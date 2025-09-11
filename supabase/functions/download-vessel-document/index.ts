import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DownloadDocumentRequest {
  documentStorageId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== DOWNLOAD-VESSEL-DOCUMENT FUNCTION STARTED ===');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    const { documentStorageId }: DownloadDocumentRequest = requestBody;

    console.log('Download request for document storage ID:', documentStorageId);

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

    if (!documentStorageId) {
      throw new Error('Document storage ID is required');
    }

    // Get the document record from user_document_storage
    const { data: documentRecord, error: fetchError } = await supabaseClient
      .from('user_document_storage')
      .select('*')
      .eq('id', documentStorageId)
      .eq('user_id', user.id) // Ensure user can only access their own documents
      .single();

    if (fetchError || !documentRecord) {
      throw new Error('Document not found or access denied');
    }

    console.log('Found document record:', {
      id: documentRecord.id,
      file_url: documentRecord.file_url,
      document_title: documentRecord.document_title
    });

    // Construct the full file path
    const projectFilePath = `./project_documents/${documentRecord.file_url}`;
    
    console.log('Attempting to read file from:', projectFilePath);

    try {
      // Check if file exists
      const fileInfo = await Deno.stat(projectFilePath);
      if (!fileInfo.isFile) {
        throw new Error('Path is not a file');
      }

      // Read the PDF file
      const pdfBytes = await Deno.readFile(projectFilePath);
      
      // Convert to base64
      const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
      
      console.log('File read successfully, size:', pdfBytes.length, 'bytes');

      // Update view count and last viewed timestamp
      const { error: updateError } = await supabaseClient
        .from('user_document_storage')
        .update({
          view_count: (documentRecord.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', documentStorageId);

      if (updateError) {
        console.error('Error updating view count:', updateError);
        // Don't fail the download for this
      }

      return new Response(
        JSON.stringify({
          success: true,
          pdfBase64: pdfBase64,
          fileName: documentRecord.document_title,
          fileSize: pdfBytes.length,
          documentTitle: documentRecord.document_title,
          vesselName: documentRecord.vessel_name
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (fileError) {
      console.error('Error reading file:', fileError);
      
      // If file doesn't exist, we should probably clean up the database record
      if (fileError instanceof Deno.errors.NotFound) {
        console.log('File not found, considering cleanup of database record');
        // Optionally delete the orphaned record
        // await supabaseClient.from('user_document_storage').delete().eq('id', documentStorageId);
      }
      
      throw new Error(`File not accessible: ${fileError.message}`);
    }

  } catch (error) {
    console.error('=== ERROR IN DOWNLOAD-VESSEL-DOCUMENT ===');
    console.error('Error message:', error?.message || 'Unknown error');
    console.error('Full error:', error);
    
    return new Response(
      JSON.stringify({
        error: error?.message || 'Unknown error occurred',
        details: {
          timestamp: new Date().toISOString(),
          function: 'download-vessel-document'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});