import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Trigger events that can activate workflows
const TRIGGER_EVENTS = [
  'vessel_status_changed', 'vessel_eta_updated', 'vessel_arrived', 'vessel_departed',
  'order_created', 'order_updated', 'order_linked', 'order_completed',
  'company_connection_created', 'company_updated',
  'support_ticket_created', 'support_ticket_updated', 'support_escalation', 'email_received',
  'subscription_started', 'subscription_cancelled', 'payment_successful', 'payment_failed',
  'broker_approved', 'deal_created', 'deal_completed',
  'document_uploaded', 'document_processed'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { event, data } = await req.json();

    if (!event) {
      return new Response(
        JSON.stringify({ error: 'event is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!TRIGGER_EVENTS.includes(event)) {
      console.log(`[openai-agent-webhook] Unknown event: ${event}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Event not recognized, no workflows triggered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[openai-agent-webhook] Received event: ${event}`, data);

    // Find matching workflows
    const { data: workflows, error: workflowError } = await supabase
      .from('agent_workflows')
      .select('*')
      .eq('trigger_event', event)
      .eq('is_active', true);

    if (workflowError) throw workflowError;

    if (!workflows || workflows.length === 0) {
      console.log(`[openai-agent-webhook] No active workflows for event: ${event}`);
      return new Response(
        JSON.stringify({ success: true, message: 'No matching workflows found', workflows_triggered: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[openai-agent-webhook] Found ${workflows.length} matching workflow(s)`);

    // Trigger each matching workflow
    const executions = [];
    for (const workflow of workflows) {
      const { data: execution, error: execError } = await supabase
        .from('agent_executions')
        .insert({
          workflow_id: workflow.id,
          trigger_event: event,
          trigger_data: data,
          status: 'pending',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (execError) {
        console.error(`[openai-agent-webhook] Failed to create execution for workflow ${workflow.id}:`, execError);
        continue;
      }

      executions.push(execution);

      // Trigger executor asynchronously
      fetch(`${SUPABASE_URL}/functions/v1/openai-agent-executor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ execution_id: execution.id })
      }).catch(err => console.error(`[openai-agent-webhook] Failed to trigger executor:`, err));
    }

    return new Response(
      JSON.stringify({
        success: true,
        event,
        workflows_triggered: executions.length,
        executions: executions.map(e => ({ id: e.id, workflow_id: e.workflow_id }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[openai-agent-webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
