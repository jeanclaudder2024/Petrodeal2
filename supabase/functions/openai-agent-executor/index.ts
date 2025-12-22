import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { execution_id } = await req.json();

    if (!execution_id) {
      throw new Error('execution_id is required');
    }

    console.log(`[openai-agent-executor] Starting execution: ${execution_id}`);

    // Get execution record
    const { data: execution, error: execError } = await supabase
      .from('agent_executions')
      .select('*, agent_workflows(*)')
      .eq('id', execution_id)
      .single();

    if (execError) throw execError;

    // Update status to running
    await supabase
      .from('agent_executions')
      .update({ status: 'running' })
      .eq('id', execution_id);

    const workflow = execution.agent_workflows;
    const steps = workflow.steps;
    const stepsCompleted: any[] = [];
    const executionTrace: any[] = [];
    let currentStep = 0;

    // Process each node in workflow
    for (const node of steps.nodes || []) {
      if (node.type === 'trigger' || node.type === 'input') continue; // Skip trigger nodes
      
      currentStep++;
      const stepStart = Date.now();

      try {
        console.log(`[openai-agent-executor] Executing step ${currentStep}: ${node.data?.label}`);

        let stepResult: any = null;
        let edgeFunctionCall: any = null;

        switch (node.type) {
          case 'tool':
            const toolResult = await executeToolNode(node, execution.trigger_data);
            stepResult = toolResult.result;
            edgeFunctionCall = toolResult.trace;
            break;
          
          case 'condition':
            stepResult = await evaluateCondition(node, execution.trigger_data, stepsCompleted);
            break;

          case 'ai':
            stepResult = await executeAINode(node, execution.trigger_data, stepsCompleted);
            break;

          case 'action':
            stepResult = await executeActionNode(node, execution.trigger_data, supabase);
            break;

          default:
            stepResult = { skipped: true, reason: `Unknown node type: ${node.type}` };
        }

        const stepDuration = Date.now() - stepStart;

        stepsCompleted.push({
          step: currentStep,
          node_id: node.id,
          node_type: node.type,
          label: node.data?.label,
          status: 'completed',
          result: stepResult,
          duration_ms: stepDuration,
          completed_at: new Date().toISOString()
        });

        // Add to execution trace
        if (edgeFunctionCall) {
          executionTrace.push({
            step: currentStep,
            type: 'edge_function',
            function_name: edgeFunctionCall.function_name,
            input: edgeFunctionCall.input,
            output: edgeFunctionCall.output,
            status: edgeFunctionCall.status,
            duration_ms: stepDuration,
            timestamp: new Date().toISOString()
          });
        }

        // Update progress
        await supabase
          .from('agent_executions')
          .update({
            current_step: currentStep,
            steps_completed: stepsCompleted,
            execution_trace: executionTrace
          })
          .eq('id', execution_id);

      } catch (stepError: any) {
        console.error(`[openai-agent-executor] Step ${currentStep} failed:`, stepError);

        stepsCompleted.push({
          step: currentStep,
          node_id: node.id,
          node_type: node.type,
          label: node.data?.label,
          status: 'failed',
          error: stepError.message,
          duration_ms: Date.now() - stepStart,
          completed_at: new Date().toISOString()
        });

        executionTrace.push({
          step: currentStep,
          type: 'error',
          error: stepError.message,
          timestamp: new Date().toISOString()
        });

        // Mark execution as failed
        await supabase
          .from('agent_executions')
          .update({
            status: 'failed',
            error_message: stepError.message,
            current_step: currentStep,
            steps_completed: stepsCompleted,
            execution_trace: executionTrace,
            completed_at: new Date().toISOString(),
            execution_time_ms: Date.now() - new Date(execution.started_at).getTime()
          })
          .eq('id', execution_id);

        return new Response(
          JSON.stringify({ success: false, error: stepError.message, steps: stepsCompleted }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Mark execution as completed
    const completedAt = new Date().toISOString();
    const executionTime = Date.now() - new Date(execution.started_at).getTime();

    await supabase
      .from('agent_executions')
      .update({
        status: 'completed',
        current_step: currentStep,
        steps_completed: stepsCompleted,
        execution_trace: executionTrace,
        completed_at: completedAt,
        execution_time_ms: executionTime
      })
      .eq('id', execution_id);

    console.log(`[openai-agent-executor] Execution completed in ${executionTime}ms`);

    return new Response(
      JSON.stringify({ success: true, steps: stepsCompleted, execution_time_ms: executionTime }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[openai-agent-executor] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Execute a tool/edge function node with trace
async function executeToolNode(node: any, triggerData: any) {
  const functionName = node.data?.function_name;
  if (!functionName) {
    throw new Error('No function_name specified for tool node');
  }

  const payload = {
    ...node.data?.parameters,
    ...triggerData
  };

  const trace = {
    function_name: functionName,
    input: payload,
    output: null as any,
    status: 'pending'
  };

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    trace.output = { error: errorText };
    trace.status = 'failed';
    throw new Error(`Tool ${functionName} failed: ${errorText}`);
  }

  const result = await response.json();
  trace.output = result;
  trace.status = 'success';

  return { result, trace };
}

// Evaluate condition node
async function evaluateCondition(node: any, triggerData: any, previousSteps: any[]) {
  const condition = node.data?.condition;
  if (!condition) {
    return { result: true, reason: 'No condition specified, defaulting to true' };
  }

  // Simple condition evaluation
  const match = condition.match(/(\w+)\s*(==|!=|>|<|>=|<=)\s*['"]?([^'"]+)['"]?/);
  if (!match) {
    return { result: true, reason: 'Invalid condition format' };
  }

  const [, field, operator, value] = match;
  const fieldValue = triggerData[field];

  let result = false;
  switch (operator) {
    case '==': result = String(fieldValue) === value; break;
    case '!=': result = String(fieldValue) !== value; break;
    case '>': result = Number(fieldValue) > Number(value); break;
    case '<': result = Number(fieldValue) < Number(value); break;
    case '>=': result = Number(fieldValue) >= Number(value); break;
    case '<=': result = Number(fieldValue) <= Number(value); break;
  }

  return { result, field, operator, value, fieldValue };
}

// Execute AI reasoning node
async function executeAINode(node: any, triggerData: any, previousSteps: any[]) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const prompt = node.data?.prompt || 'Analyze the provided data and suggest next steps.';
  const context = {
    trigger_data: triggerData,
    previous_steps: previousSteps.map(s => ({ label: s.label, result: s.result }))
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: node.data?.model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI agent executing a workflow step. Analyze the context and provide a structured response.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nContext:\n${JSON.stringify(context, null, 2)}`
        }
      ]
    })
  });

  const data = await response.json();
  return {
    response: data.choices[0]?.message?.content,
    model: data.model,
    usage: data.usage
  };
}

// Execute action node (database operations)
async function executeActionNode(node: any, triggerData: any, supabase: any) {
  const actionType = node.data?.action_type;
  const table = node.data?.table;
  const data = node.data?.data || {};

  // Merge trigger data with static data
  const mergedData = { ...data };
  for (const key in mergedData) {
    if (typeof mergedData[key] === 'string' && mergedData[key].startsWith('{{') && mergedData[key].endsWith('}}')) {
      const field = mergedData[key].slice(2, -2).trim();
      mergedData[key] = triggerData[field];
    }
  }

  switch (actionType) {
    case 'insert':
      const { data: insertResult, error: insertError } = await supabase
        .from(table)
        .insert(mergedData)
        .select();
      if (insertError) throw insertError;
      return { action: 'insert', result: insertResult };

    case 'update':
      const { data: updateResult, error: updateError } = await supabase
        .from(table)
        .update(mergedData)
        .eq(node.data?.match_field || 'id', triggerData[node.data?.match_field || 'id'])
        .select();
      if (updateError) throw updateError;
      return { action: 'update', result: updateResult };

    case 'delete':
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq(node.data?.match_field || 'id', triggerData[node.data?.match_field || 'id']);
      if (deleteError) throw deleteError;
      return { action: 'delete', success: true };

    default:
      return { action: actionType, skipped: true, reason: 'Unknown action type' };
  }
}