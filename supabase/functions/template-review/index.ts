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

    const { action, template_id, review_status, review_notes, reviewer_id } = await req.json();

    if (!template_id) {
      return new Response(
        JSON.stringify({ error: 'template_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'approve': {
        const { data, error } = await supabase
          .from('document_templates')
          .update({
            review_status: 'approved',
            review_notes: review_notes || null,
            reviewed_by: reviewer_id || null,
            reviewed_at: new Date().toISOString(),
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', template_id)
          .select();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, template: data?.[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'reject': {
        const { data, error } = await supabase
          .from('document_templates')
          .update({
            review_status: 'rejected',
            review_notes: review_notes || 'Template rejected',
            reviewed_by: reviewer_id || null,
            reviewed_at: new Date().toISOString(),
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', template_id)
          .select();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, template: data?.[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'request_changes': {
        const { data, error } = await supabase
          .from('document_templates')
          .update({
            review_status: 'changes_requested',
            review_notes: review_notes || 'Changes requested',
            reviewed_by: reviewer_id || null,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', template_id)
          .select();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, template: data?.[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_status': {
        const { data, error } = await supabase
          .from('document_templates')
          .select('id, title, review_status, review_notes, reviewed_by, reviewed_at, is_active')
          .eq('id', template_id)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, template: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Use: approve, reject, request_changes, get_status` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[template-review] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
