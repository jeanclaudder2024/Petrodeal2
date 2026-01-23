import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { title, documentType, entityTypes, entityId, prompt, minPages = 10, maxPages = 25 } = await req.json();

    // Support both single entityType (legacy) and array of entityTypes
    const entityTypeArray: string[] = Array.isArray(entityTypes) ? entityTypes : (entityTypes ? [entityTypes] : []);
    
    console.log('Generating legal document:', { title, documentType, entityTypes: entityTypeArray, minPages, maxPages });

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured. Please add your OpenAI API key in Supabase secrets.");
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

    // Professional document structure with exact formatting examples
    const systemPrompt = `You are a senior partner at an elite international law firm (Clyde & Co, Norton Rose Fulbright, or Ince & Co) specializing in oil trading, maritime law, and commodity transactions.

=======================================================================
CRITICAL DOCUMENT REQUIREMENTS - READ CAREFULLY
=======================================================================

OUTPUT FORMAT: Clean HTML only. NO Markdown. NO code blocks.

MINIMUM WORD COUNT: ${minPages * 500} words (approximately ${minPages}-${maxPages} pages)
You MUST write comprehensive, detailed content. This is a REAL legal document, not a summary.

=======================================================================
EXACT DOCUMENT HEADER FORMAT (USE THIS EXACTLY):
=======================================================================

<div style="text-align: center; margin-bottom: 30px;">
  <p style="font-size: 11pt; font-weight: bold; margin: 0;">STRICTLY PRIVATE & CONFIDENTIAL</p>
  <p style="font-size: 11pt; font-weight: bold; margin: 5px 0;">SUBJECT TO CONTRACT</p>
</div>

<table style="width: 100%; border: none; margin-bottom: 20px;">
  <tr>
    <td style="border: none; width: 50%;"><strong>Reference:</strong> {{contract_reference_number}}</td>
    <td style="border: none; width: 50%; text-align: right;"><strong>Date:</strong> {{effective_date}}</td>
  </tr>
</table>

<h1 style="text-align: center; font-size: 16pt; text-transform: uppercase; margin: 30px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 15px 0;">
${title.toUpperCase()}
</h1>

=======================================================================
PARTIES SECTION FORMAT (USE THIS EXACTLY):
=======================================================================

<h2>PARTIES</h2>

<p><strong>THIS AGREEMENT</strong> is made on {{effective_date}}</p>

<p><strong>BETWEEN:</strong></p>

<p style="margin-left: 20px;">
<strong>(1) {{seller_company_name}}</strong>, a company duly incorporated and existing under the laws of {{seller_registration_country}}, having its registered office at {{seller_legal_address}}, with registration number {{seller_registration_number}}, represented herein by {{seller_representative_name}}, {{seller_representative_title}}, duly authorized to sign on behalf of the company (hereinafter referred to as "<strong>SELLER</strong>")
</p>

<p><strong>AND:</strong></p>

<p style="margin-left: 20px;">
<strong>(2) {{buyer_company_name}}</strong>, a company duly incorporated and existing under the laws of {{buyer_registration_country}}, having its registered office at {{buyer_legal_address}}, with registration number {{buyer_registration_number}}, represented herein by {{buyer_representative_name}}, {{buyer_representative_title}}, duly authorized to sign on behalf of the company (hereinafter referred to as "<strong>BUYER</strong>")
</p>

<p>(SELLER and BUYER are hereinafter individually referred to as a "<strong>Party</strong>" and collectively as the "<strong>Parties</strong>")</p>

=======================================================================
RECITALS FORMAT:
=======================================================================

<h2>RECITALS</h2>

<p><strong>WHEREAS:</strong></p>

<ol type="A" style="margin-left: 20px;">
  <li style="margin-bottom: 10px;"><p>SELLER is engaged in the business of [describe seller's business in detail, including refinery operations, production capacity, product range, and market presence];</p></li>
  <li style="margin-bottom: 10px;"><p>BUYER is engaged in the business of [describe buyer's business, including trading operations, distribution network, storage facilities, and end-use applications];</p></li>
  <li style="margin-bottom: 10px;"><p>SELLER desires to sell and BUYER desires to purchase petroleum products on the terms and conditions set forth herein;</p></li>
  <li style="margin-bottom: 10px;"><p>The Parties have negotiated and agreed upon the commercial terms for the sale and purchase of the Products as detailed in this Agreement;</p></li>
</ol>

<p><strong>NOW, THEREFORE,</strong> in consideration of the mutual covenants, promises, and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:</p>

=======================================================================
DEFINITIONS SECTION (MINIMUM 35 DEFINITIONS):
=======================================================================

<h2>ARTICLE I - DEFINITIONS AND INTERPRETATION</h2>

<h3>1.1 Definitions</h3>

<p>In this Agreement, unless the context otherwise requires, the following terms shall have the meanings set out below:</p>

<ul style="list-style-type: none; padding-left: 0;">
  <li style="margin-bottom: 12px;"><strong>"Affiliate"</strong> means, with respect to any Party, any entity that directly or indirectly controls, is controlled by, or is under common control with such Party, where "control" means the ownership of more than fifty percent (50%) of the voting shares or equivalent ownership interest;</li>
  <li style="margin-bottom: 12px;"><strong>"Agreement"</strong> means this ${documentType} together with all Schedules, Annexures, and Exhibits attached hereto, as may be amended from time to time;</li>
  <li style="margin-bottom: 12px;"><strong>"API Gravity"</strong> means the American Petroleum Institute gravity scale, a measure of how heavy or light a petroleum liquid is compared to water;</li>
  <li style="margin-bottom: 12px;"><strong>"Banking Day"</strong> means any day other than a Saturday, Sunday, or public holiday on which banks are open for general business in {{banking_jurisdiction}};</li>
  <li style="margin-bottom: 12px;"><strong>"Barrel" or "BBL"</strong> means a unit of volume equal to forty-two (42) United States gallons at sixty degrees Fahrenheit (60°F);</li>
  [Continue with at least 30 more definitions including: Bill of Lading, Cargo, Demurrage, Discharge Port, Force Majeure, FOB, CIF, DES, Incoterms, Independent Inspector, Laytime, Letter of Credit, Loading Port, Metric Ton, NOR, Performance Bond, Price, Product, Quality Specifications, Quantity, Shipment Period, Vessel, etc.]
</ul>

=======================================================================
REQUIRED TABLES FORMAT:
=======================================================================

TABLE 1 - PRODUCT SPECIFICATIONS:
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #1a365d; color: white;">
      <th style="border: 1px solid #000; padding: 12px; text-align: left;">Property</th>
      <th style="border: 1px solid #000; padding: 12px; text-align: center;">Specification</th>
      <th style="border: 1px solid #000; padding: 12px; text-align: center;">Test Method</th>
      <th style="border: 1px solid #000; padding: 12px; text-align: center;">Typical Value</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color: #f8f9fa;">
      <td style="border: 1px solid #000; padding: 10px;">API Gravity @ 60°F</td>
      <td style="border: 1px solid #000; padding: 10px; text-align: center;">{{api_gravity_min}} - {{api_gravity_max}}</td>
      <td style="border: 1px solid #000; padding: 10px; text-align: center;">ASTM D287</td>
      <td style="border: 1px solid #000; padding: 10px; text-align: center;">{{api_gravity_typical}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 10px;">Sulfur Content (% wt)</td>
      <td style="border: 1px solid #000; padding: 10px; text-align: center;">Max {{sulfur_max}}</td>
      <td style="border: 1px solid #000; padding: 10px; text-align: center;">ASTM D4294</td>
      <td style="border: 1px solid #000; padding: 10px; text-align: center;">{{sulfur_typical}}</td>
    </tr>
    [Include at least 10 more specification rows]
  </tbody>
</table>

TABLE 2 - PAYMENT SCHEDULE:
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #1a365d; color: white;">
      <th style="border: 1px solid #000; padding: 12px;">Payment Stage</th>
      <th style="border: 1px solid #000; padding: 12px;">Percentage</th>
      <th style="border: 1px solid #000; padding: 12px;">Timing</th>
      <th style="border: 1px solid #000; padding: 12px;">Conditions</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color: #f8f9fa;">
      <td style="border: 1px solid #000; padding: 10px;">Performance Bond</td>
      <td style="border: 1px solid #000; padding: 10px; text-align: center;">2%</td>
      <td style="border: 1px solid #000; padding: 10px;">Within 5 Banking Days of signing</td>
      <td style="border: 1px solid #000; padding: 10px;">Irrevocable Bank Guarantee</td>
    </tr>
    [Include payment milestones]
  </tbody>
</table>

TABLE 3 - VESSEL REQUIREMENTS:
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #1a365d; color: white;">
      <th style="border: 1px solid #000; padding: 12px;">Vessel Parameter</th>
      <th style="border: 1px solid #000; padding: 12px;">Minimum</th>
      <th style="border: 1px solid #000; padding: 12px;">Maximum</th>
      <th style="border: 1px solid #000; padding: 12px;">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color: #f8f9fa;">
      <td style="border: 1px solid #000; padding: 10px;">Deadweight Tonnage (DWT)</td>
      <td style="border: 1px solid #000; padding: 10px; text-align: center;">{{vessel_min_dwt}}</td>
      <td style="border: 1px solid #000; padding: 10px; text-align: center;">{{vessel_max_dwt}}</td>
      <td style="border: 1px solid #000; padding: 10px;">As per port restrictions</td>
    </tr>
    [Include LOA, Beam, Draft, Age requirements]
  </tbody>
</table>

TABLE 4 - CONTACT DETAILS:
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #1a365d; color: white;">
      <th style="border: 1px solid #000; padding: 12px;">Role</th>
      <th style="border: 1px solid #000; padding: 12px;">Party</th>
      <th style="border: 1px solid #000; padding: 12px;">Contact Person</th>
      <th style="border: 1px solid #000; padding: 12px;">Email</th>
      <th style="border: 1px solid #000; padding: 12px;">Phone</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color: #f8f9fa;">
      <td style="border: 1px solid #000; padding: 10px;">Commercial Contact</td>
      <td style="border: 1px solid #000; padding: 10px;">SELLER</td>
      <td style="border: 1px solid #000; padding: 10px;">{{seller_representative_name}}</td>
      <td style="border: 1px solid #000; padding: 10px;">{{seller_email}}</td>
      <td style="border: 1px solid #000; padding: 10px;">{{seller_phone}}</td>
    </tr>
    [Include Operations, Legal, Finance contacts for both parties]
  </tbody>
</table>

=======================================================================
SIGNATURE BLOCK FORMAT:
=======================================================================

<h2>EXECUTION</h2>

<p>IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.</p>

<table style="width: 100%; border: none; margin-top: 40px;">
  <tr>
    <td style="width: 48%; vertical-align: top; border: none; padding: 20px;">
      <p><strong>FOR AND ON BEHALF OF SELLER:</strong></p>
      <p><strong>{{seller_company_name}}</strong></p>
      <br><br>
      <p>_________________________________</p>
      <p>Signature</p>
      <br>
      <p>Name: {{seller_representative_name}}</p>
      <p>Title: {{seller_representative_title}}</p>
      <p>Date: ___________________________</p>
      <br>
      <p><strong>WITNESS:</strong></p>
      <p>_________________________________</p>
      <p>Name: {{seller_witness_name}}</p>
      <p>Title: {{seller_witness_title}}</p>
    </td>
    <td style="width: 4%; border: none;"></td>
    <td style="width: 48%; vertical-align: top; border: none; padding: 20px;">
      <p><strong>FOR AND ON BEHALF OF BUYER:</strong></p>
      <p><strong>{{buyer_company_name}}</strong></p>
      <br><br>
      <p>_________________________________</p>
      <p>Signature</p>
      <br>
      <p>Name: {{buyer_representative_name}}</p>
      <p>Title: {{buyer_representative_title}}</p>
      <p>Date: ___________________________</p>
      <br>
      <p><strong>WITNESS:</strong></p>
      <p>_________________________________</p>
      <p>Name: {{buyer_witness_name}}</p>
      <p>Title: {{buyer_witness_title}}</p>
    </td>
  </tr>
</table>

=======================================================================
REQUIRED ARTICLES TO INCLUDE (FULLY DETAILED):
=======================================================================

ARTICLE I - DEFINITIONS AND INTERPRETATION (with 35+ definitions)
ARTICLE II - SUBJECT MATTER AND SCOPE
ARTICLE III - QUANTITY (with tolerances, measurement, calibration)
ARTICLE IV - QUALITY AND SPECIFICATIONS (with Table 1)
ARTICLE V - PRICE AND PRICING MECHANISM
ARTICLE VI - PAYMENT TERMS (with Table 2, banking details, LC requirements)
ARTICLE VII - DELIVERY TERMS (INCOTERMS 2020)
ARTICLE VIII - LOADING AND DISCHARGE (with Table 3 vessel requirements)
ARTICLE IX - VESSEL NOMINATION AND APPROVAL
ARTICLE X - INSPECTION AND TESTING
ARTICLE XI - TITLE AND RISK OF LOSS
ARTICLE XII - TAXES AND DUTIES
ARTICLE XIII - INSURANCE
ARTICLE XIV - REPRESENTATIONS AND WARRANTIES
ARTICLE XV - INDEMNIFICATION
ARTICLE XVI - LIMITATION OF LIABILITY
ARTICLE XVII - FORCE MAJEURE
ARTICLE XVIII - TERMINATION
ARTICLE XIX - CONFIDENTIALITY
ARTICLE XX - DISPUTE RESOLUTION (negotiation, mediation, ICC arbitration)
ARTICLE XXI - GOVERNING LAW AND JURISDICTION
ARTICLE XXII - NOTICES (with Table 4 contact details)
ARTICLE XXIII - ASSIGNMENT
ARTICLE XXIV - ENTIRE AGREEMENT
ARTICLE XXV - AMENDMENTS AND WAIVERS
ARTICLE XXVI - SEVERABILITY
ARTICLE XXVII - GENERAL PROVISIONS

ANNEXURE A - TECHNICAL SPECIFICATIONS
ANNEXURE B - BANKING DETAILS AND PAYMENT INSTRUCTIONS
ANNEXURE C - VESSEL NOMINATION FORM
ANNEXURE D - CERTIFICATE OF ORIGIN TEMPLATE
ANNEXURE E - BILL OF LADING REQUIREMENTS

=======================================================================
PLACEHOLDER RULES:
=======================================================================
- Use {{placeholder_name}} format for ALL variable data
- Available database placeholders: ${placeholderList}
- Create additional placeholders as needed: {{contract_reference_number}}, {{effective_date}}, {{contract_term_years}}, {{arbitration_venue}}, {{governing_law_country}}, etc.

DOCUMENT TYPE: ${documentType}
ENTITY TYPES: ${entityTypeArray.join(', ')}

USER ADDITIONAL INSTRUCTIONS:
${prompt || 'Generate a comprehensive legal document following all standard oil trading industry practices.'}`;

    console.log('Calling OpenAI API for document generation...');

    // Single API call with maximum tokens for complete document
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a complete ${documentType} document template with the title "${title}". 

CRITICAL REQUIREMENTS:
1. Write AT LEAST ${minPages * 500} words - this is a comprehensive legal document
2. Include ALL 27 Articles listed in the requirements with full legal detail
3. Include ALL 5 Annexures with complete content
4. Use the EXACT header, parties, recitals, and signature block formats shown
5. Include ALL 4 required tables with proper styling
6. Write in formal legal language - every clause must be complete and detailed
7. Include at least 35 defined terms in the Definitions section
8. Each Article should have multiple numbered sub-clauses (e.g., 5.1, 5.2, 5.3)
9. Use proper HTML formatting - no Markdown

Start the document now. Begin with the CONFIDENTIAL header and continue through all sections to the signature blocks and annexures.` }
        ],
        max_tokens: 16000,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 401) {
        throw new Error("Invalid OpenAI API key. Please check your OPENAI_API_KEY.");
      }
      if (response.status === 429) {
        throw new Error("OpenAI rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 402 || errorText.includes('insufficient')) {
        throw new Error("OpenAI payment required. Please check your OpenAI account billing.");
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let generatedContent = aiResponse.choices?.[0]?.message?.content || '';

    if (!generatedContent || generatedContent.length < 100) {
      throw new Error("Failed to generate document content. Please try again.");
    }

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

    // Calculate word count and pages
    const wordCount = generatedContent.replace(/<[^>]*>/g, '').split(/\s+/).filter((w: string) => w.length > 0).length;
    const estimatedPages = Math.max(minPages, Math.ceil(wordCount / 400));

    console.log(`Final document: ${wordCount} words, ~${estimatedPages} pages`);

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
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
