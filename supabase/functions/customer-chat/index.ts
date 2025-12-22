import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, ...payload } = await req.json();

    console.log(`[customer-chat] Action: ${action}`);

    switch (action) {
      case 'get_config':
        return await getChatbotConfig(supabase);
      
      case 'send_message':
        return await handleChatMessage(supabase, payload);
      
      case 'get_history':
        return await getChatHistory(supabase, payload);
      
      case 'escalate':
        return await escalateToSupport(supabase, payload);

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('[customer-chat] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getChatbotConfig(supabase: any) {
  const { data, error } = await supabase
    .from('chatbot_configs')
    .select('*, ai_assistants(name, openai_assistant_id)')
    .eq('is_active', true)
    .eq('is_default', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  // Return default config if none exists
  const config = data || {
    id: null,
    name: 'PetroDealHub Assistant',
    welcome_message: 'Hello! I\'m your PetroDealHub assistant. I can help you with:\n\n• Platform information and navigation\n• Subscription and billing questions\n• Vessel and port data\n• General support\n\nHow can I assist you today?',
    rules: {},
    allowed_topics: ['vessels', 'ports', 'refineries', 'subscriptions', 'trading', 'brokers', 'support'],
    blocked_topics: ['politics', 'religion', 'gambling', 'cryptocurrency', 'personal advice'],
    platform_data_access: true
  };

  return new Response(
    JSON.stringify({ success: true, config }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleChatMessage(supabase: any, payload: any) {
  const { message, conversation_id, user_id, user_email, user_name, subscription_tier } = payload;

  // Get API key - prefer Lovable AI, fallback to OpenAI
  const apiKey = LOVABLE_API_KEY || OPENAI_API_KEY;
  const useLovable = !!LOVABLE_API_KEY;
  
  if (!apiKey) {
    throw new Error('No AI API key configured');
  }

  // Get chatbot config
  const { data: config } = await supabase
    .from('chatbot_configs')
    .select('*, ai_assistants(openai_assistant_id)')
    .eq('is_active', true)
    .eq('is_default', true)
    .single();

  // Check for blocked topics
  const blockedTopics = config?.blocked_topics || ['politics', 'religion', 'gambling', 'cryptocurrency'];
  const lowerMessage = message.toLowerCase();
  const isBlocked = blockedTopics.some((topic: string) => lowerMessage.includes(topic.toLowerCase()));
  
  if (isBlocked) {
    return new Response(
      JSON.stringify({
        success: true,
        conversation_id,
        response: "I'm sorry, but I can only help with questions related to the PetroDealHub platform, including vessels, ports, refineries, subscriptions, and trading services. Is there something else I can assist you with?",
        escalated: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get or create conversation
  let conversation;
  if (conversation_id) {
    const { data } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();
    conversation = data;
  }

  if (!conversation) {
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .insert({
        chatbot_config_id: config?.id,
        user_id,
        user_email,
        user_name,
        subscription_tier,
        messages: [],
        status: 'active'
      })
      .select()
      .single();
    
    if (error) throw error;
    conversation = data;
  }

  // Get platform context with real database access
  const platformContext = await getPlatformContext(supabase, user_id, message);

  // Build system prompt with strict topic restrictions
  const systemPrompt = buildSystemPrompt(config, platformContext, { user_email, user_name, subscription_tier });

  // Check for escalation triggers
  const shouldEscalate = checkEscalationTriggers(message, config?.escalation_triggers || []);
  if (shouldEscalate) {
    await escalateToSupport(supabase, {
      conversation_id: conversation.id,
      user_id,
      reason: 'Escalation trigger detected',
      message
    });
  }

  // Get conversation history
  const existingMessages = conversation.messages || [];
  const chatHistory = existingMessages.slice(-10).map((m: any) => ({
    role: m.role,
    content: m.content
  }));

  // Call AI API
  const apiUrl = useLovable 
    ? 'https://ai.gateway.lovable.dev/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: useLovable ? 'google/gemini-2.5-flash' : 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: message }
      ],
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error('AI service temporarily unavailable');
  }

  const data = await response.json();
  const assistantResponse = data.choices[0]?.message?.content || 'I apologize, but I encountered an error. Please try again.';

  // Update conversation with new messages
  const newMessages = [
    ...existingMessages,
    { role: 'user', content: message, timestamp: new Date().toISOString() },
    { role: 'assistant', content: assistantResponse, timestamp: new Date().toISOString() }
  ];

  await supabase
    .from('chatbot_conversations')
    .update({ 
      messages: newMessages,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversation.id);

  return new Response(
    JSON.stringify({
      success: true,
      conversation_id: conversation.id,
      response: assistantResponse,
      escalated: shouldEscalate
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getPlatformContext(supabase: any, user_id: string, message: string) {
  const context: any = {};
  const lowerMessage = message.toLowerCase();

  // Get user subscription
  if (user_id) {
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', user_id)
      .single();
    context.subscription = subscriber;
  }

  // Get subscription plans for pricing queries
  if (lowerMessage.includes('price') || lowerMessage.includes('plan') || lowerMessage.includes('subscription') || lowerMessage.includes('cost')) {
    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('plan_name, plan_tier, price_monthly, price_yearly, features')
      .eq('is_active', true)
      .order('sort_order');
    context.available_plans = plans;
  }

  // Get vessel data for vessel queries
  if (lowerMessage.includes('vessel') || lowerMessage.includes('ship') || lowerMessage.includes('tanker')) {
    const { data: vessels, count } = await supabase
      .from('vessels')
      .select('name, vessel_type, flag, status', { count: 'exact' })
      .limit(10);
    context.vessels = { sample: vessels, total: count };
  }

  // Get port data for port queries
  if (lowerMessage.includes('port') || lowerMessage.includes('terminal')) {
    const { count } = await supabase
      .from('ports')
      .select('*', { count: 'exact', head: true });
    context.ports = { total: count };
  }

  // Get refinery data for refinery queries
  if (lowerMessage.includes('refinery') || lowerMessage.includes('refineries')) {
    const { count } = await supabase
      .from('refineries')
      .select('*', { count: 'exact', head: true });
    context.refineries = { total: count };
  }

  // Get company data for company queries
  if (lowerMessage.includes('company') || lowerMessage.includes('companies')) {
    const { count } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });
    context.companies = { total: count };
  }

  // Get platform stats for general queries
  const [vessels, ports, companies, refineries] = await Promise.all([
    supabase.from('vessels').select('*', { count: 'exact', head: true }),
    supabase.from('ports').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('refineries').select('*', { count: 'exact', head: true })
  ]);

  context.platform_stats = {
    total_vessels: vessels.count || 0,
    total_ports: ports.count || 0,
    total_companies: companies.count || 0,
    total_refineries: refineries.count || 0
  };

  return context;
}

function buildSystemPrompt(config: any, platformContext: any, userInfo: any) {
  const blockedTopics = config?.blocked_topics || ['politics', 'religion', 'gambling', 'cryptocurrency', 'personal advice'];

  let prompt = `You are a helpful customer support assistant for PetroDealHub, a professional oil trading and vessel tracking platform.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. ONLY answer questions related to PetroDealHub platform features
2. ONLY discuss: vessels, ports, refineries, companies, subscriptions, trading, broker services, platform navigation
3. NEVER discuss topics outside the platform: ${blockedTopics.join(', ')}
4. If asked about unrelated topics, politely redirect to platform-related assistance
5. Use the platform data provided to give accurate, helpful responses
6. Be concise, professional, and helpful

PLATFORM INFORMATION:
- PetroDealHub is a professional platform for oil trading professionals
- Real-time vessel tracking: ${platformContext.platform_stats?.total_vessels || 0} vessels
- Global port database: ${platformContext.platform_stats?.total_ports || 0} ports
- Refinery data: ${platformContext.platform_stats?.total_refineries || 0} refineries
- Company directory: ${platformContext.platform_stats?.total_companies || 0} companies

`;

  if (platformContext.available_plans?.length > 0) {
    prompt += `\nSUBSCRIPTION PLANS:\n`;
    for (const plan of platformContext.available_plans) {
      prompt += `- ${plan.plan_name}: $${plan.price_monthly}/month or $${plan.price_yearly}/year\n`;
    }
  }

  if (platformContext.vessels?.sample?.length > 0) {
    prompt += `\nSAMPLE VESSELS IN DATABASE:\n`;
    for (const vessel of platformContext.vessels.sample.slice(0, 5)) {
      prompt += `- ${vessel.name} (${vessel.vessel_type || 'Unknown type'})\n`;
    }
    prompt += `Total vessels tracked: ${platformContext.vessels.total}\n`;
  }

  if (userInfo.user_name) {
    prompt += `\nCURRENT USER: ${userInfo.user_name} (${userInfo.user_email})\n`;
    prompt += `Subscription: ${userInfo.subscription_tier || 'Not subscribed'}\n`;
  }

  if (platformContext.subscription) {
    const sub = platformContext.subscription;
    prompt += `\nUSER SUBSCRIPTION STATUS:\n`;
    prompt += `- Plan: ${sub.subscription_tier || 'None'}\n`;
    prompt += `- Status: ${sub.subscribed ? 'Active' : (sub.is_trial_active ? 'Trial' : 'Inactive')}\n`;
    if (sub.trial_end_date) {
      prompt += `- Trial ends: ${sub.trial_end_date}\n`;
    }
  }

  prompt += `
RESPONSE GUIDELINES:
- Be helpful and accurate
- Reference actual platform data when available
- Direct users to relevant sections: Vessels, Ports, Refineries, Subscription, Broker Dashboard
- For technical issues, suggest creating a support ticket
- Never share internal system details or other user information
- If you cannot help, politely suggest contacting support

If asked about topics outside the platform, respond with:
"I can only help with questions about the PetroDealHub platform. I can assist with vessels, ports, refineries, subscriptions, and trading services. How can I help you with these topics?"`;

  return prompt;
}

function checkEscalationTriggers(message: string, triggers: any[]) {
  const lowerMessage = message.toLowerCase();
  
  // Default escalation keywords
  const defaultTriggers = ['speak to human', 'talk to agent', 'human support', 'contact support', 'urgent help', 'billing issue', 'refund'];
  
  for (const trigger of [...defaultTriggers, ...triggers]) {
    const keyword = typeof trigger === 'string' ? trigger : trigger.keyword;
    if (lowerMessage.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

async function getChatHistory(supabase: any, payload: any) {
  const { user_id } = payload;

  const { data, error } = await supabase
    .from('chatbot_conversations')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, conversations: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function escalateToSupport(supabase: any, payload: any) {
  const { conversation_id, user_id, reason, message } = payload;

  // Create support ticket
  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id,
      subject: 'Chat Escalation: ' + (reason || 'Customer requested support'),
      description: `Escalated from chat.\n\nLast message: ${message}`,
      status: 'open',
      priority: 'high'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create support ticket:', error);
  }

  // Update conversation
  if (conversation_id) {
    await supabase
      .from('chatbot_conversations')
      .update({
        escalated: true,
        escalated_to_ticket_id: ticket?.id,
        status: 'escalated'
      })
      .eq('id', conversation_id);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      escalated: true,
      ticket_id: ticket?.id 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
