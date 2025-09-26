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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      template_id, 
      vessel_id, 
      port_id, 
      refinery_id, 
      company_id 
    } = await req.json()

    console.log('Processing document template:', { 
      template_id, 
      vessel_id, 
      port_id, 
      refinery_id, 
      company_id 
    })

    // Get template details
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', template_id)
      .single()

    if (templateError || !template) {
      throw new Error('Template not found')
    }

    // Collect data from database based on provided IDs
    const dataToFill: Record<string, any> = {}

    // Fetch vessel data if vessel_id provided
    if (vessel_id) {
      const { data: vessel } = await supabase
        .from('vessels')
        .select('*')
        .eq('id', vessel_id)
        .single()
      
      if (vessel) {
        dataToFill.vessel_name = vessel.name
        dataToFill.vessel_type = vessel.type
        dataToFill.vessel_flag = vessel.flag
        dataToFill.vessel_imo = vessel.imo
        dataToFill.vessel_mmsi = vessel.mmsi
        dataToFill.vessel_deadweight = vessel.deadweight
        dataToFill.vessel_built_year = vessel.built_year
        dataToFill.vessel_length = vessel.length_overall
      }
    }

    // Fetch port data if port_id provided
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
        dataToFill.port_capacity = port.capacity
        dataToFill.port_depth = port.channel_depth
      }
    }

    // Fetch refinery data if refinery_id provided
    if (refinery_id) {
      const { data: refinery } = await supabase
        .from('refineries')
        .select('*')
        .eq('id', refinery_id)
        .single()
      
      if (refinery) {
        dataToFill.refinery_name = refinery.name
        dataToFill.refinery_country = refinery.country
        dataToFill.refinery_capacity = refinery.capacity
        dataToFill.refinery_type = refinery.type
      }
    }

    // Fetch company data if company_id provided
    if (company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', company_id)
        .single()
      
      if (company) {
        dataToFill.company_name = company.name
        dataToFill.company_address = company.address
        dataToFill.company_email = company.email
        dataToFill.company_phone = company.phone
        dataToFill.company_website = company.website
      }
    }

    // Add common fields
    dataToFill.date = new Date().toLocaleDateString()
    dataToFill.current_date = new Date().toLocaleDateString()
    dataToFill.timestamp = new Date().toISOString()
    dataToFill.current_time = new Date().toISOString()

    // Generate random data for missing fields
    const generateRandomData = (placeholder: string): string => {
      const normalizedPlaceholder = placeholder.toLowerCase()
      
      if (normalizedPlaceholder.includes('name')) {
        const names = ['Alpha Marine', 'Beta Shipping', 'Gamma Industries', 'Delta Corp', 'Epsilon Ltd']
        return names[Math.floor(Math.random() * names.length)]
      }
      
      if (normalizedPlaceholder.includes('email')) {
        const domains = ['example.com', 'company.org', 'business.net']
        const username = 'contact' + Math.floor(Math.random() * 1000)
        return `${username}@${domains[Math.floor(Math.random() * domains.length)]}`
      }
      
      if (normalizedPlaceholder.includes('phone')) {
        return `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`
      }
      
      if (normalizedPlaceholder.includes('number') || normalizedPlaceholder.includes('id')) {
        return Math.floor(Math.random() * 900000 + 100000).toString()
      }
      
      if (normalizedPlaceholder.includes('capacity') || normalizedPlaceholder.includes('weight')) {
        return (Math.floor(Math.random() * 900000 + 100000)).toLocaleString()
      }
      
      if (normalizedPlaceholder.includes('address')) {
        const addresses = [
          '123 Maritime Street, Port City',
          '456 Shipping Avenue, Harbor Town',
          '789 Commerce Boulevard, Trade Center',
          '321 Industrial Road, Business District'
        ]
        return addresses[Math.floor(Math.random() * addresses.length)]
      }
      
      // Default random text
      return `[Generated: ${placeholder}]`
    }

    // Fill all placeholders with data
    const placeholdersFilled: Record<string, string> = {}
    
    for (const placeholder of template.placeholders) {
      let value = ''
      
      // Check if we have data from database
      const fieldMapping = template.field_mappings[placeholder]
      if (fieldMapping && dataToFill[placeholder.toLowerCase().replace(/[^a-z0-9_]/g, '_')]) {
        value = dataToFill[placeholder.toLowerCase().replace(/[^a-z0-9_]/g, '_')]
      } else {
        // Generate random data
        value = generateRandomData(placeholder)
      }
      
      placeholdersFilled[placeholder] = value
    }

    // Download original template file
    const fileResponse = await fetch(template.file_url)
    if (!fileResponse.ok) {
      throw new Error(`Failed to download template file: ${fileResponse.statusText}`)
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    let fileContent = new TextDecoder().decode(fileBuffer)

    // Replace placeholders in the content
    for (const [placeholder, value] of Object.entries(placeholdersFilled)) {
      const patterns = [
        new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g'),
        new RegExp(`\\{${placeholder}\\}`, 'g'),
        new RegExp(`\\[${placeholder}\\]`, 'g'),
        new RegExp(`\\$\\{${placeholder}\\}`, 'g'),
        new RegExp(`@${placeholder}`, 'g'),
      ]
      
      for (const pattern of patterns) {
        fileContent = fileContent.replace(pattern, String(value))
      }
    }

    // For simplicity, we'll create a text version of the processed document
    // In a real implementation, you'd want to properly process the Word document format
    const processedFileName = `processed_${Date.now()}_${template.file_name.replace('.docx', '.txt')}`
    
    // Upload processed document
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(processedFileName, new TextEncoder().encode(fileContent), {
        contentType: 'text/plain'
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('user-documents')
      .getPublicUrl(processedFileName)

    // Record the processed document
    const { data: processedDoc, error: recordError } = await supabase
      .from('processed_documents')
      .insert({
        template_id,
        vessel_id,
        port_id,
        refinery_id,
        company_id,
        generated_file_url: publicUrl,
        processing_status: 'completed',
        placeholders_filled: placeholdersFilled,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (recordError) {
      console.error('Error recording processed document:', recordError)
      throw recordError
    }

    console.log('Document processing completed:', {
      processed_doc_id: processedDoc.id,
      placeholders_filled: Object.keys(placeholdersFilled).length
    })

    return new Response(
      JSON.stringify({
        success: true,
        processed_document_id: processedDoc.id,
        download_url: publicUrl,
        placeholders_filled: placeholdersFilled,
        message: `Document processed successfully with ${Object.keys(placeholdersFilled).length} placeholders filled`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in process-document-template function:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to process document template'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})