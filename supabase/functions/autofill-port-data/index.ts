import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portName } = await req.json();
    console.log('Autofilling port data for:', portName);

    if (!portName) {
      throw new Error('Port name is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Based on the port name "${portName}", provide detailed information in the following JSON format. If you don't know specific information, provide reasonable estimates or leave as null:

{
  "country": "country name",
  "region": "geographical region",
  "city": "city name",
  "address": "port address",
  "postal_code": "postal code",
  "phone": "contact phone number",
  "email": "contact email",
  "website": "official website URL",
  "lat": latitude_number,
  "lng": longitude_number,
  "port_type": "container|oil|gas|cargo|fishing|cruise|military|industrial",
  "status": "active|inactive|under_construction|planned",
  "description": "brief description of the port",
  "capacity": estimated_capacity_number,
  "annual_throughput": estimated_annual_throughput,
  "berth_count": estimated_number_of_berths,
  "terminal_count": estimated_number_of_terminals,
  "max_vessel_length": max_vessel_length_meters,
  "max_vessel_beam": max_vessel_beam_meters,
  "max_draught": max_draught_meters,
  "max_deadweight": max_deadweight_tons,
  "channel_depth": channel_depth_meters,
  "berth_depth": berth_depth_meters,
  "anchorage_depth": anchorage_depth_meters,
  "port_charges": estimated_port_charges_per_day,
  "average_wait_time": average_waiting_time_hours,
  "tidal_range": tidal_range_meters,
  "airport_distance": distance_to_nearest_airport_km,
  "established": year_established,
  "vessel_count": estimated_annual_vessel_count,
  "total_cargo": estimated_total_cargo_tonnes,
  "owner": "port owner/authority",
  "operator": "port operator",
  "port_authority": "port authority name",
  "operating_hours": "operating hours (e.g., 24/7, 06:00-18:00)",
  "services": "comma-separated list of services (e.g., pilotage, tugboat, bunker fuel, fresh water)",
  "cargo_types": "comma-separated list of cargo types handled",
  "facilities": "comma-separated list of facilities (e.g., container cranes, storage tanks, warehouses)",
  "security_level": "ISPS level (1|2|3)",
  "environmental_certifications": "environmental certifications if any",
  "pilotage_required": true_or_false,
  "tug_assistance": true_or_false,
  "customs_office": true_or_false,
  "quarantine_station": true_or_false,
  "free_trade_zone": true_or_false,
  "rail_connection": true_or_false,
  "road_connection": true_or_false
}

Only return the JSON object, no additional text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert on global ports and maritime infrastructure. Provide accurate, factual information about ports worldwide.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log('Generated text:', generatedText);

    // Parse the JSON response
    let portData;
    try {
      // Clean up the response - remove any markdown formatting or extra text
      let cleanedText = generatedText.trim();
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Find JSON object if there's extra text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      
      console.log('Cleaned text for parsing:', cleanedText);
      portData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse generated JSON:', parseError);
      console.error('Original generated text:', generatedText);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('Parsed port data:', portData);

    return new Response(JSON.stringify({ success: true, data: portData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in autofill-port-data function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});