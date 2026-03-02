import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, template_id, plan_id, plan_ids, can_download, max_downloads_per_template, broker_membership_id } = await req.json();

    if (!template_id) {
      return new Response(
        JSON.stringify({ error: 'template_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'assign_plans': {
        if (!plan_ids || !Array.isArray(plan_ids)) {
          throw new Error('plan_ids array is required');
        }

        // Remove existing associations
        await supabase
          .from('plan_template_permissions')
          .delete()
          .eq('template_id', template_id);

        // Create new associations
        const records = plan_ids.map((pid: string) => ({
          template_id,
          plan_id: pid,
          can_download: can_download !== false,
          max_downloads_per_template: max_downloads_per_template || null
        }));

        const { data, error } = await supabase
          .from('plan_template_permissions')
          .insert(records)
          .select();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, associations: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'assign_broker': {
        if (!broker_membership_id) throw new Error('broker_membership_id is required');

        const { data, error } = await supabase
          .from('broker_template_permissions')
          .upsert({
            template_id,
            broker_membership_id,
            can_download: can_download !== false,
            max_downloads_per_template: max_downloads_per_template || null
          }, { onConflict: 'template_id,broker_membership_id' })
          .select();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, association: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get': {
        const { data: planPerms } = await supabase
          .from('plan_template_permissions')
          .select('*, subscription_plans(*)')
          .eq('template_id', template_id);

        const { data: brokerPerms } = await supabase
          .from('broker_template_permissions')
          .select('*')
          .eq('template_id', template_id);

        return new Response(
          JSON.stringify({ success: true, plan_permissions: planPerms, broker_permissions: brokerPerms }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'remove_plan': {
        if (!plan_id) throw new Error('plan_id is required');
        await supabase
          .from('plan_template_permissions')
          .delete()
          .eq('template_id', template_id)
          .eq('plan_id', plan_id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Use: assign_plans, assign_broker, get, remove_plan` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[manage-template-associations] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
