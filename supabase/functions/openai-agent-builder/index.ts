import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Valid OpenAI models
const VALID_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];

// Sanitize model name - ensure it's a valid OpenAI model
function sanitizeModel(model: string | undefined): string {
  if (!model) return 'gpt-4o';
  const normalized = model.toLowerCase().trim();
  // Check for exact match
  if (VALID_MODELS.includes(normalized)) return normalized;
  // Check for close matches (e.g., gpt-4.0 -> gpt-4o)
  if (normalized.includes('gpt-4') && normalized.includes('mini')) return 'gpt-4o-mini';
  if (normalized.includes('gpt-4')) return 'gpt-4o';
  if (normalized.includes('gpt-3')) return 'gpt-3.5-turbo';
  // Default fallback
  return 'gpt-4o';
}

// Blueprint JSON Schema for validation
const BLUEPRINT_SCHEMA = {
  required: ['assistants', 'sdk_agents', 'tools', 'workflows'],
  assistantRequired: ['name', 'instructions'],
  agentRequired: ['name', 'responsibility', 'triggers', 'tools'],
  toolRequired: ['name', 'type', 'function_name'],
  workflowRequired: ['name', 'trigger', 'steps']
};

// All available edge functions that can be used as tools
const EDGE_FUNCTIONS = [
  { name: 'AI Vessel Search', function_name: 'ai-vessel-search', category: 'vessel', description: 'Search for vessel information using AI', edge_function_url: '/functions/v1/ai-vessel-search' },
  { name: 'AI Vessel Port Search', function_name: 'ai-vessel-port-search', category: 'vessel', description: 'Search vessel and port data with AI analysis', edge_function_url: '/functions/v1/ai-vessel-port-search' },
  { name: 'Autofill Vessel Data', function_name: 'autofill-vessel-data', category: 'vessel', description: 'Auto-populate vessel information from databases', edge_function_url: '/functions/v1/autofill-vessel-data' },
  { name: 'Autofill Port Data', function_name: 'autofill-port-data', category: 'port', description: 'Auto-populate port information', edge_function_url: '/functions/v1/autofill-port-data' },
  { name: 'Autofill Refinery Data', function_name: 'autofill-refinery-data', category: 'refinery', description: 'Auto-populate refinery information', edge_function_url: '/functions/v1/autofill-refinery-data' },
  { name: 'Autofill Company Data', function_name: 'autofill-company-data', category: 'company', description: 'Auto-populate company information', edge_function_url: '/functions/v1/autofill-company-data' },
  { name: 'Send Confirmation Email', function_name: 'send-confirmation-email', category: 'email', description: 'Send confirmation emails to users', edge_function_url: '/functions/v1/send-confirmation-email' },
  { name: 'Send Automated Email', function_name: 'send-automated-email', category: 'email', description: 'Send automated emails based on triggers', edge_function_url: '/functions/v1/send-automated-email' },
  { name: 'Send Billing Email', function_name: 'send-billing-email', category: 'billing', description: 'Send billing-related emails', edge_function_url: '/functions/v1/send-billing-email' },
  { name: 'Check Subscription', function_name: 'check-subscription', category: 'subscription', description: 'Check user subscription status', edge_function_url: '/functions/v1/check-subscription' },
  { name: 'Check Broker Membership', function_name: 'check-broker-membership', category: 'broker', description: 'Verify broker membership status', edge_function_url: '/functions/v1/check-broker-membership' },
  { name: 'Create Checkout', function_name: 'create-checkout', category: 'billing', description: 'Create Stripe checkout session', edge_function_url: '/functions/v1/create-checkout' },
  { name: 'Create Broker Checkout', function_name: 'create-broker-checkout', category: 'broker', description: 'Create broker membership checkout', edge_function_url: '/functions/v1/create-broker-checkout' },
  { name: 'Fetch Oil Prices', function_name: 'fetch-oil-prices', category: 'market', description: 'Fetch current oil prices from API', edge_function_url: '/functions/v1/fetch-oil-prices' },
  { name: 'Test Email Connection', function_name: 'test-email-connection', category: 'email', description: 'Test SMTP/IMAP email configuration', edge_function_url: '/functions/v1/test-email-connection' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, ...payload } = await req.json();

    console.log(`[openai-agent-builder] Action: ${action}`, payload);

    switch (action) {
      case 'discover_tools':
        return await discoverTools(supabase);
      case 'add_tool':
        return await addTool(supabase, payload);
      case 'test_tool':
        return await testTool(supabase, payload);
      case 'create_assistant':
        return await createAssistant(supabase, payload);
      case 'update_assistant':
        return await updateAssistant(supabase, payload);
      case 'delete_assistant':
        return await deleteAssistant(supabase, payload);
      case 'chat_with_assistant':
        return await chatWithAssistant(supabase, payload);
      case 'create_agent':
        return await createAgent(supabase, payload);
      case 'update_agent':
        return await updateAgent(supabase, payload);
      case 'delete_agent':
        return await deleteAgent(supabase, payload);
      case 'compile_to_assistant':
        return await compileToAssistant(supabase, payload);
      case 'prompt_to_json':
        return await promptToJson(payload);
      case 'validate_blueprint':
        return await validateBlueprint(payload);
      case 'compile_blueprint':
        return await compileBlueprint(supabase, payload);
      case 'create_workflow':
        return await createWorkflow(supabase, payload);
      case 'update_workflow':
        return await updateWorkflow(supabase, payload);
      case 'delete_workflow':
        return await deleteWorkflow(supabase, payload);
      case 'trigger_workflow':
        return await triggerWorkflow(supabase, payload);
      case 'get_event_registry':
        return await getEventRegistry(supabase);
      case 'get_platform_data':
        return await getPlatformData(supabase, payload);
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('[openai-agent-builder] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Validate Blueprint JSON against strict schema
function validateBlueprintSchema(blueprint: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check top-level structure
  for (const field of BLUEPRINT_SCHEMA.required) {
    if (!blueprint[field]) {
      errors.push(`Missing required field: ${field}`);
    } else if (!Array.isArray(blueprint[field]) && field !== 'global_rules') {
      errors.push(`Field ${field} must be an array`);
    }
  }

  // Validate assistants (chat only - no triggers)
  if (Array.isArray(blueprint.assistants)) {
    blueprint.assistants.forEach((assistant: any, idx: number) => {
      for (const field of BLUEPRINT_SCHEMA.assistantRequired) {
        if (!assistant[field]) {
          errors.push(`Assistant[${idx}] missing required field: ${field}`);
        }
      }
      if (assistant.triggers && assistant.triggers.length > 0) {
        errors.push(`Assistant[${idx}] must not have triggers (chat/analysis only)`);
      }
    });
  }

  // Validate SDK agents (event-driven - must have triggers)
  if (Array.isArray(blueprint.sdk_agents)) {
    blueprint.sdk_agents.forEach((agent: any, idx: number) => {
      for (const field of BLUEPRINT_SCHEMA.agentRequired) {
        if (!agent[field]) {
          errors.push(`SDK Agent[${idx}] missing required field: ${field}`);
        }
      }
      if (!agent.triggers || agent.triggers.length === 0) {
        errors.push(`SDK Agent[${idx}] must have at least one trigger (event-driven)`);
      }
      if (!agent.responsibility) {
        errors.push(`SDK Agent[${idx}] must have a responsibility description`);
      }
    });
  }

  // Validate tools
  if (Array.isArray(blueprint.tools)) {
    blueprint.tools.forEach((tool: any, idx: number) => {
      for (const field of BLUEPRINT_SCHEMA.toolRequired) {
        if (!tool[field]) {
          errors.push(`Tool[${idx}] missing required field: ${field}`);
        }
      }
      if (!tool.used_by || tool.used_by.length === 0) {
        errors.push(`Tool[${idx}] must specify which agents use it (used_by)`);
      }
    });
  }

  // Validate workflows
  if (Array.isArray(blueprint.workflows)) {
    blueprint.workflows.forEach((workflow: any, idx: number) => {
      for (const field of BLUEPRINT_SCHEMA.workflowRequired) {
        if (!workflow[field]) {
          errors.push(`Workflow[${idx}] missing required field: ${field}`);
        }
      }
      if (!workflow.steps || workflow.steps.length === 0) {
        errors.push(`Workflow[${idx}] must have at least one step`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

// Validate Blueprint action
async function validateBlueprint(payload: any) {
  const validation = validateBlueprintSchema(payload.blueprint);
  
  return new Response(
    JSON.stringify({ 
      success: validation.valid, 
      valid: validation.valid,
      errors: validation.errors,
      summary: {
        assistants: payload.blueprint?.assistants?.length || 0,
        sdk_agents: payload.blueprint?.sdk_agents?.length || 0,
        tools: payload.blueprint?.tools?.length || 0,
        workflows: payload.blueprint?.workflows?.length || 0
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Compile Blueprint - step by step creation
async function compileBlueprint(supabase: any, payload: any) {
  const { blueprint, target, target_index, created_by } = payload;
  
  // Validate first
  const validation = validateBlueprintSchema(blueprint);
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ success: false, errors: validation.errors }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const results: any[] = [];

  if (target === 'assistant' && typeof target_index === 'number') {
    const assistantConfig = blueprint.assistants[target_index];
    if (!assistantConfig) {
      throw new Error(`Assistant at index ${target_index} not found`);
    }

    // Create the assistant with sanitized model
    const result = await createAssistant(supabase, {
      name: assistantConfig.name,
      description: assistantConfig.description,
      instructions: assistantConfig.instructions,
      model: sanitizeModel(assistantConfig.model),
      tools: assistantConfig.platform_tools || [],
      file_search: assistantConfig.file_search || false,
      code_interpreter: assistantConfig.code_interpreter || false,
      created_by
    });
    const data = await result.json();
    results.push({ type: 'assistant', ...data });
  }

  if (target === 'sdk_agent' && typeof target_index === 'number') {
    const agentConfig = blueprint.sdk_agents[target_index];
    if (!agentConfig) {
      throw new Error(`SDK Agent at index ${target_index} not found`);
    }

    // Resolve tools from the blueprint
    const resolvedTools = (agentConfig.tools || []).map((toolName: string) => {
      const tool = blueprint.tools?.find((t: any) => t.name === toolName || t.function_name === toolName);
      return tool || { name: toolName, function_name: toolName };
    });

    // Create the agent with sanitized model
    const result = await createAgent(supabase, {
      name: agentConfig.name,
      description: agentConfig.description,
      system_prompt: agentConfig.responsibility,
      model: sanitizeModel(agentConfig.model),
      tools: resolvedTools,
      triggers: agentConfig.triggers,
      behaviors: agentConfig.behaviors || {},
      created_by
    });
    const data = await result.json();
    results.push({ type: 'sdk_agent', ...data });
  }

  return new Response(
    JSON.stringify({ success: true, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Test a single tool independently
async function testTool(supabase: any, payload: any) {
  const { tool_id, parameters } = payload;
  const startTime = Date.now();

  // Get tool info
  const { data: tool, error: toolError } = await supabase
    .from('agent_tools')
    .select('*')
    .eq('id', tool_id)
    .single();

  if (toolError) throw toolError;

  let result: any = null;
  let status = 'success';
  let errorMessage = '';

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${tool.function_name}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parameters || {})
    });

    if (!response.ok) {
      status = 'error';
      errorMessage = await response.text();
    } else {
      result = await response.json();
    }
  } catch (err: any) {
    status = 'error';
    errorMessage = err.message;
  }

  const executionTime = Date.now() - startTime;

  // Update tool stats
  await supabase
    .from('agent_tools')
    .update({
      last_executed_at: new Date().toISOString(),
      last_execution_status: status,
      execution_count: (tool.execution_count || 0) + 1,
      avg_execution_time_ms: Math.round(((tool.avg_execution_time_ms || 0) * (tool.execution_count || 0) + executionTime) / ((tool.execution_count || 0) + 1))
    })
    .eq('id', tool_id);

  // Log execution
  await supabase
    .from('agent_executions')
    .insert({
      trigger_event: 'tool_test',
      trigger_data: { tool_id, parameters },
      status: status === 'success' ? 'completed' : 'failed',
      source: 'tool_test',
      steps_completed: [{
        step: 1,
        node_type: 'tool',
        label: tool.name,
        status,
        result: result || { error: errorMessage },
        duration_ms: executionTime
      }],
      execution_time_ms: executionTime,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      error_message: errorMessage || null
    });

  return new Response(
    JSON.stringify({ 
      success: status === 'success',
      tool_name: tool.name,
      function_name: tool.function_name,
      result,
      error: errorMessage,
      execution_time_ms: executionTime
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get platform data for Assistant queries
async function getPlatformData(supabase: any, payload: any) {
  const { query_type, query_params } = payload;
  let result: any = null;

  switch (query_type) {
    case 'vessel_by_imo':
      const { data: vessel } = await supabase
        .from('vessels')
        .select('*')
        .eq('imo', query_params.imo)
        .single();
      result = vessel;
      break;

    case 'vessel_by_mmsi':
      const { data: vesselMmsi } = await supabase
        .from('vessels')
        .select('*')
        .eq('mmsi', query_params.mmsi)
        .single();
      result = vesselMmsi;
      break;

    case 'port_by_name':
      const { data: port } = await supabase
        .from('ports')
        .select('*')
        .ilike('name', `%${query_params.name}%`)
        .limit(5);
      result = port;
      break;

    case 'subscription_info':
      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', query_params.user_id)
        .single();
      result = subscriber;
      break;

    case 'subscription_plans':
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true);
      result = plans;
      break;

    case 'platform_stats':
      const [vessels, ports, companies, brokers] = await Promise.all([
        supabase.from('vessels').select('*', { count: 'exact', head: true }),
        supabase.from('ports').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('broker_profiles').select('*', { count: 'exact', head: true })
      ]);
      result = {
        total_vessels: vessels.count,
        total_ports: ports.count,
        total_companies: companies.count,
        total_brokers: brokers.count
      };
      break;
  }

  return new Response(
    JSON.stringify({ success: true, data: result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get Event Registry
async function getEventRegistry(supabase: any) {
  const { data, error } = await supabase
    .from('event_registry')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, events: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Discover and populate available tools from edge functions
async function discoverTools(supabase: any) {
  const tools = EDGE_FUNCTIONS.map(fn => ({
    name: fn.name,
    function_name: fn.function_name,
    description: fn.description,
    category: fn.category,
    edge_function_url: fn.edge_function_url,
    parameters: {},
    is_active: true,
    is_system: true
  }));

  // Upsert tools to database
  for (const tool of tools) {
    await supabase
      .from('agent_tools')
      .upsert(tool, { onConflict: 'function_name' });
  }

  const { data, error } = await supabase
    .from('agent_tools')
    .select('*')
    .order('category', { ascending: true });

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, tools: data, discovered: tools.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Add custom tool
async function addTool(supabase: any, payload: any) {
  const { data, error } = await supabase
    .from('agent_tools')
    .insert({
      name: payload.name,
      function_name: payload.function_name,
      description: payload.description,
      category: payload.category || 'custom',
      edge_function_url: payload.edge_function_url || `/functions/v1/${payload.function_name}`,
      parameters: payload.parameters || {},
      is_active: true,
      is_system: false
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, tool: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Create OpenAI Assistant
async function createAssistant(supabase: any, payload: any) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Build tools array for OpenAI
  const openaiTools: any[] = [];
  if (payload.file_search) openaiTools.push({ type: 'file_search' });
  if (payload.code_interpreter) openaiTools.push({ type: 'code_interpreter' });

  // Add function tools with platform data access
  if (payload.tools && payload.tools.length > 0) {
    for (const tool of payload.tools) {
      openaiTools.push({
        type: 'function',
        function: {
          name: tool.function_name?.replace(/-/g, '_') || tool.name?.replace(/\s+/g, '_').toLowerCase(),
          description: tool.description || `Execute ${tool.name}`,
          parameters: tool.parameters || { type: 'object', properties: {} }
        }
      });
    }
  }

  // Add platform data query function
  openaiTools.push({
    type: 'function',
    function: {
      name: 'query_platform_data',
      description: 'Query platform data including vessels, ports, companies, subscriptions, and statistics',
      parameters: {
        type: 'object',
        properties: {
          query_type: {
            type: 'string',
            enum: ['vessel_by_imo', 'vessel_by_mmsi', 'port_by_name', 'subscription_info', 'subscription_plans', 'platform_stats'],
            description: 'Type of data to query'
          },
          query_params: {
            type: 'object',
            description: 'Parameters for the query (e.g., imo, mmsi, name, user_id)'
          }
        },
        required: ['query_type']
      }
    }
  });

  // Create on OpenAI platform
  const openaiResponse = await fetch('https://api.openai.com/v1/assistants', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      name: payload.name,
      instructions: payload.instructions,
      model: payload.model || 'gpt-4o',
      tools: openaiTools
    })
  });

  if (!openaiResponse.ok) {
    const errorData = await openaiResponse.text();
    console.error('[createAssistant] OpenAI error:', errorData);
    throw new Error(`OpenAI API error: ${errorData}`);
  }

  const openaiAssistant = await openaiResponse.json();
  console.log('[createAssistant] Created on OpenAI:', openaiAssistant.id);

  // Store in database
  const { data, error } = await supabase
    .from('ai_assistants')
    .insert({
      name: payload.name,
      description: payload.description,
      openai_assistant_id: openaiAssistant.id,
      instructions: payload.instructions,
      model: payload.model || 'gpt-4o',
      tools: payload.tools || [],
      file_search: payload.file_search || false,
      code_interpreter: payload.code_interpreter || false,
      is_active: true,
      created_by: payload.created_by
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, assistant: data, openai_id: openaiAssistant.id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Update OpenAI Assistant
async function updateAssistant(supabase: any, payload: any) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const { data: existing, error: fetchError } = await supabase
    .from('ai_assistants')
    .select('*')
    .eq('id', payload.id)
    .single();

  if (fetchError) throw fetchError;

  const openaiTools: any[] = [];
  if (payload.file_search) openaiTools.push({ type: 'file_search' });
  if (payload.code_interpreter) openaiTools.push({ type: 'code_interpreter' });

  if (payload.tools && payload.tools.length > 0) {
    for (const tool of payload.tools) {
      openaiTools.push({
        type: 'function',
        function: {
          name: tool.function_name?.replace(/-/g, '_') || tool.name?.replace(/\s+/g, '_').toLowerCase(),
          description: tool.description || `Execute ${tool.name}`,
          parameters: tool.parameters || { type: 'object', properties: {} }
        }
      });
    }
  }

  // Add platform data query function
  openaiTools.push({
    type: 'function',
    function: {
      name: 'query_platform_data',
      description: 'Query platform data including vessels, ports, companies, subscriptions, and statistics',
      parameters: {
        type: 'object',
        properties: {
          query_type: {
            type: 'string',
            enum: ['vessel_by_imo', 'vessel_by_mmsi', 'port_by_name', 'subscription_info', 'subscription_plans', 'platform_stats'],
            description: 'Type of data to query'
          },
          query_params: {
            type: 'object',
            description: 'Parameters for the query'
          }
        },
        required: ['query_type']
      }
    }
  });

  if (existing.openai_assistant_id) {
    const openaiResponse = await fetch(`https://api.openai.com/v1/assistants/${existing.openai_assistant_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: payload.name,
        instructions: payload.instructions,
        model: payload.model || 'gpt-4o',
        tools: openaiTools
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('[updateAssistant] OpenAI error:', errorData);
    }
  }

  const { data, error } = await supabase
    .from('ai_assistants')
    .update({
      name: payload.name,
      description: payload.description,
      instructions: payload.instructions,
      model: payload.model,
      tools: payload.tools,
      file_search: payload.file_search,
      code_interpreter: payload.code_interpreter,
      is_active: payload.is_active
    })
    .eq('id', payload.id)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, assistant: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Delete OpenAI Assistant
async function deleteAssistant(supabase: any, payload: any) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const { data: existing, error: fetchError } = await supabase
    .from('ai_assistants')
    .select('openai_assistant_id')
    .eq('id', payload.id)
    .single();

  if (fetchError) throw fetchError;

  if (existing.openai_assistant_id) {
    await fetch(`https://api.openai.com/v1/assistants/${existing.openai_assistant_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
  }

  const { error } = await supabase
    .from('ai_assistants')
    .delete()
    .eq('id', payload.id);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Chat with Assistant - with function calling support
async function chatWithAssistant(supabase: any, payload: any) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const { assistant_id, message, thread_id, user_id } = payload;

  const { data: assistant, error: fetchError } = await supabase
    .from('ai_assistants')
    .select('openai_assistant_id')
    .eq('id', assistant_id)
    .single();

  if (fetchError) throw fetchError;

  let currentThreadId = thread_id;

  if (!currentThreadId) {
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    const thread = await threadResponse.json();
    currentThreadId = thread.id;

    await supabase
      .from('assistant_conversations')
      .insert({
        assistant_id,
        user_id,
        openai_thread_id: currentThreadId,
        messages: []
      });
  }

  await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({ role: 'user', content: message })
  });

  const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({ assistant_id: assistant.openai_assistant_id })
  });

  let run = await runResponse.json();

  // Poll for completion with function calling support
  while (run.status === 'queued' || run.status === 'in_progress' || run.status === 'requires_action') {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Handle function calls
    if (run.status === 'requires_action' && run.required_action?.type === 'submit_tool_outputs') {
      const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
      const toolOutputs: any[] = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        let output: any = { error: 'Unknown function' };

        if (functionName === 'query_platform_data') {
          const result = await getPlatformData(supabase, {
            query_type: args.query_type,
            query_params: args.query_params || {}
          });
          const data = await result.json();
          output = data;
        }

        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify(output)
        });
      }

      // Submit tool outputs
      await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${run.id}/submit_tool_outputs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({ tool_outputs: toolOutputs })
      });
    }

    const pollResponse = await fetch(
      `https://api.openai.com/v1/threads/${currentThreadId}/runs/${run.id}`,
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );
    run = await pollResponse.json();
  }

  const messagesResponse = await fetch(
    `https://api.openai.com/v1/threads/${currentThreadId}/messages`,
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    }
  );
  const messagesData = await messagesResponse.json();
  const assistantMessage = messagesData.data[0];

  await supabase
    .from('assistant_conversations')
    .update({
      messages: messagesData.data.reverse()
    })
    .eq('openai_thread_id', currentThreadId);

  return new Response(
    JSON.stringify({
      success: true,
      thread_id: currentThreadId,
      message: assistantMessage.content[0]?.text?.value || '',
      run_status: run.status
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Create local SDK Agent
async function createAgent(supabase: any, payload: any) {
  const { data, error } = await supabase
    .from('ai_agents')
    .insert({
      name: payload.name,
      description: payload.description,
      system_prompt: payload.system_prompt,
      model: payload.model || 'gpt-4o',
      tools: payload.tools || [],
      workflows: payload.workflows || [],
      behaviors: payload.behaviors || {},
      triggers: payload.triggers || [],
      is_active: true,
      created_by: payload.created_by
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, agent: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Update local SDK Agent
async function updateAgent(supabase: any, payload: any) {
  const { data, error } = await supabase
    .from('ai_agents')
    .update({
      name: payload.name,
      description: payload.description,
      system_prompt: payload.system_prompt,
      model: payload.model,
      tools: payload.tools,
      workflows: payload.workflows,
      behaviors: payload.behaviors,
      triggers: payload.triggers,
      compiled_json: payload.compiled_json,
      is_active: payload.is_active
    })
    .eq('id', payload.id)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, agent: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Delete local SDK Agent
async function deleteAgent(supabase: any, payload: any) {
  const { error } = await supabase
    .from('ai_agents')
    .delete()
    .eq('id', payload.id);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Compile Agent to OpenAI Assistant
async function compileToAssistant(supabase: any, payload: any) {
  const { data: agent, error: fetchError } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('id', payload.agent_id)
    .single();

  if (fetchError) throw fetchError;

  const result = await createAssistant(supabase, {
    name: agent.name,
    description: agent.description,
    instructions: agent.system_prompt,
    model: agent.model,
    tools: agent.tools,
    created_by: agent.created_by
  });

  const resultData = await result.json();

  await supabase
    .from('ai_agents')
    .update({ linked_assistant_id: resultData.assistant.id })
    .eq('id', payload.agent_id);

  return new Response(
    JSON.stringify({ success: true, assistant: resultData.assistant }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Convert plain English prompt to STRICT Blueprint JSON
async function promptToJson(payload: any) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const strictSystemPrompt = `You are a STRICT AI Blueprint Generator. You MUST output ONLY valid JSON with NO explanations, NO comments, NO markdown.

OUTPUT ONLY THIS EXACT JSON STRUCTURE:
{
  "assistants": [],
  "sdk_agents": [],
  "tools": [],
  "workflows": [],
  "global_rules": {}
}

RULES:
1. ASSISTANTS are for chat/analysis ONLY - NO triggers, NO automated actions
   Required fields: name, instructions, model
   Optional: description, platform_tools (array of tool names for data access)

2. SDK_AGENTS are event-driven ONLY - MUST have triggers and responsibility
   Required fields: name, responsibility (detailed system prompt), triggers (array), tools (array)
   Optional: description, model, behaviors

3. TOOLS are atomic actions
   Required fields: name, type, function_name, used_by (array of agent names that use this tool)
   Available types: vessel, port, email, subscription, billing, broker, market, custom

4. WORKFLOWS define orchestration only
   Required fields: name, trigger (event name), steps (array of step objects)
   Step object: { step: number, type: "tool"|"condition"|"ai"|"action", config: {} }

5. GLOBAL_RULES: { escalation_policy: string, error_handling: string }

Available trigger events: vessel_arrived, vessel_departed, vessel_eta_updated, order_created, order_updated, order_completed, support_ticket_created, email_received, subscription_started, subscription_cancelled, payment_successful, payment_failed, broker_approved, deal_created, deal_completed, manual

Available tool function_names: ai-vessel-search, ai-vessel-port-search, autofill-vessel-data, autofill-port-data, autofill-refinery-data, autofill-company-data, send-confirmation-email, send-automated-email, check-subscription, check-broker-membership, fetch-oil-prices

Analyze the user's description and generate ONLY the JSON. No other text.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: strictSystemPrompt },
        { role: 'user', content: payload.prompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  const data = await response.json();
  let config: any;
  
  try {
    config = JSON.parse(data.choices[0].message.content);
  } catch (e) {
    throw new Error('Failed to parse AI response as JSON');
  }

  // Validate the generated blueprint
  const validation = validateBlueprintSchema(config);

  return new Response(
    JSON.stringify({ 
      success: true, 
      config,
      validation,
      raw_response: data.choices[0].message.content
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Create workflow
async function createWorkflow(supabase: any, payload: any) {
  const { data, error } = await supabase
    .from('agent_workflows')
    .insert({
      name: payload.name,
      description: payload.description,
      trigger_event: payload.trigger_event,
      steps: payload.steps || { nodes: [], edges: [] },
      is_active: true,
      created_by: payload.created_by
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, workflow: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Update workflow
async function updateWorkflow(supabase: any, payload: any) {
  const { data, error } = await supabase
    .from('agent_workflows')
    .update({
      name: payload.name,
      description: payload.description,
      trigger_event: payload.trigger_event,
      steps: payload.steps,
      is_active: payload.is_active,
      version: payload.version
    })
    .eq('id', payload.id)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, workflow: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Delete workflow
async function deleteWorkflow(supabase: any, payload: any) {
  const { error } = await supabase
    .from('agent_workflows')
    .delete()
    .eq('id', payload.id);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Trigger workflow execution with test payload support
async function triggerWorkflow(supabase: any, payload: any) {
  const { data: execution, error } = await supabase
    .from('agent_executions')
    .insert({
      workflow_id: payload.workflow_id,
      trigger_event: payload.trigger_event || 'manual',
      trigger_data: payload.trigger_data || {},
      status: 'pending',
      source: 'workflow',
      execution_trace: [],
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  // Trigger executor (async)
  fetch(`${SUPABASE_URL}/functions/v1/openai-agent-executor`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ execution_id: execution.id })
  }).catch(console.error);

  return new Response(
    JSON.stringify({ success: true, execution }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}