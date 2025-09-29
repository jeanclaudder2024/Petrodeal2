/**
 * Utility functions for converting DOCX files to PDF using ConvertAPI
 */

// You may need to install axios if not already installed: npm install axios
import axios from 'axios';
import { toast } from 'sonner';

// ConvertAPI configuration
const CONVERT_API_SECRET = import.meta.env.VITE_CONVERT_API_SECRET || '';
const CONVERT_API_BASE_URL = 'https://v2.convertapi.com';

/**
 * Test the connection to ConvertAPI
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function testConvertApiConnection(): Promise<{success: boolean, error?: string}> {
  try {
    if (!CONVERT_API_SECRET) {
      return { success: false, error: 'ConvertAPI secret is not configured' };
    }

    // Simple test call to ConvertAPI
    const response = await axios.get(`${CONVERT_API_BASE_URL}/user?Secret=${CONVERT_API_SECRET}`);
    
    if (response.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: `Unexpected status: ${response.status}` };
    }
  } catch (error) {
    console.error('ConvertAPI connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Convert a DOCX file to PDF and download it
 * @param {Blob} docxBlob - The DOCX file as a Blob
 * @param {string} fileName - The name to use for the downloaded file
 * @returns {Promise<boolean>} - Whether the conversion was successful
 */
export async function convertAndDownloadPdf(docxBlob: Blob, fileName: string): Promise<boolean> {
  try {
    if (!CONVERT_API_SECRET) {
      toast.error('ConvertAPI secret is not configured');
      return false;
    }

    // Create form data for the API request
    const formData = new FormData();
    formData.append('File', docxBlob, 'document.docx');
    formData.append('StoreFile', 'true');
    
    // Call ConvertAPI to convert DOCX to PDF
    const response = await axios.post(
      `${CONVERT_API_BASE_URL}/convert/docx/to/pdf?Secret=${CONVERT_API_SECRET}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.status === 200 && response.data && response.data.Files && response.data.Files.length > 0) {
      // Get the URL of the converted PDF
      const pdfUrl = response.data.Files[0].Url;
      
      // Download the PDF
      const pdfResponse = await axios.get(pdfUrl, { responseType: 'blob' });
      const pdfBlob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      
      // Create a download link and trigger the download
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName.replace('.docx', '.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success('PDF conversion successful');
      return true;
    } else {
      toast.error('PDF conversion failed: Invalid response from ConvertAPI');
      return false;
    }
  } catch (error) {
    console.error('PDF conversion error:', error);
    toast.error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}