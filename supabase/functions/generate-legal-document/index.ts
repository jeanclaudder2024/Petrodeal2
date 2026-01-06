import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Placeholder definitions for each entity type
const ENTITY_PLACEHOLDERS: Record<string, string[]> = {
  company_real: [
    'company_name', 'trade_name', 'company_type', 'description', 'company_objective',
    'email', 'official_email', 'operations_email', 'phone', 'website',
    'address', 'city', 'country', 'legal_address',
    'industry', 'employees_count', 'annual_revenue', 'founded_year', 'primary_activity', 'trading_regions',
    'registration_number', 'registration_country', 'representative_name', 'representative_title',
    'passport_number', 'passport_country', 'representative_email',
    'kyc_status', 'sanctions_status', 'country_risk', 'compliance_notes',
    'logo_url', 'director_photo_url', 'signatory_signature_url',
    'bank_name', 'bank_address', 'account_name', 'account_number', 'iban', 'swift_code', 'beneficiary_address', 'currency'
  ],
  company_buyer: [
    'buyer_company_name', 'buyer_trade_name', 'buyer_company_type', 'buyer_description', 'buyer_company_objective',
    'buyer_email', 'buyer_official_email', 'buyer_operations_email', 'buyer_phone', 'buyer_website',
    'buyer_address', 'buyer_city', 'buyer_country', 'buyer_legal_address',
    'buyer_industry', 'buyer_employees_count', 'buyer_annual_revenue', 'buyer_founded_year', 'buyer_primary_activity', 'buyer_trading_regions',
    'buyer_registration_number', 'buyer_registration_country', 'buyer_representative_name', 'buyer_representative_title',
    'buyer_passport_number', 'buyer_passport_country', 'buyer_representative_email',
    'buyer_kyc_status', 'buyer_sanctions_status', 'buyer_country_risk', 'buyer_compliance_notes',
    'buyer_logo_url', 'buyer_director_photo_url', 'buyer_signatory_signature_url',
    'buyer_bank_name', 'buyer_bank_address', 'buyer_account_name', 'buyer_account_number', 'buyer_iban', 'buyer_swift_code', 'buyer_beneficiary_address', 'buyer_currency'
  ],
  company_seller: [
    'seller_company_name', 'seller_trade_name', 'seller_company_type', 'seller_description', 'seller_company_objective',
    'seller_email', 'seller_official_email', 'seller_operations_email', 'seller_phone', 'seller_website',
    'seller_address', 'seller_city', 'seller_country', 'seller_legal_address',
    'seller_industry', 'seller_employees_count', 'seller_annual_revenue', 'seller_founded_year', 'seller_primary_activity', 'seller_trading_regions',
    'seller_registration_number', 'seller_registration_country', 'seller_representative_name', 'seller_representative_title',
    'seller_passport_number', 'seller_passport_country', 'seller_representative_email',
    'seller_refinery_name', 'seller_refinery_location', 'seller_refinery_capacity_bpd', 'seller_products_supplied', 'seller_loading_ports',
    'seller_kyc_status', 'seller_sanctions_status', 'seller_country_risk', 'seller_compliance_notes',
    'seller_logo_url', 'seller_director_photo_url', 'seller_signatory_signature_url',
    'seller_bank_name', 'seller_bank_address', 'seller_account_name', 'seller_account_number', 'seller_iban', 'seller_swift_code', 'seller_beneficiary_address', 'seller_currency'
  ],
  vessel: [
    'vessel_name', 'vessel_type', 'flag', 'mmsi', 'imo', 'callsign', 'built', 'status',
    'length', 'width', 'beam', 'draught', 'draft', 'deadweight', 'gross_tonnage',
    'cargo_capacity', 'cargo_capacity_bbl', 'engine_power', 'service_speed', 'fuel_consumption', 'crew_size',
    'current_lat', 'current_lng', 'speed', 'course', 'nav_status', 'current_region',
    'departure_port', 'destination_port', 'loading_port', 'discharge_port',
    'departure_date', 'eta', 'arrival_date', 'route_distance', 'voyage_status', 'voyage_notes',
    'cargo_type', 'commodity_name', 'commodity_category', 'hs_code', 'oil_type', 'oil_source',
    'source_refinery', 'cargo_origin_country', 'sanctions_status', 'min_quantity', 'max_quantity',
    'quantity_unit', 'total_shipment_quantity', 'cargo_quantity', 'quality_specification',
    'owner_name', 'operator_name', 'source_company', 'target_refinery', 'buyer_name', 'seller_name',
    'deal_reference_id', 'deal_status', 'contract_type', 'delivery_terms', 'delivery_method',
    'price_basis', 'benchmark_reference', 'indicative_price', 'market_price', 'deal_value', 'price_notes',
    'payment_method', 'payment_timing', 'payment_notes'
  ],
  port: [
    'port_name', 'port_country', 'port_region', 'port_city', 'port_address', 'port_postal_code', 'port_type', 'port_status', 'port_description',
    'port_phone', 'port_email', 'port_website', 'port_lat', 'port_lng',
    'port_capacity', 'port_berth_count', 'port_terminal_count', 'port_max_vessel_length', 'port_max_vessel_beam',
    'port_max_draught', 'port_max_deadweight', 'port_channel_depth', 'port_berth_depth', 'port_anchorage_depth',
    'port_pilotage_required', 'port_tug_assistance', 'port_customs_office', 'port_quarantine_station',
    'port_free_trade_zone', 'port_rail_connection', 'port_road_connection',
    'port_owner', 'port_operator', 'port_authority', 'port_facilities', 'port_services', 'port_operating_hours',
    'port_cargo_types', 'port_security_level', 'port_environmental_certifications', 'port_charges',
    'port_average_wait_time', 'port_tidal_range', 'port_airport_distance', 'port_established', 'port_annual_throughput'
  ],
  refinery: [
    'refinery_name', 'refinery_country', 'refinery_region', 'refinery_city', 'refinery_address', 'refinery_type', 'refinery_status', 'refinery_description',
    'refinery_phone', 'refinery_email', 'refinery_website', 'refinery_lat', 'refinery_lng',
    'refinery_capacity', 'refinery_processing_capacity', 'refinery_storage_capacity',
    'refinery_operator', 'refinery_owner', 'refinery_established_year', 'refinery_workforce_size', 'refinery_annual_revenue',
    'refinery_products', 'refinery_fuel_types', 'refinery_processing_units', 'refinery_crude_oil_sources',
    'refinery_pipeline_connections', 'refinery_shipping_terminals', 'refinery_rail_connections',
    'refinery_environmental_certifications', 'refinery_complexity', 'refinery_utilization', 'refinery_annual_throughput',
    'refinery_daily_throughput', 'refinery_operational_efficiency'
  ]
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, documentType, entityTypes, entityId, prompt } = await req.json();

    // Support both single entityType (legacy) and array of entityTypes
    const entityTypeArray: string[] = Array.isArray(entityTypes) ? entityTypes : (entityTypes ? [entityTypes] : []);
    
    console.log('Generating legal document:', { title, documentType, entityTypes: entityTypeArray });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get available placeholders for all selected entity types (combined)
    const availablePlaceholders: string[] = [];
    entityTypeArray.forEach(entityType => {
      const placeholders = ENTITY_PLACEHOLDERS[entityType] || [];
      placeholders.forEach(p => {
        if (!availablePlaceholders.includes(p)) {
          availablePlaceholders.push(p);
        }
      });
    });
    
    const placeholderList = availablePlaceholders.map(p => `{{${p}}}`).join(', ');

    // Build the system prompt for HTML output
    const systemPrompt = `You are an expert international legal document drafter specializing in oil trading, maritime law, and commodity transactions. You work as if you are from a certified international law firm or notary public.

CRITICAL OUTPUT FORMAT:
Generate the document in clean HTML format. Do NOT use Markdown syntax (no ** for bold, no # for headers, no | for tables).
Use proper HTML tags:
- <h1>, <h2>, <h3> for headers
- <p> for paragraphs
- <strong> for bold text
- <em> for italic text
- <ul> and <ol> for lists
- <table>, <thead>, <tbody>, <tr>, <th>, <td> for tables

TABLE FORMAT EXAMPLE:
<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background-color: #f0f0f0;">
      <th style="border: 1px solid #000; padding: 8px; text-align: left;">Header 1</th>
      <th style="border: 1px solid #000; padding: 8px; text-align: left;">Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #000; padding: 8px;">Data 1</td>
      <td style="border: 1px solid #000; padding: 8px;">Data 2</td>
    </tr>
  </tbody>
</table>

DOCUMENT REQUIREMENTS:
1. Write in formal legal language used by international law firms
2. Follow oil industry legal standards and ICC/INCOTERMS 2020 rules
3. Structure with numbered Articles using HTML (ARTICLE I, ARTICLE II, etc.)
4. Include all required legal sections:
   - Document Header with Reference Number and Date
   - Definitions Section (define all key terms)
   - Recitals/Whereas Clauses
   - Terms and Conditions
   - Representations and Warranties
   - Obligations of Parties
   - Delivery Terms (per INCOTERMS 2020)
   - Payment Terms and Banking Details
   - Inspection and Quality Standards
   - Force Majeure
   - Dispute Resolution (ICC Arbitration, specify venue)
   - Governing Law (specify jurisdiction)
   - Confidentiality
   - Signature Blocks with Witness Lines
5. Generate 8-25 pages of content (approximately 4,000-12,000 words)
6. Use formal headers with <h2> for Articles, <h3> for sub-sections
7. Use proper legal formatting with <strong>CAPITALIZED</strong> party names
8. Add signature blocks at the end with:
   - Company name and registration details
   - Authorized signatory name and title
   - Date and place of signing
   - Witness signature lines

PLACEHOLDER RULES:
- Use {{placeholder_name}} format for all variable data from the database
- For fields from the database, use these exact placeholder names: ${placeholderList}
- For additional fields needed but NOT in the database, create new placeholders and list them at the end under a section titled "GENERATED_PLACEHOLDERS" (as an HTML list)
- Examples of generated placeholders: {{contract_reference_number}}, {{effective_date}}, {{notary_name}}, {{witness_name}}, {{arbitration_venue}}

DOCUMENT TYPE: ${documentType}
ENTITY TYPES: ${entityTypeArray.join(', ')}
DOCUMENT TITLE: ${title}

USER INSTRUCTIONS:
${prompt || 'Generate a comprehensive legal document following all standard oil trading industry practices.'}

Generate the complete legal document template now in HTML format. At the very end, add a section titled "GENERATED_PLACEHOLDERS" as an HTML list showing any placeholder names you created that are NOT from the provided database placeholders.`;

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a ${documentType} document template with the title "${title}". Make it comprehensive, professional, and legally binding. Output in clean HTML format only.` }
        ],
        max_tokens: 16000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let generatedContent = aiResponse.choices?.[0]?.message?.content || '';

    // Clean up any markdown code blocks if present
    generatedContent = generatedContent.replace(/```html\n?/g, '').replace(/```\n?/g, '');

    console.log('Document generated successfully, length:', generatedContent.length);

    // Parse placeholders from the generated content
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const foundPlaceholders = new Set<string>();
    let match;
    while ((match = placeholderRegex.exec(generatedContent)) !== null) {
      foundPlaceholders.add(match[1]);
    }

    // Separate into DB placeholders and generated placeholders
    const placeholdersFromDb: string[] = [];
    const placeholdersGenerated: string[] = [];

    foundPlaceholders.forEach(placeholder => {
      if (availablePlaceholders.includes(placeholder)) {
        placeholdersFromDb.push(placeholder);
      } else {
        placeholdersGenerated.push(placeholder);
      }
    });

    // Estimate pages (roughly 400 words per page)
    const wordCount = generatedContent.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const estimatedPages = Math.max(8, Math.ceil(wordCount / 400));

    return new Response(
      JSON.stringify({
        content: generatedContent,
        contentFormat: 'html',
        placeholdersFromDb,
        placeholdersGenerated,
        estimatedPages,
        wordCount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating document:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
