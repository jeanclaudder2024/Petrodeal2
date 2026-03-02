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

    const { action, template_id, mappings, mapping_id } = await req.json();

    if (!template_id && action !== 'get_all') {
      return new Response(
        JSON.stringify({ error: 'template_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'save': {
        if (!mappings || !Array.isArray(mappings)) {
          throw new Error('mappings array is required');
        }

        // Delete existing mappings for this template
        await supabase
          .from('template_placeholders')
          .delete()
          .eq('template_id', template_id);

        // Insert new mappings
        const records = mappings.map((m: any) => ({
          template_id,
          placeholder_name: m.placeholder_name,
          source_type: m.source_type || 'database',
          source_table: m.source_table || null,
          source_column: m.source_column || null,
          default_value: m.default_value || null,
          bucket_category: m.bucket_category || null,
          display_label: m.display_label || m.placeholder_name,
          is_required: m.is_required || false
        }));

        const { data, error } = await supabase
          .from('template_placeholders')
          .insert(records)
          .select();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, mappings: data, count: data.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get': {
        const { data, error } = await supabase
          .from('template_placeholders')
          .select('*')
          .eq('template_id', template_id)
          .order('created_at');

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, mappings: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        if (!mapping_id) throw new Error('mapping_id is required');

        const updateData: any = {};
        if (mappings && mappings[0]) {
          const m = mappings[0];
          if (m.source_type) updateData.source_type = m.source_type;
          if (m.source_table !== undefined) updateData.source_table = m.source_table;
          if (m.source_column !== undefined) updateData.source_column = m.source_column;
          if (m.default_value !== undefined) updateData.default_value = m.default_value;
          if (m.bucket_category !== undefined) updateData.bucket_category = m.bucket_category;
          if (m.display_label) updateData.display_label = m.display_label;
        }

        const { data, error } = await supabase
          .from('template_placeholders')
          .update(updateData)
          .eq('id', mapping_id)
          .select();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, mapping: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!mapping_id) throw new Error('mapping_id is required');

        await supabase
          .from('template_placeholders')
          .delete()
          .eq('id', mapping_id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Use: save, get, update, delete` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[manage-template-mappings] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
