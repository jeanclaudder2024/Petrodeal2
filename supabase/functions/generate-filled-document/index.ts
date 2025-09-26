import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateDocumentRequest {
  template_id: string
  vessel_id?: number
  port_id?: number
  company_id?: number
  refinery_id?: string
  output_format: 'docx' | 'pdf' | 'both'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { template_id, vessel_id, port_id, company_id, refinery_id, output_format } = await req.json() as GenerateDocumentRequest

    console.log('Generating document with params:', { template_id, vessel_id, port_id, company_id, refinery_id, output_format })

    // Get document template
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', template_id)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      console.error('Template not found:', templateError)
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Collect data from various sources
    const dataToFill: Record<string, any> = {}

    // Vessel data
    if (vessel_id) {
      const { data: vessel } = await supabase
        .from('vessels')
        .select('*')
        .eq('id', vessel_id)
        .single()
      
      if (vessel) {
        dataToFill.vessel_name = vessel.name
        dataToFill.vessel_imo = vessel.imo_number
        dataToFill.vessel_type = vessel.vessel_type
        dataToFill.vessel_flag = vessel.flag
        dataToFill.vessel_built_year = vessel.built_year
        dataToFill.vessel_dwt = vessel.deadweight
        dataToFill.vessel_length = vessel.length_overall
        dataToFill.vessel_beam = vessel.beam
        dataToFill.vessel_draft = vessel.draft
        dataToFill.vessel_gross_tonnage = vessel.gross_tonnage
        dataToFill.vessel_net_tonnage = vessel.net_tonnage
        dataToFill.vessel_owner = vessel.owner
        dataToFill.vessel_operator = vessel.operator
        dataToFill.vessel_manager = vessel.manager
        dataToFill.vessel_class_society = vessel.class_society
        dataToFill.vessel_engine_power = vessel.engine_power
        dataToFill.vessel_speed = vessel.speed
      }
    }

    // Port data
    if (port_id) {
      const { data: port } = await supabase
        .from('ports')
        .select('*')
        .eq('id', port_id)
        .single()
      
      if (port) {
        dataToFill.port_name = port.name
        dataToFill.port_country = port.country
        dataToFill.port_city = port.city
        dataToFill.port_region = port.region
        dataToFill.port_type = port.port_type
        dataToFill.port_address = port.address
        dataToFill.port_phone = port.phone
        dataToFill.port_email = port.email
        dataToFill.port_website = port.website
        dataToFill.port_capacity = port.capacity
        dataToFill.port_depth = port.channel_depth
        dataToFill.port_berths = port.berth_count
        dataToFill.port_terminals = port.terminal_count
      }
    }

    // Company data
    if (company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', company_id)
        .single()
      
      if (company) {
        dataToFill.company_name = company.name
        dataToFill.company_country = company.country
        dataToFill.company_city = company.city
        dataToFill.company_address = company.address
        dataToFill.company_phone = company.phone
        dataToFill.company_email = company.email
        dataToFill.company_website = company.website
        dataToFill.company_ceo = company.ceo_name
        dataToFill.company_founded = company.founded_year
        dataToFill.company_employees = company.employees_count
        dataToFill.company_revenue = company.annual_revenue
        dataToFill.company_industry = company.industry
      }
    }

    // Refinery data
    if (refinery_id) {
      const { data: refinery } = await supabase
        .from('refineries')
        .select('*')
        .eq('id', refinery_id)
        .single()
      
      if (refinery) {
        dataToFill.refinery_name = refinery.name
        dataToFill.refinery_country = refinery.country
        dataToFill.refinery_city = refinery.city
        dataToFill.refinery_address = refinery.address
        dataToFill.refinery_capacity = refinery.capacity
        dataToFill.refinery_type = refinery.type
        dataToFill.refinery_owner = refinery.owner
        dataToFill.refinery_operator = refinery.operator
        dataToFill.refinery_built_year = refinery.year_built
      }
    }

    // Add current date and time
    const now = new Date()
    dataToFill.current_date = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    dataToFill.current_time = now.toLocaleTimeString('en-US')
    dataToFill.current_year = now.getFullYear()
    dataToFill.current_month = now.toLocaleDateString('en-US', { month: 'long' })
    dataToFill.current_day = now.getDate()

    // Download the template file
    const templateResponse = await fetch(template.file_url)
    if (!templateResponse.ok) {
      throw new Error('Failed to download template')
    }
    
    const templateBuffer = await templateResponse.arrayBuffer()
    let fileContent = new TextDecoder().decode(templateBuffer)

    // Replace placeholders with actual data
    const placeholders = template.placeholders as string[] || []
    
    for (const placeholder of placeholders) {
      const cleanPlaceholder = placeholder.replace(/[{}[\]]/g, '')
      const value = dataToFill[cleanPlaceholder] || `[${cleanPlaceholder}]`
      
      // Replace various placeholder formats
      const patterns = [
        new RegExp(`\\{${cleanPlaceholder}\\}`, 'gi'),
        new RegExp(`\\{\\{${cleanPlaceholder}\\}\\}`, 'gi'),
        new RegExp(`\\[${cleanPlaceholder}\\]`, 'gi'),
        new RegExp(`\\$\\{${cleanPlaceholder}\\}`, 'gi')
      ]
      
      for (const pattern of patterns) {
        fileContent = fileContent.replace(pattern, String(value))
      }
    }

    // Convert content back to buffer
    const processedBuffer = new TextEncoder().encode(fileContent)
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const baseFileName = `processed-${template.title}-${timestamp}`
    
    const results: any = {}

    // Upload processed Word document
    if (output_format === 'docx' || output_format === 'both') {
      const wordFileName = `${baseFileName}.docx`
      
      const { data: wordUpload, error: wordUploadError } = await supabase.storage
        .from('user-documents')
        .upload(wordFileName, processedBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        })

      if (wordUploadError) {
        console.error('Error uploading Word document:', wordUploadError)
        throw new Error('Failed to upload processed Word document')
      }

      const { data: { publicUrl: wordPublicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(wordFileName)

      results.docx_url = wordPublicUrl
    }

    // For PDF generation, we'll create a simple HTML version and convert
    if (output_format === 'pdf' || output_format === 'both') {
      // Create HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${template.title}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
              .header { text-align: center; margin-bottom: 30px; }
              .content { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${template.title}</h1>
              <p>Generated on ${dataToFill.current_date}</p>
            </div>
            <div class="content">
              ${fileContent.replace(/\n/g, '<br>')}
            </div>
          </body>
        </html>
      `
      
      const htmlFileName = `${baseFileName}.html`
      const htmlBuffer = new TextEncoder().encode(htmlContent)
      
      const { data: htmlUpload, error: htmlUploadError } = await supabase.storage
        .from('user-documents')
        .upload(htmlFileName, htmlBuffer, {
          contentType: 'text/html'
        })

      if (htmlUploadError) {
        console.error('Error uploading HTML document:', htmlUploadError)
      } else {
        const { data: { publicUrl: htmlPublicUrl } } = supabase.storage
          .from('user-documents')
          .getPublicUrl(htmlFileName)

        results.pdf_url = htmlPublicUrl // For now, return HTML URL as PDF alternative
      }
    }

    // Save processing record
    const { data: processedDoc, error: insertError } = await supabase
      .from('processed_documents')
      .insert({
        template_id,
        vessel_id,
        port_id,
        company_id,
        refinery_id,
        processing_status: 'completed',
        generated_file_url: results.docx_url || results.pdf_url,
        placeholders_filled: dataToFill,
        created_by: req.headers.get('user-id') || null,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving processed document record:', insertError)
    }

    return new Response(JSON.stringify({
      success: true,
      document_id: processedDoc?.id,
      results,
      placeholders_filled: Object.keys(dataToFill).length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error generating document:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})