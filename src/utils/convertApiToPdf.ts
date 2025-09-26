/**
 * ConvertAPI utility for converting DOCX files to PDF
 * Uses the ConvertAPI service to perform server-side conversion
 */

const CONVERT_API_TOKEN = 'F8zsB9J6lZNSHvqorheJ6DM0q3HllrUV';
const CONVERT_API_URL = 'https://v2.convertapi.com/convert/docx/to/pdf';

/**
 * Test ConvertAPI connectivity and authentication
 */
export async function testConvertApiConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Testing ConvertAPI connection...');
    
    // Create a minimal DOCX file for testing
    // This is a basic DOCX structure in base64
    const minimalDocxBase64 = 'UEsDBBQAAAAIAOuAOVcAAAAAAAAAAAAAAAALAAAAX3JlbHMvLnJlbHOtksFqwzAMhu+DvYPRfXGSdqNMXUqhNGOw0V1qyLZsW6wkY8nd9+0KG2Mw2A5jf/r/T/LNvBuPJwRKp1KzjBVSFCKRquuVXl/f7+8AUhqNTYy1cqLuPHuIRAAEo5zf+AC5rOhAVQeOKWdkEW9LG2/f9jzGttVn9Ti/2TQpNAjvrW2GekahOOdKS4soEZByCnTBMob+OjCWx8DCATa1Oq9RqIgQy7nUg6bqMsyQH6+E2lOQcqS11NrFMKmxCVbFdRg0f4+5/8ZqMzBuyXcfCr1eiJ3n9W+g1Hqn1+jT/wAAAP//AwBQSwMEFAAAAAgA64A5VwAAAAAAAAAAAAAAAA8AAAB3b3JkL2RvY3VtZW50LnhtbI2QwWrDMAyG74O9g9F9cZJ2o0xdSqE0Y7DRXWrItmxbrCRjyd337QobYzDYDmN/+v9P8s28G48nBEqnUrOMFVIUIpGq65VeX9/v7wBSGo1NjLVyou48e4hEAASjnN/4ALms6EBVB44pZ2QRb0sbb9/2PMa21Wf1OL/ZNCk0CO+tbYZ6RqE450pLiygRkHIKdMEyhv46MJbHwMIBNrU6r1GoiBDLudSDpuoyzJAfr4TaU5BypLXU2sUwqbEJVsV1GDR/j7n/xmozMG7Jdx8KvV6Inef1b6DUeqfX6NP/AAAA//8DAFBLAwQUAAAACADrgDlXAAAAAAAAAAAAAAAAEQAAAHdvcmQvZG9jdW1lbnQueG1sAQAA//8DAFBLAQIUABQAAAAIAOuAOVcAAAAAAAAAAAAAAAALAAAAAAAAAAAAAAAAAAAAX3JlbHMvLnJlbHNQSwECFAAUAAAACADrgDlXAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAADwAAAB3b3JkL2RvY3VtZW50LnhtbFBLAQIUABQAAAAIAOuAOVcAAAAAAAAAAAAAAAARAAAAAAAAAAAAAAAAfAAAAHdvcmQvZG9jdW1lbnQueG1sUEsFBgAAAAADAAMAtwAAAKwAAAAAAA==';
    
    // Convert base64 to blob
    const binaryString = atob(minimalDocxBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const testBlob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    
    const formData = new FormData();
    formData.append('File', testBlob, 'test.docx');
    formData.append('StoreFile', 'true');

    // Use the correct authentication method with Secret parameter
    const testUrl = `${CONVERT_API_URL}?Secret=${CONVERT_API_TOKEN}`;

    const response = await fetch(testUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('ConvertAPI test response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ConvertAPI test error:', errorText);
      return {
        success: false,
        error: `API test failed: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    console.log('ConvertAPI test successful:', result);
    
    return { success: true };
  } catch (error) {
    console.error('ConvertAPI test connection error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed'
    };
  }
}

export interface ConvertApiResponse {
  success: boolean;
  pdfUrl?: string;
  pdfBlob?: Blob;
  error?: string;
}

/**
 * Convert DOCX file to PDF using ConvertAPI
 * @param docxUrl - URL of the DOCX file to convert
 * @param filename - Optional filename for the converted PDF
 * @returns Promise with conversion result
 */
export async function convertDocxToPdfWithApi(
  docxUrl: string, 
  filename?: string
): Promise<ConvertApiResponse> {
  try {
    console.log('Starting DOCX to PDF conversion with ConvertAPI...');
    console.log('DOCX URL:', docxUrl);
    
    // First, fetch the DOCX file
    const docxResponse = await fetch(docxUrl);
    if (!docxResponse.ok) {
      throw new Error(`Failed to fetch DOCX file: ${docxResponse.statusText}`);
    }

    const docxBlob = await docxResponse.blob();
    console.log('DOCX file fetched, size:', docxBlob.size, 'bytes');
    
    // Prepare form data for ConvertAPI
    const formData = new FormData();
    formData.append('File', docxBlob, filename || 'document.docx');
    formData.append('StoreFile', 'true');

    console.log('Calling ConvertAPI...');
    
    // Call ConvertAPI with Secret parameter authentication
    const apiUrl = `${CONVERT_API_URL}?Secret=${CONVERT_API_TOKEN}`;
    const convertResponse = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('ConvertAPI response status:', convertResponse.status);

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      console.error('ConvertAPI error response:', errorText);
      throw new Error(`ConvertAPI error: ${convertResponse.status} - ${errorText}`);
    }

    const result = await convertResponse.json();
    console.log('ConvertAPI result:', result);
    
    // ConvertAPI typically returns the converted file URL in the response
    if (result.Files && result.Files.length > 0) {
      const pdfUrl = result.Files[0].Url;
      
      // Fetch the converted PDF
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to fetch converted PDF: ${pdfResponse.statusText}`);
      }

      const pdfArrayBuffer = await pdfResponse.arrayBuffer();
      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });

      console.log('PDF conversion successful:', {
        originalUrl: pdfUrl,
        blobSize: pdfBlob.size,
        blobType: pdfBlob.type
      });

      return {
        success: true,
        pdfUrl: pdfUrl,
        pdfBlob: pdfBlob,
      };
    } else {
      throw new Error('No converted file returned from ConvertAPI');
    }

  } catch (error) {
    console.error('ConvertAPI conversion error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      docxUrl: docxUrl,
      apiUrl: `${CONVERT_API_URL}?Secret=${CONVERT_API_TOKEN}`
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error',
    };
  }
}

/**
 * Download a blob as a file
 * @param blob - The blob to download
 * @param filename - The filename for the download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  console.log('Downloading blob:', {
    size: blob.size,
    type: blob.type,
    filename: filename
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert DOCX to PDF and trigger download
 * @param docxUrl - URL of the DOCX file to convert
 * @param filename - Filename for the downloaded PDF
 * @returns Promise with conversion result
 */
export async function convertAndDownloadPdf(
  docxUrl: string, 
  filename: string
): Promise<ConvertApiResponse> {
  const result = await convertDocxToPdfWithApi(docxUrl, filename);
  
  if (result.success && result.pdfBlob) {
    // Ensure filename has .pdf extension
    const pdfFilename = filename.endsWith('.pdf') ? filename : filename.replace(/\.[^.]*$/, '.pdf');
    downloadBlob(result.pdfBlob, pdfFilename);
  }
  
  return result;
}