/**
 * Utility functions for converting DOCX files to PDF using ConvertAPI
 * Now uses server-side edge function to protect API secret
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Test the connection to ConvertAPI via edge function
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function testConvertApiConnection(): Promise<{success: boolean, error?: string}> {
  try {
    const { data, error } = await supabase.functions.invoke('convert-document', {
      body: { action: 'test' },
    });

    if (error) {
      console.error('ConvertAPI connection test failed:', error);
      return { success: false, error: error.message };
    }

    return { success: data?.success ?? false, error: data?.error };
  } catch (error) {
    console.error('ConvertAPI connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Convert a DOCX file to PDF and download it via edge function
 * @param {Blob} docxBlob - The DOCX file as a Blob
 * @param {string} fileName - The name to use for the downloaded file
 * @returns {Promise<boolean>} - Whether the conversion was successful
 */
export async function convertAndDownloadPdf(docxBlob: Blob, fileName: string): Promise<boolean> {
  try {
    // Convert blob to base64
    const arrayBuffer = await docxBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const docxBase64 = btoa(binary);

    const { data, error } = await supabase.functions.invoke('convert-document', {
      body: { 
        action: 'convert',
        docxBase64,
        fileName,
      },
    });

    if (error) {
      console.error('PDF conversion error:', error);
      toast.error(`PDF conversion failed: ${error.message}`);
      return false;
    }

    if (!data?.success) {
      toast.error(data?.error || 'PDF conversion failed');
      return false;
    }

    // Download PDF from the URL or use base64 data
    if (data.pdfUrl) {
      const pdfResponse = await fetch(data.pdfUrl);
      const pdfBlob = await pdfResponse.blob();
      
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = data.fileName || fileName.replace('.docx', '.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } else if (data.pdfBase64) {
      // Fallback to base64 if URL not available
      const pdfBlob = new Blob(
        [Uint8Array.from(atob(data.pdfBase64), c => c.charCodeAt(0))],
        { type: 'application/pdf' }
      );
      
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = data.fileName || fileName.replace('.docx', '.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }

    toast.success('PDF conversion successful');
    return true;
  } catch (error) {
    console.error('PDF conversion error:', error);
    toast.error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}
