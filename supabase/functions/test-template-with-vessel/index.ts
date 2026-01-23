import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateId, vesselId } = await req.json();

    if (!templateId || !vesselId) {
      return new Response(
        JSON.stringify({ error: 'templateId and vesselId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('document_saved_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.error('Template error:', templateError);
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch vessel with all related data
    const { data: vessel, error: vesselError } = await supabase
      .from('vessels')
      .select('*')
      .eq('id', vesselId)
      .single();

    if (vesselError || !vessel) {
      console.error('Vessel error:', vesselError);
      return new Response(
        JSON.stringify({ error: 'Vessel not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch related data
    let buyerCompany = null;
    let sellerCompany = null;
    let departurePort = null;
    let destinationPort = null;
    let refinery = null;

    // Fetch buyer company if buyer_company_id exists
    if (vessel.buyer_company_id) {
      const { data } = await supabase
        .from('buyer_companies')
        .select('*')
        .eq('id', vessel.buyer_company_id)
        .single();
      buyerCompany = data;
    }

    // Fetch seller company if seller_company_id exists
    if (vessel.seller_company_id) {
      const { data } = await supabase
        .from('seller_companies')
        .select('*')
        .eq('id', vessel.seller_company_id)
        .single();
      sellerCompany = data;
    }

    // Fetch departure port
    if (vessel.departure_port_id) {
      const { data } = await supabase
        .from('ports')
        .select('*')
        .eq('id', vessel.departure_port_id)
        .single();
      departurePort = data;
    }

    // Fetch destination port
    if (vessel.destination_port_id) {
      const { data } = await supabase
        .from('ports')
        .select('*')
        .eq('id', vessel.destination_port_id)
        .single();
      destinationPort = data;
    }

    // Fetch refinery if exists
    if (vessel.refinery_id) {
      const { data } = await supabase
        .from('refineries')
        .select('*')
        .eq('id', vessel.refinery_id)
        .single();
      refinery = data;
    }

    // Build placeholder mappings from database
    const placeholderMappings: Record<string, string> = {
      // Vessel fields
      '{{vessel_name}}': vessel.name || '',
      '{{vessel_imo}}': vessel.imo || '',
      '{{vessel_mmsi}}': vessel.mmsi || '',
      '{{vessel_flag}}': vessel.flag || '',
      '{{vessel_type}}': vessel.vessel_type || '',
      '{{vessel_deadweight}}': vessel.deadweight?.toString() || '',
      '{{cargo_capacity}}': vessel.cargo_capacity?.toString() || '',
      '{{cargo_type}}': vessel.cargo_type || '',
      '{{commodity_name}}': vessel.commodity_name || '',
      '{{vessel_status}}': vessel.status || '',
      '{{vessel_year_built}}': vessel.year_built?.toString() || '',
      '{{vessel_length}}': vessel.length?.toString() || '',
      '{{vessel_width}}': vessel.width?.toString() || '',
      '{{vessel_gross_tonnage}}': vessel.gross_tonnage?.toString() || '',
      
      // Buyer company fields
      '{{buyer_name}}': buyerCompany?.name || '',
      '{{buyer_company}}': buyerCompany?.name || '',
      '{{buyer_country}}': buyerCompany?.country || '',
      '{{buyer_address}}': buyerCompany?.address || '',
      '{{buyer_city}}': buyerCompany?.city || '',
      '{{buyer_email}}': buyerCompany?.email || '',
      '{{buyer_phone}}': buyerCompany?.phone || '',
      '{{buyer_representative}}': buyerCompany?.representative_name || '',
      '{{buyer_representative_title}}': buyerCompany?.representative_title || '',
      '{{buyer_registration_number}}': buyerCompany?.registration_number || '',
      
      // Seller company fields
      '{{seller_name}}': sellerCompany?.name || '',
      '{{seller_company}}': sellerCompany?.name || '',
      '{{seller_country}}': sellerCompany?.country || '',
      '{{seller_address}}': sellerCompany?.address || '',
      '{{seller_city}}': sellerCompany?.city || '',
      '{{seller_email}}': sellerCompany?.email || '',
      '{{seller_phone}}': sellerCompany?.phone || '',
      '{{seller_representative}}': sellerCompany?.representative_name || '',
      '{{seller_representative_title}}': sellerCompany?.representative_title || '',
      '{{seller_registration_number}}': sellerCompany?.registration_number || '',
      
      // Port fields
      '{{departure_port}}': departurePort?.name || '',
      '{{departure_port_country}}': departurePort?.country || '',
      '{{destination_port}}': destinationPort?.name || '',
      '{{destination_port_country}}': destinationPort?.country || '',
      '{{loading_port}}': departurePort?.name || '',
      '{{discharge_port}}': destinationPort?.name || '',
      
      // Refinery fields
      '{{refinery_name}}': refinery?.name || '',
      '{{refinery_country}}': refinery?.country || '',
      '{{refinery_capacity}}': refinery?.capacity?.toString() || '',
      
      // Dates
      '{{current_date}}': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      '{{departure_date}}': vessel.departure_date || '',
      '{{arrival_date}}': vessel.arrival_date || '',
      '{{eta}}': vessel.eta || '',
      
      // Common placeholders
      '{{quantity}}': vessel.cargo_quantity?.toString() || '',
      '{{price}}': vessel.price?.toString() || '',
      '{{currency}}': vessel.currency || 'USD',
    };

    // Replace known placeholders in content
    let processedContent = template.content;
    
    for (const [placeholder, value] of Object.entries(placeholderMappings)) {
      if (value) {
        processedContent = processedContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'gi'), value);
      }
    }

    // Find remaining placeholders that weren't replaced
    const remainingPlaceholders = processedContent.match(/\{\{[^}]+\}\}/g) || [];
    const uniquePlaceholders = [...new Set(remainingPlaceholders)];

    console.log('Remaining placeholders to fill with AI:', uniquePlaceholders);

    // Use OpenAI to fill missing placeholders if any exist
    if (uniquePlaceholders.length > 0 && openaiApiKey) {
      try {
        const contextInfo = `
          Vessel: ${vessel.name || 'Unknown'} (IMO: ${vessel.imo || 'N/A'})
          Cargo: ${vessel.commodity_name || vessel.cargo_type || 'Oil products'}
          Buyer: ${buyerCompany?.name || 'Not specified'}
          Seller: ${sellerCompany?.name || 'Not specified'}
          Route: ${departurePort?.name || 'Unknown'} to ${destinationPort?.name || 'Unknown'}
        `;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an expert in oil trading and maritime documentation. Generate realistic placeholder values for legal/commercial documents. Return ONLY valid JSON with placeholder names as keys (without braces) and realistic values.`
              },
              {
                role: 'user',
                content: `Generate realistic values for these placeholders in an oil trading document:
                
Placeholders to fill: ${uniquePlaceholders.join(', ')}

Document context:
${contextInfo}

Return JSON object with placeholder name (without braces) as key and the value. Example:
{"contract_number": "OTC-2026-0142", "payment_terms": "30 days LC at sight"}`
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponseText = data.choices[0]?.message?.content || '';
          
          // Parse JSON from AI response
          const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const aiValues = JSON.parse(jsonMatch[0]);
            
            for (const [key, value] of Object.entries(aiValues)) {
              const placeholder = `{{${key}}}`;
              processedContent = processedContent.replace(
                new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'gi'),
                String(value)
              );
            }
            console.log('AI filled placeholders:', Object.keys(aiValues));
          }
        } else {
          console.error('OpenAI API error:', await response.text());
        }
      } catch (aiError) {
        console.error('Error calling OpenAI:', aiError);
      }
    }

    // Return the processed content (HTML format for now, client will handle DOCX conversion)
    return new Response(
      JSON.stringify({
        success: true,
        templateName: template.name,
        vesselName: vessel.name,
        processedContent,
        originalPlaceholders: template.placeholders || [],
        filledFromDatabase: Object.keys(placeholderMappings).filter(k => placeholderMappings[k]),
        filledWithAI: uniquePlaceholders,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in test-template-with-vessel:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
