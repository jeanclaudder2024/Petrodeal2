import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/**
 * MCP (Model Context Protocol) Server
 * Exposes platform tools to external OpenAI Agent Builder workflows
 * Implements MCP specification for tool discovery and execution
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const { method, params } = body;

    console.log(`[mcp-server] Method: ${method}`, params);

    switch (method) {
      case 'initialize':
        return handleInitialize();

      case 'tools/list':
        return await handleToolsList(supabase);

      case 'tools/call':
        return await handleToolsCall(supabase, params);

      case 'prompts/list':
        return handlePromptsList();

      case 'resources/list':
        return await handleResourcesList(supabase);

      default:
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method not found: ${method}` },
            id: body.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('[mcp-server] Error:', error);
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32603, message: error?.message || 'Unknown error' },
        id: null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// MCP Initialize response
function handleInitialize() {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: true },
          prompts: { listChanged: true },
          resources: { subscribe: true, listChanged: true }
        },
        serverInfo: {
          name: 'petrodealhub-mcp-server',
          version: '1.0.0'
        }
      },
      id: 1
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// List all available tools
async function handleToolsList(supabase: any) {
  const { data: tools, error } = await supabase
    .from('agent_tools')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;

  const mcpTools = tools.map((tool: any) => ({
    name: tool.function_name.replace(/-/g, '_'),
    description: tool.description,
    inputSchema: {
      type: 'object',
      properties: tool.parameters?.properties || {},
      required: tool.parameters?.required || []
    }
  }));

  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      result: { tools: mcpTools },
      id: 1
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Execute a tool call
async function handleToolsCall(supabase: any, params: any) {
  const { name, arguments: args } = params;
  
  // Convert back to edge function name format
  const functionName = name.replace(/_/g, '-');

  console.log(`[mcp-server] Calling tool: ${functionName}`, args);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args || {})
  });

  const result = await response.json();

  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      },
      id: 1
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// List available prompts
function handlePromptsList() {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      result: {
        prompts: [
          {
            name: 'analyze_vessel',
            description: 'Analyze vessel data and provide insights',
            arguments: [
              { name: 'vessel_id', description: 'Vessel ID or IMO number', required: true }
            ]
          },
          {
            name: 'process_order',
            description: 'Process and validate an order',
            arguments: [
              { name: 'order_id', description: 'Order ID', required: true }
            ]
          },
          {
            name: 'generate_report',
            description: 'Generate a report based on data',
            arguments: [
              { name: 'report_type', description: 'Type of report', required: true },
              { name: 'date_range', description: 'Date range for the report', required: false }
            ]
          }
        ]
      },
      id: 1
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// List available resources (database tables)
async function handleResourcesList(supabase: any) {
  const resources = [
    { uri: 'petrodealhub://vessels', name: 'Vessels', description: 'Vessel tracking data', mimeType: 'application/json' },
    { uri: 'petrodealhub://ports', name: 'Ports', description: 'Port information', mimeType: 'application/json' },
    { uri: 'petrodealhub://refineries', name: 'Refineries', description: 'Refinery data', mimeType: 'application/json' },
    { uri: 'petrodealhub://companies', name: 'Companies', description: 'Company information', mimeType: 'application/json' },
    { uri: 'petrodealhub://oil-prices', name: 'Oil Prices', description: 'Current oil prices', mimeType: 'application/json' },
    { uri: 'petrodealhub://deals', name: 'Deals', description: 'Trading deals', mimeType: 'application/json' }
  ];

  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      result: { resources },
      id: 1
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
