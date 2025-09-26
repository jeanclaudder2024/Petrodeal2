import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewRequest {
  templateId: string;
  vesselId?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { templateId, vesselId }: ReviewRequest = await req.json();

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    const placeholders = template.placeholders || [];
    const availableData: Record<string, any> = {};
    
    // Get vessel data for comparison if vesselId provided
    if (vesselId) {
      const { data: vessel } = await supabase
        .from('vessels')
        .select('*')
        .eq('id', vesselId)
        .single();
      
      if (vessel) {
        availableData.vessel = vessel;
      }
    }

    // Analyze each placeholder
    const placeholderAnalysis = placeholders.map((placeholder: any) => {
      const placeholderName = placeholder.name || placeholder;
      const availableValue = findAvailableData(availableData, placeholderName);
      
      return {
        name: placeholderName,
        hasData: !!availableValue,
        dataSource: availableValue ? getDataSource(availableData, placeholderName) : null,
        value: availableValue || null,
        willUseFallback: !availableValue,
        suggested_mapping: getSuggestedMapping(placeholderName),
        auto_fix_suggestions: getAutoFixSuggestions(placeholderName)
      };
    });

    // Calculate statistics
    const stats = {
      total_placeholders: placeholders.length,
      available_data: placeholderAnalysis.filter((p: any) => p.hasData).length,
      missing_data: placeholderAnalysis.filter((p: any) => !p.hasData).length,
      completion_rate: placeholders.length > 0 ? 
        (placeholderAnalysis.filter((p: any) => p.hasData).length / placeholders.length * 100).toFixed(1) : '0'
    };

    // Get available vessel fields for reference
    const vesselFields = vesselId && availableData.vessel ? 
      Object.keys(availableData.vessel).filter(key => availableData.vessel[key] !== null) : [];

    return new Response(JSON.stringify({
      success: true,
      template_info: {
        title: template.title,
        description: template.description,
        total_placeholders: placeholders.length
      },
      placeholder_analysis: placeholderAnalysis,
      statistics: stats,
      available_vessel_fields: vesselFields,
      recommendations: generateRecommendations(placeholderAnalysis)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Template review error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function findAvailableData(availableData: Record<string, any>, placeholderName: string): string | null {
  const normalized = placeholderName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (const [entityType, entityData] of Object.entries(availableData)) {
    if (!entityData || typeof entityData !== 'object') continue;
    
    for (const [field, value] of Object.entries(entityData)) {
      const normalizedField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (normalized === normalizedField || 
          normalized.includes(normalizedField) || 
          normalizedField.includes(normalized)) {
        return String(value || '');
      }
    }
  }
  
  return null;
}

function getDataSource(availableData: Record<string, any>, placeholderName: string): string | null {
  const normalized = placeholderName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (const [entityType, entityData] of Object.entries(availableData)) {
    if (!entityData || typeof entityData !== 'object') continue;
    
    for (const [field, value] of Object.entries(entityData)) {
      const normalizedField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (normalized === normalizedField || 
          normalized.includes(normalizedField) || 
          normalizedField.includes(normalized)) {
        return `${entityType}.${field}`;
      }
    }
  }
  
  return null;
}

function getSuggestedMapping(placeholderName: string): string[] {
  const suggestions: string[] = [];
  const normalized = placeholderName.toLowerCase();
  
  // Vessel field suggestions
  if (normalized.includes('vessel') || normalized.includes('ship')) {
    if (normalized.includes('name')) suggestions.push('vessel.name');
    if (normalized.includes('imo')) suggestions.push('vessel.imo_number');
    if (normalized.includes('mmsi')) suggestions.push('vessel.mmsi');
    if (normalized.includes('flag')) suggestions.push('vessel.flag_state');
    if (normalized.includes('type')) suggestions.push('vessel.vessel_type');
    if (normalized.includes('length')) suggestions.push('vessel.length_overall');
    if (normalized.includes('beam')) suggestions.push('vessel.beam');
    if (normalized.includes('draft')) suggestions.push('vessel.max_draft');
    if (normalized.includes('built') || normalized.includes('year')) suggestions.push('vessel.built');
  }
  
  // Date suggestions
  if (normalized.includes('date') || normalized.includes('time')) {
    suggestions.push('current.date', 'current.datetime');
  }
  
  return suggestions;
}

function getAutoFixSuggestions(placeholderName: string): string[] {
  const suggestions: string[] = [];
  const normalized = placeholderName.toLowerCase();
  
  // Common naming variations
  if (normalized.includes('vesselname')) {
    suggestions.push('Try: vessel_name, ship_name, or vessel.name');
  }
  
  if (normalized.includes('imonumber')) {
    suggestions.push('Try: imo_number, vessel_imo, or imo');
  }
  
  if (normalized.includes('flagstate')) {
    suggestions.push('Try: flag_state, vessel_flag, or flag');
  }
  
  return suggestions;
}

function generateRecommendations(analysis: any[]): string[] {
  const recommendations: string[] = [];
  
  const missingCount = analysis.filter(p => !p.hasData).length;
  const totalCount = analysis.length;
  
  if (missingCount === 0) {
    recommendations.push('✅ Perfect! All placeholders can be filled with available data.');
  } else if (missingCount < totalCount / 3) {
    recommendations.push('✅ Good mapping! Most placeholders have available data.');
    recommendations.push(`⚠️ ${missingCount} placeholders will use realistic random data.`);
  } else {
    recommendations.push('⚠️ Many placeholders will use random data.');
    recommendations.push('💡 Consider reviewing placeholder naming for better auto-mapping.');
  }
  
  // Check for common issues
  const commonIssues = analysis.filter(p => 
    !p.hasData && (
      p.name.toLowerCase().includes('vessel') ||
      p.name.toLowerCase().includes('ship') ||
      p.name.toLowerCase().includes('imo')
    )
  );
  
  if (commonIssues.length > 0) {
    recommendations.push('💡 Check vessel-related placeholder names for exact field matches.');
  }
  
  return recommendations;
}