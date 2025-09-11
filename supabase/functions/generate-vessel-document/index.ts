import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple PDF generation function using basic PDF structure
async function generateSimplePDF(title: string, vesselInfo: any, content: string): Promise<string> {
  // Create a basic PDF structure
  const pdfHeader = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length `;
  
  // Clean HTML content and convert to plain text
  const cleanContent = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
  
  // Create PDF content stream
  const textContent = `BT
/F1 12 Tf
50 750 Td
(${title}) Tj
0 -20 Td
(Vessel: ${vesselInfo.name}) Tj
0 -20 Td
(IMO: ${vesselInfo.imo}) Tj
0 -20 Td
(MMSI: ${vesselInfo.mmsi}) Tj
0 -40 Td
`;
  
  // Add content lines
  const lines = cleanContent.split('\n').slice(0, 30); // Limit to 30 lines
  let yPosition = 650;
  let contentLines = '';
  
  for (const line of lines) {
    if (line.trim() && yPosition > 50) {
      const cleanLine = line.trim().substring(0, 80); // Limit line length
      contentLines += `(${cleanLine}) Tj\n0 -15 Td\n`;
      yPosition -= 15;
    }
  }
  
  const pdfContent = textContent + contentLines + 'ET';
  const contentLength = pdfContent.length;
  
  const pdfBody = `${contentLength}>>
stream
${pdfContent}
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000380 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
492
%%EOF`;
  
  return pdfHeader + pdfBody;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { documentId, vesselId, vesselData } = await req.json()
    
    console.log('=== EDGE FUNCTION DOCUMENT GENERATION DEBUG ===')
    console.log('Received request:', { documentId, vesselId, vesselData })
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }
    
    // Fetch document template with ai_prompt
    const { data: documentTemplate, error: docError } = await supabase
      .from('vessel_documents')
      .select('id, title, description, ai_prompt')
      .eq('id', documentId)
      .single()
    
    if (docError || !documentTemplate) {
      throw new Error(`Document template not found: ${docError?.message}`)
    }
    
    console.log('Document template found:', {
      id: documentTemplate.id,
      title: documentTemplate.title,
      description: documentTemplate.description,
      ai_prompt: documentTemplate.ai_prompt ? 'Present' : 'Missing'
    })
    
    // Use custom ai_prompt if available, otherwise use default
    const customPrompt = documentTemplate.ai_prompt || `Generate a professional vessel document for ${documentTemplate.title}. Include all relevant vessel information and format it professionally.`
    
    console.log('Using AI prompt:', customPrompt.substring(0, 100) + '...')
    
    // Prepare vessel data for AI
    const vesselInfo = {
      name: vesselData?.name || 'Unknown Vessel',
      imo: vesselData?.imo || 'N/A',
      mmsi: vesselData?.mmsi || 'N/A',
      vessel_type: vesselData?.vessel_type || 'N/A',
      flag: vesselData?.flag || 'N/A',
      built: vesselData?.built || 'N/A',
      deadweight: vesselData?.deadweight || 'N/A',
      current_lat: vesselData?.current_lat || 'N/A',
      current_lng: vesselData?.current_lng || 'N/A',
      speed: vesselData?.speed || 'N/A',
      status: vesselData?.status || 'N/A',
      cargo_type: vesselData?.cargo_type || 'N/A',
      cargo_quantity: vesselData?.cargo_quantity || 'N/A'
    }
    
    // Generate document content using OpenAI with custom prompt
    const aiPrompt = `${customPrompt}

Vessel Information:
${JSON.stringify(vesselInfo, null, 2)}

Please generate a comprehensive document in HTML format that can be converted to PDF. Include proper styling and structure.`
    
    console.log('Calling OpenAI with custom prompt...')
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional maritime document generator. Create detailed, accurate vessel documents in HTML format with proper styling.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    })
    
    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${openAIResponse.status}`)
    }
    
    const aiResult = await openAIResponse.json()
    const generatedContent = aiResult.choices[0].message.content
    
    console.log('AI generated content length:', generatedContent.length)
    
    // Convert HTML to PDF using jsPDF approach
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${documentTemplate.title} - ${vesselInfo.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            h2 { color: #34495e; margin-top: 30px; }
            .vessel-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; color: #2c3e50; }
            .value { color: #34495e; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
        </style>
    </head>
    <body>
        ${generatedContent}
    </body>
    </html>
    `
    
    // Generate a simple PDF-like content using text formatting
    // Since we don't have access to proper PDF libraries in Deno edge functions,
    // we'll create a structured text document that can be downloaded as PDF
    const pdfContent = await generateSimplePDF(documentTemplate.title, vesselInfo, generatedContent)
    const base64Content = btoa(pdfContent)
    
    const fileName = `${documentTemplate.title.replace(/[^a-zA-Z0-9]/g, '_')}_${vesselInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`
    
    console.log('Document generated successfully:', fileName)
    console.log('=== END EDGE FUNCTION DEBUG ===')
    
    return new Response(
      JSON.stringify({
        success: true,
        fileName: fileName + '.pdf',
        content: base64Content,
        contentType: 'application/pdf'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
    
  } catch (error) {
    console.error('Error in generate-vessel-document function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})