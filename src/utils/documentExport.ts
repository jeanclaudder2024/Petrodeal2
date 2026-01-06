import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } from 'docx';
import { toast } from 'sonner';

/**
 * Copy formatted HTML content to clipboard for pasting into Word
 */
export const copyFormattedHtml = async (html: string): Promise<boolean> => {
  try {
    // Try modern Clipboard API with HTML MIME type
    const blob = new Blob([html], { type: 'text/html' });
    await navigator.clipboard.write([
      new ClipboardItem({ 
        'text/html': blob,
        'text/plain': new Blob([html.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
      })
    ]);
    toast.success('Formatted content copied - paste into Word');
    return true;
  } catch (error) {
    console.log('Modern clipboard API failed, trying fallback:', error);
    
    // Fallback for older browsers
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      document.execCommand('copy');
      document.body.removeChild(tempDiv);
      
      toast.success('Content copied to clipboard');
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      toast.error('Failed to copy content');
      return false;
    }
  }
};

/**
 * Parse HTML and convert to docx elements
 */
const parseHtmlToDocxElements = (html: string): (Paragraph | Table)[] => {
  const elements: (Paragraph | Table)[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const processNode = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        elements.push(new Paragraph({
          children: [new TextRun(text)]
        }));
      }
      return;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    
    switch (tagName) {
      case 'h1':
        elements.push(new Paragraph({
          text: element.textContent || '',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }));
        break;
        
      case 'h2':
        elements.push(new Paragraph({
          text: element.textContent || '',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 }
        }));
        break;
        
      case 'h3':
        elements.push(new Paragraph({
          text: element.textContent || '',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        }));
        break;
        
      case 'p':
        elements.push(new Paragraph({
          children: parseInlineElements(element),
          spacing: { after: 120 }
        }));
        break;
        
      case 'strong':
      case 'b':
        elements.push(new Paragraph({
          children: [new TextRun({ text: element.textContent || '', bold: true })]
        }));
        break;
        
      case 'em':
      case 'i':
        elements.push(new Paragraph({
          children: [new TextRun({ text: element.textContent || '', italics: true })]
        }));
        break;
        
      case 'ul':
      case 'ol':
        Array.from(element.children).forEach((li, index) => {
          const bullet = tagName === 'ol' ? `${index + 1}. ` : '• ';
          elements.push(new Paragraph({
            children: [new TextRun(bullet + (li.textContent || ''))],
            indent: { left: 720 },
            spacing: { after: 60 }
          }));
        });
        break;
        
      case 'table':
        const tableElement = parseTable(element);
        if (tableElement) elements.push(tableElement);
        break;
        
      case 'br':
        elements.push(new Paragraph({ children: [] }));
        break;
        
      case 'hr':
        elements.push(new Paragraph({
          children: [new TextRun({ text: '─'.repeat(50) })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }));
        break;
        
      case 'div':
      case 'section':
      case 'article':
      case 'body':
        Array.from(element.childNodes).forEach(processNode);
        break;
        
      default:
        // For any other elements, just process children
        if (element.textContent?.trim()) {
          elements.push(new Paragraph({
            children: parseInlineElements(element)
          }));
        }
    }
  };
  
  Array.from(doc.body.childNodes).forEach(processNode);
  
  return elements;
};

/**
 * Parse inline elements (bold, italic, etc.) within a paragraph
 */
const parseInlineElements = (element: HTMLElement): TextRun[] => {
  const runs: TextRun[] = [];
  
  const processInline = (node: Node, bold = false, italic = false, underline = false): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) {
        runs.push(new TextRun({ text, bold, italics: italic, underline: underline ? {} : undefined }));
      }
      return;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    
    const newBold = bold || tag === 'strong' || tag === 'b';
    const newItalic = italic || tag === 'em' || tag === 'i';
    const newUnderline = underline || tag === 'u';
    
    Array.from(el.childNodes).forEach(child => processInline(child, newBold, newItalic, newUnderline));
  };
  
  Array.from(element.childNodes).forEach(node => processInline(node));
  
  return runs;
};

/**
 * Parse HTML table to docx Table
 */
const parseTable = (tableElement: HTMLElement): Table | null => {
  const rows: TableRow[] = [];
  
  const tableRows = tableElement.querySelectorAll('tr');
  if (tableRows.length === 0) return null;
  
  tableRows.forEach((tr) => {
    const cells: TableCell[] = [];
    const tds = tr.querySelectorAll('th, td');
    
    tds.forEach((td) => {
      const isHeader = td.tagName.toLowerCase() === 'th';
      cells.push(new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ 
            text: td.textContent || '', 
            bold: isHeader 
          })],
          alignment: AlignmentType.LEFT
        })],
        width: { size: 100 / tds.length, type: WidthType.PERCENTAGE },
        shading: isHeader ? { fill: 'E0E0E0' } : undefined
      }));
    });
    
    if (cells.length > 0) {
      rows.push(new TableRow({ children: cells }));
    }
  });
  
  if (rows.length === 0) return null;
  
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
};

/**
 * Generate and download DOCX file from HTML content
 */
export const downloadAsDocx = async (html: string, fileName: string): Promise<boolean> => {
  try {
    const elements = parseHtmlToDocxElements(html);
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: elements
      }]
    });
    
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('DOCX file downloaded successfully');
    return true;
  } catch (error) {
    console.error('Error generating DOCX:', error);
    toast.error('Failed to generate DOCX file');
    return false;
  }
};

/**
 * Generate and download PDF file from HTML content using print
 */
export const downloadAsPdf = (html: string, fileName: string): boolean => {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to download PDF');
      return false;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fileName}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { font-size: 18pt; font-weight: bold; margin: 24pt 0 12pt 0; }
            h2 { font-size: 16pt; font-weight: bold; margin: 18pt 0 10pt 0; }
            h3 { font-size: 14pt; font-weight: bold; margin: 14pt 0 8pt 0; }
            p { margin: 8pt 0; text-align: justify; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 16pt 0;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 8px; 
              text-align: left;
            }
            th { background-color: #f0f0f0; font-weight: bold; }
            ul, ol { margin: 8pt 0; padding-left: 24pt; }
            li { margin: 4pt 0; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    toast.success('PDF print dialog opened');
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF');
    return false;
  }
};
