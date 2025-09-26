import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== ANALYZE WORD TEMPLATE START ===')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    const { file_url, file_name, title, description, subscription_level } = requestBody

    console.log('Request data:', { file_url, file_name, title, description, subscription_level })

    if (!file_url || !file_name || !title) {
      throw new Error('Missing required fields: file_url, file_name, or title')
    }

    console.log('Downloading Word document from:', file_url)

    // Download the Word document with better error handling
    const fileResponse = await fetch(file_url)
    console.log('File response status:', fileResponse.status, fileResponse.statusText)
    
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status} ${fileResponse.statusText}`)
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const fileSize = fileBuffer.byteLength
    console.log('Downloaded file size:', fileSize, 'bytes')

    if (fileSize === 0) {
      throw new Error('Downloaded file is empty')
    }

    // Extract text from .docx file using proper JSZip parsing
    let textContent = ''
    let extractionMethod = 'unknown'
    
    try {
      console.log('Attempting to extract text from DOCX file using JSZip...')
      
      // Import JSZip for proper DOCX parsing
      const JSZip = (await import("https://esm.sh/jszip@3.10.1")).default;
      
      // Load the DOCX file as a zip
      const zip = await JSZip.loadAsync(fileBuffer)
      
      // Get the main document content
      const documentXml = await zip.file("word/document.xml")?.async("string")
      
      if (documentXml) {
        console.log('Successfully extracted document.xml from DOCX')
        
        // Extract text from Word XML, preserving placeholders
        // Word stores text in <w:t> elements
        const textMatches = []
        const wordTextPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g
        let match
        
        while ((match = wordTextPattern.exec(documentXml)) !== null) {
          const text = match[1]
          if (text && text.trim().length > 0) {
            textMatches.push(text)
          }
        }
        
        if (textMatches.length > 0) {
          textContent = textMatches.join(' ')
          extractionMethod = 'jszip_word_xml'
          console.log('Extracted text from Word XML tags:', textMatches.length, 'segments')
        } else {
          // Fallback: extract all text between XML tags
          const generalTextPattern = />([^<]+)</g
          const generalMatches = []
          
          while ((match = generalTextPattern.exec(documentXml)) !== null) {
            const text = match[1]?.trim()
            if (text && text.length > 0 && /[a-zA-Z0-9{}[\]()_-]/.test(text)) {
              generalMatches.push(text)
            }
          }
          
          if (generalMatches.length > 0) {
            textContent = generalMatches.join(' ')
            extractionMethod = 'jszip_general_xml'
            console.log('Extracted text from general XML tags:', generalMatches.length, 'segments')
          }
        }
      } else {
        console.log('Could not find document.xml in DOCX file')
        extractionMethod = 'no_document_xml'
      }
      
      // Clean up the extracted text while preserving placeholder characters
      textContent = textContent
        .replace(/\s+/g, ' ')
        .trim()
      
      console.log(`Final extracted text (method: ${extractionMethod}):`, textContent.length, 'characters')
      
      // Show a sample of the extracted text for debugging
      if (textContent.length > 0) {
        const sample = textContent.substring(0, 500) + (textContent.length > 500 ? '...' : '')
        console.log('Text sample:', sample)
      }
      
      if (textContent.length === 0) {
        console.log('WARNING: No text could be extracted from the document')
        textContent = 'No extractable text found'
        extractionMethod = 'no_text_found'
      }
      
    } catch (e) {
      console.log('JSZip text extraction failed:', e instanceof Error ? e.message : 'Unknown error')
      extractionMethod = 'failed'
      textContent = 'Text extraction failed'
    }

    // Extract placeholders using comprehensive patterns
    const placeholderPatterns = [
      { name: 'Single Braces', pattern: /\{([^}]+)\}/g },        // {placeholder}
      { name: 'Double Braces', pattern: /\{\{([^}]+)\}\}/g },     // {{placeholder}}
      { name: 'Square Brackets', pattern: /\[([^\]]+)\]/g },     // [placeholder]
      { name: 'Dollar Braces', pattern: /\$\{([^}]+)\}/g },      // ${placeholder}
      { name: 'At Symbol', pattern: /@([A-Za-z_][A-Za-z0-9_]*)/g }, // @placeholder
    ]

    const placeholders = new Set<string>()
    const patternResults: Record<string, string[]> = {}
    
    console.log('Searching for placeholders in text...')
    console.log('Text to search length:', textContent.length)
    
    for (const { name, pattern } of placeholderPatterns) {
      const matches: string[] = []
      let match
      const regex = new RegExp(pattern.source, pattern.flags)
      
      while ((match = regex.exec(textContent)) !== null) {
        const placeholder = match[1]?.trim()
        
        // Improved filtering for maritime document placeholders
        if (placeholder && 
            placeholder.length >= 2 && 
            placeholder.length < 100 &&
            /^[a-zA-Z0-9_\s\-\.]+$/.test(placeholder) && // Allow common placeholder characters
            !/^\d+$/.test(placeholder.trim()) && // Not just numbers
            /[a-zA-Z]/.test(placeholder) // Must contain at least one letter
        ) {
          placeholders.add(placeholder)
          matches.push(placeholder)
        }
      }
      
      patternResults[name] = matches
      if (matches.length > 0) {
        console.log(`Found ${matches.length} ${name} placeholders:`, matches)
      }
    }
    
    // Additional search for common maritime placeholders that might be missed
    const maritimePlaceholders = [
      'vessel name', 'ship name', 'imo number', 'vessel type', 'flag state',
      'port of loading', 'port of discharge', 'cargo type', 'cargo quantity',
      'bill of lading', 'charter party', 'laytime', 'demurrage', 'freight rate',
      'loading date', 'discharge date', 'owner name', 'operator name'
    ]
    
    for (const maritime of maritimePlaceholders) {
      if (textContent.toLowerCase().includes(maritime)) {
        // Look for this term in various placeholder formats
        const maritimeRegex = new RegExp(`[\\{\\[<_#|]([^\\}\\]>_#|]*${maritime.replace(/\s+/g, '\\s*')}[^\\}\\]>_#|]*)[\\}\\]>_#|]`, 'gi')
        let match
        while ((match = maritimeRegex.exec(textContent)) !== null) {
          const placeholder = match[1]?.trim()
          if (placeholder && placeholder.length > 0) {
            placeholders.add(placeholder)
            patternResults['Maritime Terms'] = patternResults['Maritime Terms'] || []
            patternResults['Maritime Terms'].push(placeholder)
          }
        }
      }
    }

    const placeholderArray = Array.from(placeholders)
    console.log('Total unique placeholders found:', placeholderArray.length)

    // Define available fields for mapping with maritime focus
    const availableFields = [
      // Vessel fields
      'name', 'imo', 'mmsi', 'callsign', 'flag', 'built', 'deadweight', 'length', 'beam', 'draft', 
      'speed', 'status', 'vessel_type', 'gross_tonnage', 'net_tonnage', 'owner_name', 'operator_name',
      'manager_name', 'class_society', 'engine_power', 'cargo_capacity',
      
      // Port fields  
      'port_name', 'port_country', 'port_city', 'port_region', 'port_type',
      'port_address', 'port_phone', 'port_email', 'port_website', 'capacity',
      'max_draught', 'berth_count', 'terminal_count',
      
      // Company fields
      'company_name', 'company_country', 'city', 'address',
      'phone', 'email', 'website', 'ceo_name',
      'founded_year', 'employees_count', 'annual_revenue', 'industry',
      
      // Refinery fields
      'refinery_name', 'refinery_country', 'refinery_city', 'refinery_address',
      'processing_capacity', 'refinery_type', 'owner', 'operator',
      'year_built',
      
      // Date/time fields
      'current_date', 'current_time', 'current_year', 'current_month', 'current_day'
    ]

    // Use OpenAI to intelligently analyze placeholders and suggest mappings
    const aiAnalysis = await analyzeWithOpenAI(placeholderArray, availableFields)
    console.log('AI Analysis completed')

    // Combine AI suggestions with rule-based mapping
    const fieldMappings: Record<string, string> = {}
    const matchedFields: string[] = []
    const missingFields: string[] = []
    const aiSuggestions = aiAnalysis.suggestions || []

    for (const placeholder of placeholderArray) {
      // Check if AI provided a suggestion for this placeholder
      const aiSuggestion = aiSuggestions.find((s: any) => 
        s.placeholder.toLowerCase() === placeholder.toLowerCase()
      )
      
      if (aiSuggestion && aiSuggestion.mapped_field && availableFields.includes(aiSuggestion.mapped_field)) {
        fieldMappings[placeholder] = aiSuggestion.mapped_field
        matchedFields.push(aiSuggestion.mapped_field)
      } else {
        // Fallback to rule-based matching
        const cleanPlaceholder = placeholder.toLowerCase().replace(/[^a-z0-9_]/g, '_')
        
        let matchedField = availableFields.find(field => 
          field.toLowerCase() === cleanPlaceholder ||
          field.toLowerCase().includes(cleanPlaceholder) ||
          cleanPlaceholder.includes(field.toLowerCase())
        )
        
        if (!matchedField) {
          if (cleanPlaceholder.includes('vessel') || cleanPlaceholder.includes('ship')) {
            matchedField = availableFields.find(f => f.startsWith('vessel_'))
          } else if (cleanPlaceholder.includes('port')) {
            matchedField = availableFields.find(f => f.startsWith('port_'))
          } else if (cleanPlaceholder.includes('company')) {
            matchedField = availableFields.find(f => f.startsWith('company_'))
          } else if (cleanPlaceholder.includes('refinery')) {
            matchedField = availableFields.find(f => f.startsWith('refinery_'))
          } else if (cleanPlaceholder.includes('date') || cleanPlaceholder.includes('time')) {
            matchedField = availableFields.find(f => f.includes('date') || f.includes('time'))
          }
        }

        if (matchedField) {
          fieldMappings[placeholder] = matchedField
          matchedFields.push(matchedField)
        } else {
          missingFields.push(placeholder)
        }
      }
    }

    console.log('Field mapping results:', { matchedFields: matchedFields.length, missingFields: missingFields.length })

    const analysisResult = {
      total_placeholders: placeholderArray.length,
      matched_fields: matchedFields,
      missing_fields: missingFields,
      pattern_breakdown: patternResults,
      ai_analysis: aiAnalysis,
      suggestions: aiSuggestions,
      confidence_score: aiAnalysis.confidence_score || 0,
      extraction_method: extractionMethod,
      text_sample: textContent.substring(0, 500),
      text_length: textContent.length,
      debugging_info: {
        extraction_method: extractionMethod,
        patterns_searched: placeholderPatterns.length,
        text_extracted: textContent.length > 0,
        sample_text: textContent.substring(0, 200)
      }
    }

    // Save template to database
    const { data: template, error: dbError } = await supabase
      .from('document_templates')
      .insert({
        title,
        description: description || '',
        file_url,
        file_name,
        placeholders: placeholderArray,
        field_mappings: fieldMappings,
        analysis_result: analysisResult,
        subscription_level: subscription_level || 'basic',
        is_active: true,
        created_by: null // Will be set by RLS if user is authenticated
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Database error: ${dbError.message}`)
    }

    console.log('Template saved successfully with ID:', template.id)

    return new Response(
      JSON.stringify({
        success: true,
        template_id: template.id,
        placeholders: placeholderArray,
        analysis_result: analysisResult,
        field_mappings: fieldMappings,
        ai_analysis: aiAnalysis
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('=== ERROR IN ANALYZE FUNCTION ===')
    console.error('Error details:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to analyze Word template. Please ensure the file is a valid .docx document and try again.',
        debug_info: {
          error_type: error instanceof Error ? error.constructor.name : typeof error,
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// AI Analysis Function using OpenAI
async function analyzeWithOpenAI(placeholders: string[], availableFields: string[]) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openAIApiKey) {
    console.log('OpenAI API key not found, skipping AI analysis')
    return {
      success: false,
      suggestions: [],
      confidence_score: 0,
      analysis_summary: 'AI analysis unavailable - no API key'
    }
  }

  try {
    console.log('Starting OpenAI analysis of placeholders...')
    
    const prompt = `You are an expert data mapping analyst for a maritime oil trading platform. 

TASK: Analyze Word document placeholders and map them to database fields.

PLACEHOLDERS FOUND IN DOCUMENT:
${placeholders.map(p => `"${p}"`).join(', ')}

AVAILABLE DATABASE FIELDS:
${availableFields.join(', ')}

INSTRUCTIONS:
1. For each placeholder, suggest the BEST matching database field
2. Consider maritime industry terminology and common document patterns
3. Look for semantic meaning, not just text similarity
4. If no good match exists, suggest "no_match"
5. Provide confidence score (0-100) for each mapping
6. Give an overall analysis summary

RESPOND IN THIS EXACT JSON FORMAT:
{
  "suggestions": [
    {
      "placeholder": "placeholder_name",
      "mapped_field": "database_field_name",
      "confidence": 85,
      "reasoning": "explanation for this mapping"
    }
  ],
  "confidence_score": 75,
  "analysis_summary": "Brief summary of the analysis",
  "recommendations": "What user should do next"
}

Be precise and focus on maritime/oil trading context.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert data analyst specializing in maritime document processing and database field mapping.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    console.log('OpenAI raw response:', aiResponse)

    // Parse AI response
    try {
      const analysisResult = JSON.parse(aiResponse)
      console.log('AI analysis parsed successfully')
      return analysisResult
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return {
        success: false,
        suggestions: [],
        confidence_score: 0,
        analysis_summary: 'AI response could not be parsed',
        raw_response: aiResponse
      }
    }

  } catch (error) {
    console.error('OpenAI analysis error:', error)
    return {
      success: false,
      suggestions: [],
      confidence_score: 0,
      analysis_summary: `AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}