import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const vesselPortSearchSchema = z.object({
  vessel_name: z.string().max(200).optional(),
  imo: z.string().max(20).optional(),
  vessel_type: z.string().max(100).optional(),
}).refine((data) => data.vessel_name || data.imo, {
  message: "Vessel name or IMO is required"
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const validation = vesselPortSearchSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { vessel_name, imo, vessel_type } = validation.data;

    console.log(`[AI-VESSEL-PORT-SEARCH] Searching for vessel: ${vessel_name || 'N/A'}`);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('[AI-VESSEL-PORT-SEARCH] OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a search prompt to find vessel port connections
    const searchQuery = `vessel ${vessel_name || ''} ${imo ? `IMO ${imo}` : ''} ${vessel_type || ''} port connections recent voyages`.trim();
    
    const prompt = `You are a maritime data analyst. Search for information about the vessel with the following details:
    - Vessel Name: ${vessel_name || 'Unknown'}
    - IMO Number: ${imo || 'Unknown'}
    - Vessel Type: ${vessel_type || 'Unknown'}
    
    Find and extract:
    1. Recent departure ports (where the vessel has sailed FROM)
    2. Recent destination ports (where the vessel has sailed TO)
    3. Associated refineries or terminals the vessel typically visits
    
    Provide the results in this exact JSON format:
    {
      "departure_ports": ["Port Name 1", "Port Name 2"],
      "destination_ports": ["Port Name 1", "Port Name 2"],
      "refineries": ["Refinery Name 1", "Refinery Name 2"],
      "confidence": "high/medium/low",
      "notes": "Brief summary of findings"
    }
    
    Only include actual port names and refinery names you find. If no information is available, return empty arrays.
    Be precise and only include verified maritime locations.`;

    console.log(`[AI-VESSEL-PORT-SEARCH] Calling OpenAI with search query: ${searchQuery}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a maritime data expert specializing in vessel tracking and port connections. Provide accurate, factual information about vessel movements and port connections.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI-VESSEL-PORT-SEARCH] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log(`[AI-VESSEL-PORT-SEARCH] Raw AI response: ${aiResponse}`);

    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response (in case it's wrapped in markdown or other text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[AI-VESSEL-PORT-SEARCH] Failed to parse AI response:', parseError);
      // Fallback response structure
      parsedResponse = {
        departure_ports: [],
        destination_ports: [],
        refineries: [],
        confidence: "low",
        notes: "Unable to parse vessel information from available sources"
      };
    }

    console.log(`[AI-VESSEL-PORT-SEARCH] Processed response:`, parsedResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: parsedResponse 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[AI-VESSEL-PORT-SEARCH] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to search vessel port connections' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});