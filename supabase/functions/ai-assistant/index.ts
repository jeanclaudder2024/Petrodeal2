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
    const { message, context } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare system context with platform data
    const systemPrompt = `You are an AI assistant for an Oil Trading Platform. You have access to the following real-time platform metrics:

Platform Data:
- Total Brokers: ${context?.metrics?.totalBrokers || 0}
- Total Deals: ${context?.metrics?.totalDeals || 0}  
- Pending Approvals: ${context?.metrics?.pendingApprovals || 0}
- Total Deal Value: $${context?.metrics?.totalValue?.toLocaleString() || 0}
- Active Vessels: ${context?.metrics?.activeVessels || 0}
- Active Ports: ${context?.metrics?.activePorts || 0}
- Recent Activity (7 days): ${context?.metrics?.recentActivity || 0} new deals

Current Time: ${context?.currentTime || new Date().toISOString()}

You should provide:
1. Intelligent analysis of platform performance
2. Business insights and recommendations
3. Data-driven answers about brokers, deals, vessels, and operations
4. Actionable suggestions for platform optimization
5. Clear, concise responses in a professional tone

Focus on being helpful, accurate, and providing valuable business intelligence.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Determine response type based on content
    let responseType = 'text';
    if (message.toLowerCase().includes('analytic') || message.toLowerCase().includes('metric') || message.toLowerCase().includes('data')) {
      responseType = 'analysis';
    } else if (message.toLowerCase().includes('report') || message.toLowerCase().includes('insight')) {
      responseType = 'data';
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      type: responseType,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Assistant Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process AI request',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});