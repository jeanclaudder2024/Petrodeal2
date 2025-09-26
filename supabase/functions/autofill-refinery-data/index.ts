import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface RefineryData {
  name: string;
  country: string;
  region: string;
  city: string;
  address: string;
  type: string;
  status: string;
  description: string;
  operator: string;
  owner: string;
  phone: string;
  email: string;
  website: string;
  established_year: number;
  capacity: number;
  processing_capacity: number;
  storage_capacity: number;
  workforce_size: number;
  annual_revenue: number;
  products: string;
  fuel_types: string;
  processing_units: string;
  crude_oil_sources: string;
  pipeline_connections: string;
  shipping_terminals: string;
  rail_connections: string;
  environmental_certifications: string;
  complexity: string;
  utilization: number;
  annual_throughput: number;
  daily_throughput: number;
  operational_efficiency: number;
  investment_cost: number;
  operating_costs: number;
  profit_margin: number;
  market_share: number;
  technical_specs: string;
  lat: number;
  lng: number;
}

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
    const { refineryName } = await req.json();

    if (!refineryName) {
      return new Response(JSON.stringify({ error: 'Refinery name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating refinery data for:', refineryName);

    const prompt = `Generate realistic data for a refinery named "${refineryName}". Return ONLY a valid JSON object with the following structure:

{
  "name": "${refineryName}",
  "country": "realistic country based on refinery name",
  "region": "state/province/region within the country",
  "city": "city where refinery is located",
  "address": "realistic street address",
  "type": "type of refinery (e.g., Crude Oil Refinery, Petrochemical Complex)",
  "status": "operational status (Active, Under Maintenance, Planned, etc.)",
  "description": "detailed description of the refinery, its operations and significance",
  "operator": "company that operates the refinery",
  "owner": "company that owns the refinery",
  "phone": "realistic phone number with country code",
  "email": "realistic email address for the refinery",
  "website": "realistic website URL",
  "established_year": realistic year between 1950-2020,
  "capacity": realistic refining capacity in barrels per day (50000-500000),
  "processing_capacity": processing capacity slightly lower than total capacity,
  "storage_capacity": realistic storage capacity in barrels,
  "workforce_size": realistic number of employees (500-5000),
  "annual_revenue": realistic annual revenue in millions USD,
  "products": "list of refined products produced (gasoline, diesel, jet fuel, etc.)",
  "fuel_types": "types of fuels processed and produced",
  "processing_units": "description of processing units and facilities",
  "crude_oil_sources": "description of crude oil sources and suppliers",
  "pipeline_connections": "description of pipeline infrastructure",
  "shipping_terminals": "description of shipping and loading terminals",
  "rail_connections": "description of rail transport connections",
  "environmental_certifications": "environmental certifications and compliance",
  "complexity": "refinery complexity level (Simple, Moderate, Complex)",
  "utilization": realistic utilization percentage (75-95),
  "annual_throughput": realistic annual processing volume,
  "daily_throughput": realistic daily processing volume,
  "operational_efficiency": efficiency percentage (80-95),
  "investment_cost": realistic investment cost in millions USD,
  "operating_costs": realistic annual operating costs in millions USD,
  "profit_margin": realistic profit margin percentage (5-15),
  "market_share": realistic market share percentage in region,
  "technical_specs": "detailed technical specifications and capabilities",
  "lat": realistic latitude coordinate for the location,
  "lng": realistic longitude coordinate for the location
}

Important: Return ONLY the JSON object, no additional text, explanations, or markdown formatting.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates realistic refinery data. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI Response:', aiResponse);

    // Clean the response to extract JSON
    let cleanedResponse = aiResponse.trim();
    
    // Remove markdown code blocks if present
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    // Find the JSON object in the response
    const jsonStart = cleanedResponse.indexOf('{');
    const jsonEnd = cleanedResponse.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedResponse = cleanedResponse.slice(jsonStart, jsonEnd + 1);
    }

    let refineryData: RefineryData;
    try {
      refineryData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Cleaned response:', cleanedResponse);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(JSON.stringify({ refineryData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in autofill-refinery-data function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});