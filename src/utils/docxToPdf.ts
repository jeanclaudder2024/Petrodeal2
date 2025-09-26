import mammoth from 'mammoth';
import jsPDF from 'jspdf';

export interface ConversionResult {
  success: boolean;
  pdfBlob?: Blob;
  error?: string;
}

export async function convertDocxToPdf(base64Data: string): Promise<ConversionResult> {
  try {
    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    // Convert DOCX to HTML using mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;

    // Create a temporary div to render HTML and measure content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.lineHeight = '1.4';
    tempDiv.style.padding = '20mm';
    document.body.appendChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Split content into pages
    const pageHeight = 297; // A4 height in mm
    const pageWidth = 210; // A4 width in mm
    const margin = 20; // 20mm margin
    const contentWidth = pageWidth - (2 * margin);
    const contentHeight = pageHeight - (2 * margin);

    // Get text content and split into lines
    const textContent = tempDiv.textContent || '';
    const lines = textContent.split('\n').filter(line => line.trim() !== '');
    
    let currentY = margin;
    let pageNumber = 1;

    // Add content to PDF
    pdf.setFontSize(12);
    
    for (const line of lines) {
      // Check if we need a new page
      if (currentY > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
        pageNumber++;
      }

      // Split long lines to fit page width
      const splitLines = pdf.splitTextToSize(line, contentWidth);
      
      for (const splitLine of splitLines) {
        if (currentY > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
          pageNumber++;
        }
        
        pdf.text(splitLine, margin, currentY);
        currentY += 7; // Line height
      }
      
      currentY += 3; // Paragraph spacing
    }

    // Clean up
    document.body.removeChild(tempDiv);

    // Convert PDF to blob
    const pdfBlob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });

    return {
      success: true,
      pdfBlob
    };

  } catch (error) {
    console.error('Error converting DOCX to PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}