import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VesselSearchRequest {
  vesselName?: string;
  imo?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vesselName, imo }: VesselSearchRequest = await req.json();

    if (!vesselName && !imo) {
      throw new Error('Either vessel name or IMO number is required');
    }

    console.log('AI Vessel Search for:', { vesselName, imo });

    // Validate OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const searchQuery = vesselName || `vessel with IMO ${imo}`;
    
// Create AI prompt to search for vessel data
    const aiPrompt = `
Search for real maritime vessel data for: "${searchQuery}"

Please try to find actual vessel information from maritime databases, shipping registries, or vessel tracking systems. If you can find real data, provide it. If you cannot find real data for this specific vessel, generate realistic and industry-standard data that would be typical for a vessel with this name/IMO.

Please provide vessel data in the following JSON format with ALL fields filled:

{
  "vessel_type": "Oil Tanker",
  "flag": "Marshall Islands", 
  "mmsi": "538123456",
  "imo": "1234567",
  "callsign": "V7AB2",
  "built": 2015,
  "length": 250.5,
  "width": 44.2,
  "beam": "44.2",
  "draught": 15.8,
  "draft": "15.8", 
  "deadweight": 115000,
  "gross_tonnage": 75000,
  "cargo_capacity": 125000,
  "cargo_quantity": 0,
  "engine_power": 18500,
  "crew_size": 22,
  "fuel_consumption": 85.5,
  "speed": "14.5",
  "course": 235,
  "nav_status": "Under way using engine",
  "cargo_type": "Crude Oil",
  "oil_type": "Brent Crude",
  "oil_source": "North Sea",
  "owner_name": "Maritime Shipping Corp",
  "operator_name": "Global Tanker Operations",
  "buyer_name": "Refinery Partners Ltd",
  "seller_name": "Oil Trading International",
  "source_company": "Crude Oil Suppliers Inc",
  "target_refinery": "Gulf Coast Refinery",
  "current_lat": 25.2048,
  "current_lng": 55.2708, 
  "current_region": "Persian Gulf",
  "status": "Under way",
  "destination": "Rotterdam",
  "eta": "2024-02-15T14:30:00Z",
  "departure_port": 1,
  "destination_port": 2,
  "departure_date": "2024-02-01T08:00:00Z",
  "arrival_date": "2024-02-15T14:30:00Z",
  "departure_lat": 26.2041,
  "departure_lng": 50.0955,
  "destination_lat": 51.9244,
  "destination_lng": 4.4777,
  "loading_port": "Ras Tanura",
  "route_distance": 6850.5,
  "route_info": "Via Suez Canal, Mediterranean Sea",
  "shipping_type": "spot",
  "deal_value": 85000000,
  "price": 68.50,
  "market_price": 70.25,
  "quantity": 1200000,
  "company_id": 1,
  "refinery_id": "550e8400-e29b-41d4-a716-446655440001"
}

Guidelines for realistic data:
- vessel_type: Use standard types (Oil Tanker, Bulk Carrier, Container Ship, Chemical Tanker, LNG Carrier, LPG Carrier, General Cargo, etc.)
- flag: Use popular maritime flags (Marshall Islands, Liberia, Panama, Singapore, Malta, Bahamas, Cyprus, etc.)
- mmsi: 9-digit number starting with maritime country code (538 for Marshall Islands, 636 for Liberia, etc.)
- imo: 7-digit IMO number (format: 9123456)
- callsign: 4-8 characters, country-specific format
- built: Year between 1990-2024
- Dimensions should be proportional and realistic for vessel type
- For oil tankers: deadweight 50,000-320,000 tons, length 180-380m, width 32-68m
- For container ships: deadweight 20,000-220,000 tons, length 200-400m
- crew_size: 15-35 typical for modern vessels
- fuel_consumption: 20-400 MT/day depending on size and engine type
- course: 0-360 degrees
- nav_status: "Under way using engine", "At anchor", "Not under command", "Restricted manoeuvrability", "Moored"
- cargo_type: "Crude Oil", "Refined Products", "Gasoline", "Diesel", "Jet Fuel", "Heavy Fuel Oil", etc.
- oil_type: "Brent Crude", "WTI", "Heavy Crude", "Light Sweet Crude", "Sour Crude", etc.
- coordinates: Use realistic lat/lng for maritime routes
- dates: Use ISO format with realistic future dates for eta/arrival, past dates for departure
- ports: Use realistic port IDs (1-1000 range)
- prices: Realistic oil prices per barrel ($50-120 range)
- quantities: Realistic cargo quantities in barrels (100,000-3,000,000 for tankers)

Return ONLY the JSON object, no additional text.`;

    console.log('Calling OpenAI to search/generate vessel data');

    // Call OpenAI to search for or generate vessel data
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a maritime data expert with access to vessel databases. Search for real vessel data when possible, otherwise generate realistic industry-standard data. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error (${openaiResponse.status}): ${errorText}`);
    }

    const aiResult = await openaiResponse.json();
    
    if (!aiResult.choices || !aiResult.choices[0] || !aiResult.choices[0].message) {
      console.error('Invalid OpenAI response structure:', aiResult);
      throw new Error('Invalid response structure from OpenAI');
    }
    
    let aiGeneratedData = aiResult.choices[0].message.content;

    console.log('AI generated vessel data:', aiGeneratedData);

    // Clean up the response to extract JSON
    aiGeneratedData = aiGeneratedData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the AI response
    let parsedData;
    try {
      parsedData = JSON.parse(aiGeneratedData);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiGeneratedData);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate and sanitize the AI-generated data
    const sanitizedData = sanitizeVesselData(parsedData);

    if (Object.keys(sanitizedData).length === 0) {
      throw new Error('No valid data generated by AI');
    }

    console.log('Sanitized vessel data:', sanitizedData);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Vessel data ${parsedData.imo ? 'found' : 'generated'} successfully`,
        vesselData: sanitizedData,
        isRealData: false // For now, we'll assume it's generated data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-vessel-search function:', error);
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: {
        timestamp: new Date().toISOString(),
        function: 'ai-vessel-search'
      }
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function sanitizeVesselData(aiData: any): any {
  const sanitized: any = {};

  // Define field mappings with validation
  const fieldValidations = {
    vessel_type: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    flag: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    mmsi: (v: any) => typeof v === 'string' && /^\d{9}$/.test(v) ? v : null,
    imo: (v: any) => typeof v === 'string' && /^\d{7}$/.test(v) ? v : null,
    callsign: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    built: (v: any) => typeof v === 'number' && v >= 1980 && v <= 2024 ? v : null,
    length: (v: any) => typeof v === 'number' && v > 0 && v < 500 ? v : null,
    width: (v: any) => typeof v === 'number' && v > 0 && v < 100 ? v : null,
    beam: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    draught: (v: any) => typeof v === 'number' && v > 0 && v < 50 ? v : null,
    draft: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    deadweight: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    gross_tonnage: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    cargo_capacity: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    cargo_quantity: (v: any) => typeof v === 'number' && v >= 0 ? v : null,
    engine_power: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    crew_size: (v: any) => typeof v === 'number' && v > 0 && v < 100 ? v : null,
    fuel_consumption: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    speed: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    course: (v: any) => typeof v === 'number' && v >= 0 && v <= 360 ? v : null,
    nav_status: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    cargo_type: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    oil_type: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    oil_source: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    owner_name: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    operator_name: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    buyer_name: (v: any) => typeof v === 'string' ? v || null : null,
    seller_name: (v: any) => typeof v === 'string' ? v || null : null,
    source_company: (v: any) => typeof v === 'string' ? v || null : null,
    target_refinery: (v: any) => typeof v === 'string' ? v || null : null,
    current_lat: (v: any) => typeof v === 'number' && v >= -90 && v <= 90 ? v : null,
    current_lng: (v: any) => typeof v === 'number' && v >= -180 && v <= 180 ? v : null,
    current_region: (v: any) => typeof v === 'string' ? v || null : null,
    status: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    destination: (v: any) => typeof v === 'string' ? v || null : null,
    eta: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    departure_port: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    destination_port: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    departure_date: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    arrival_date: (v: any) => typeof v === 'string' && v.length > 0 ? v : null,
    departure_lat: (v: any) => typeof v === 'number' && v >= -90 && v <= 90 ? v : null,
    departure_lng: (v: any) => typeof v === 'number' && v >= -180 && v <= 180 ? v : null,
    destination_lat: (v: any) => typeof v === 'number' && v >= -90 && v <= 90 ? v : null,
    destination_lng: (v: any) => typeof v === 'number' && v >= -180 && v <= 180 ? v : null,
    loading_port: (v: any) => typeof v === 'string' ? v || null : null,
    route_distance: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    route_info: (v: any) => typeof v === 'string' ? v || null : null,
    shipping_type: (v: any) => typeof v === 'string' ? v || null : null,
    deal_value: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    price: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    market_price: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    quantity: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    company_id: (v: any) => typeof v === 'number' && v > 0 ? v : null,
    refinery_id: (v: any) => typeof v === 'string' && v.length > 0 ? v : null
  };

  // Apply validations
  for (const [field, validator] of Object.entries(fieldValidations)) {
    if (aiData[field] !== undefined) {
      const validatedValue = validator(aiData[field]);
      if (validatedValue !== null) {
        sanitized[field] = validatedValue;
      }
    }
  }

  return sanitized;
}