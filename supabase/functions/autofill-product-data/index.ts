import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation schema
const productDataSchema = z.object({
  commodityName: z.string().min(1).max(200),
  commodityType: z.string().max(100).optional(),
  grade: z.string().max(100).optional(),
});

// Product specification templates for common products
const PRODUCT_SPECS: Record<string, Record<string, unknown>> = {
  'ULSD': {
    commodity_type: 'ULSD',
    grade: 'EN 590',
    sulphur_content_ppm: 10,
    density_kg_m3: 835,
    flash_point_min_c: 55,
    viscosity_cst: 3.0,
    cetane_number_min: 51,
    cloud_point_c: -10,
    pour_point_c: -15,
    water_content_max_ppm: 200,
    ash_content_max: 0.01,
    carbon_residue_max: 0.30,
    distillation_range: '250-350°C',
    color_max: 2.0,
    oxidation_stability: 25,
    lubricity_um: 460,
    fame_content_max: 7.0,
    test_method: 'ASTM',
    origin: 'NON-SANCTIONED',
    quantity_min_mt: 50000,
    quantity_max_mt: 500000,
    quantity_unit: 'MT',
    contract_type: 'SPOT TRIAL',
    delivery_terms: 'FOB',
    incoterms: 'Incoterms 2020',
    price_type: 'TBD',
    price_basis: 'Based On Procedure & Source Refinery',
    price_reference: 'Platts',
    payment_terms: 'MT103/TT',
    payment_condition: 'AFTER SUCCESSFUL DELIVERY',
    currency: 'USD',
    destination_ports: ['Rotterdam', 'Houston', 'Jurong', 'Fujairah'],
  },
  'Diesel': {
    commodity_type: 'Diesel',
    grade: 'EN 590',
    sulphur_content_ppm: 50,
    density_kg_m3: 840,
    flash_point_min_c: 55,
    viscosity_cst: 3.5,
    cetane_number_min: 51,
    cloud_point_c: -5,
    pour_point_c: -10,
    water_content_max_ppm: 200,
    ash_content_max: 0.01,
    carbon_residue_max: 0.30,
    test_method: 'ASTM',
    origin: 'NON-SANCTIONED',
    quantity_min_mt: 25000,
    quantity_max_mt: 300000,
    quantity_unit: 'MT',
    contract_type: 'SPOT',
    delivery_terms: 'CIF',
    price_type: 'Platts+',
    price_reference: 'Platts',
    payment_terms: 'LC',
    currency: 'USD',
  },
  'Gasoline': {
    commodity_type: 'Gasoline',
    grade: 'EN 228',
    sulphur_content_ppm: 10,
    density_kg_m3: 750,
    flash_point_min_c: -40,
    octane_number: 95,
    vapor_pressure_kpa: 60,
    test_method: 'ASTM',
    origin: 'NON-SANCTIONED',
    quantity_min_mt: 25000,
    quantity_max_mt: 200000,
    quantity_unit: 'MT',
    contract_type: 'SPOT',
    delivery_terms: 'FOB',
    price_type: 'Platts+',
    price_reference: 'Platts',
    payment_terms: 'MT103/TT',
    currency: 'USD',
  },
  'Jet Fuel': {
    commodity_type: 'Jet Fuel',
    grade: 'ASTM D1655',
    sulphur_content_ppm: 3000,
    density_kg_m3: 810,
    flash_point_min_c: 38,
    freezing_point_max_c: -47,
    viscosity_cst: 8.0,
    test_method: 'ASTM',
    origin: 'NON-SANCTIONED',
    quantity_min_mt: 10000,
    quantity_max_mt: 100000,
    quantity_unit: 'MT',
    contract_type: 'SPOT',
    delivery_terms: 'CIF',
    price_type: 'Platts+',
    price_reference: 'Platts',
    payment_terms: 'LC',
    currency: 'USD',
  },
  'Crude Oil': {
    commodity_type: 'Crude Oil',
    grade: 'Brent',
    sulphur_content_ppm: 4000,
    density_kg_m3: 835,
    api_gravity: 38,
    test_method: 'ASTM',
    origin: 'NON-SANCTIONED',
    quantity_min_mt: 100000,
    quantity_max_mt: 1000000,
    quantity_unit: 'MT',
    contract_type: 'LONG TERM',
    delivery_terms: 'FOB',
    price_type: 'ICE Brent+',
    price_reference: 'ICE Brent',
    payment_terms: 'LC',
    currency: 'USD',
  },
  'Fuel Oil': {
    commodity_type: 'Fuel Oil',
    grade: 'HSFO',
    sulphur_content_ppm: 35000,
    density_kg_m3: 980,
    flash_point_min_c: 60,
    viscosity_cst: 380,
    pour_point_c: 30,
    water_content_max_ppm: 5000,
    ash_content_max: 0.10,
    test_method: 'ISO',
    origin: 'NON-SANCTIONED',
    quantity_min_mt: 20000,
    quantity_max_mt: 150000,
    quantity_unit: 'MT',
    contract_type: 'SPOT',
    delivery_terms: 'FOB',
    price_type: 'Platts+',
    price_reference: 'Platts',
    payment_terms: 'MT103/TT',
    currency: 'USD',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const rawBody = await req.json()
    
    // Validate input
    const validation = productDataSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const { commodityName, commodityType, grade } = validation.data;

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for matching product template
    let baseSpecs: Record<string, unknown> = {};
    const commodityLower = commodityName.toLowerCase();
    
    for (const [key, specs] of Object.entries(PRODUCT_SPECS)) {
      if (commodityLower.includes(key.toLowerCase()) || commodityType?.toLowerCase().includes(key.toLowerCase())) {
        baseSpecs = { ...specs };
        break;
      }
    }

    // If no template found, use ULSD as default
    if (Object.keys(baseSpecs).length === 0) {
      baseSpecs = { ...PRODUCT_SPECS['ULSD'] };
    }

    const prompt = `Generate realistic oil product specifications for: "${commodityName}"
Product type: ${commodityType || 'Unknown'}
Grade: ${grade || 'Unknown'}

Based on the product name and type, provide ONLY the following JSON (no markdown, no explanation):
{
  "commodity_type": "Product type",
  "grade": "Product grade/standard",
  "sulphur_content_ppm": realistic_number,
  "origin": "NON-SANCTIONED or specific origin",
  "origin_country": "Source country if applicable",
  "quantity_min_mt": realistic_min_quantity,
  "quantity_max_mt": realistic_max_quantity,
  "contract_type": "SPOT or SPOT TRIAL or LONG TERM",
  "contract_duration_months": 12_or_appropriate,
  "delivery_terms": "FOB or CIF or CFR",
  "incoterms": "Incoterms 2020",
  "price_type": "TBD or Platts+ or Fixed",
  "price_basis": "Based On Procedure & Source Refinery",
  "price_reference": "Platts or Argus or ICE Brent",
  "payment_terms": "MT103/TT or LC",
  "payment_condition": "AFTER SUCCESSFUL DELIVERY",
  "currency": "USD",
  "destination_ports": ["Rotterdam", "Houston", "Jurong", "Fujairah"],
  "loading_ports": ["Port1", "Port2"],
  "density_kg_m3": realistic_number,
  "flash_point_min_c": realistic_number,
  "viscosity_cst": realistic_number,
  "cetane_number_min": realistic_number_if_diesel,
  "cloud_point_c": realistic_number,
  "pour_point_c": realistic_number,
  "water_content_max_ppm": 200,
  "ash_content_max": 0.01,
  "carbon_residue_max": 0.30,
  "distillation_range": "250-350°C",
  "color_max": 2.0,
  "oxidation_stability": 25,
  "lubricity_um": 460,
  "fame_content_max": 7.0,
  "test_method": "ASTM or ISO or IP",
  "lab_name": "SGS or Intertek"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates realistic oil/petroleum product specifications. Always respond with valid JSON only. Use industry-standard values for oil trading.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response:', JSON.stringify(data));
      throw new Error('Invalid response from AI');
    }
    
    let content = data.choices[0].message.content.trim()
    
    // Clean markdown if present
    if (content.startsWith('```')) {
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    }
    
    let aiData: Record<string, unknown> = {};
    try {
      aiData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Continue with base specs only
    }

    // Merge AI data with base specs, preferring AI data
    const productData: Record<string, unknown> = {
      ...baseSpecs,
      ...aiData,
    };

    console.log('Generated product data for:', commodityName, 'Type:', commodityType);

    return new Response(
      JSON.stringify({ success: true, data: productData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in autofill-product-data function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate product data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
