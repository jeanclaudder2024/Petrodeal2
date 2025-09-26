import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  templateId: string;
  testWithVesselId?: number;
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

    const { templateId, testWithVesselId }: ValidationRequest = await req.json();

    console.log('Starting template validation for:', templateId);

    // Step 1: Get template details
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    const validation = {
      template_id: templateId,
      template_title: template.title,
      validation_time: new Date().toISOString(),
      steps: [] as any[],
      overall_status: 'success',
      issues: [] as string[],
      recommendations: [] as string[],
      placeholders_analysis: {},
      document_generation_test: null as any,
      final_score: 0
    };

    // Step 2: Validate template analysis
    console.log('Step 1: Validating template analysis...');
    const analysisStep = {
      step: 'template_analysis',
      status: 'success',
      details: {},
      issues: [] as string[]
    };

    if (!template.placeholders || !Array.isArray(template.placeholders)) {
      analysisStep.status = 'error';
      analysisStep.issues.push('No placeholders detected in template');
      validation.issues.push('Template analysis failed - no placeholders found');
    } else if (template.placeholders.length === 0) {
      analysisStep.status = 'warning';
      analysisStep.issues.push('Template appears to have no placeholders');
      validation.issues.push('No placeholders detected - document will not be dynamic');
    } else {
      analysisStep.details = {
        placeholders_count: template.placeholders.length,
        extraction_method: template.analysis_result?.extraction_method || 'unknown',
        confidence_score: template.mapping_confidence || 0,
        placeholders: template.placeholders
      };

      // Check extraction method quality
      if (template.analysis_result?.extraction_method === 'jszip_word_xml') {
        validation.recommendations.push('Template analysis used optimal JSZip XML extraction method');
      } else if (template.analysis_result?.extraction_method?.includes('failed')) {
        analysisStep.status = 'error';
        analysisStep.issues.push('Text extraction from Word document failed');
        validation.issues.push('Word document text extraction failed - this will prevent placeholder replacement');
      }

      // Check placeholder quality
      const validPlaceholders = template.placeholders.filter((p: string) => 
        p && p.length > 0 && /[a-zA-Z]/.test(p)
      );
      
      if (validPlaceholders.length < template.placeholders.length) {
        analysisStep.status = 'warning';
        analysisStep.issues.push(`${template.placeholders.length - validPlaceholders.length} placeholders appear to be corrupted or invalid`);
        validation.issues.push('Some detected placeholders appear to be corrupted');
      }
    }

    validation.steps.push(analysisStep);

    // Step 3: Test placeholder mapping with real data
    console.log('Step 2: Testing placeholder mapping...');
    const mappingStep = {
      step: 'placeholder_mapping',
      status: 'success',
      details: {},
      issues: [] as string[]
    };

    if (testWithVesselId) {
      // Get test vessel data
      const { data: vessel } = await supabase
        .from('vessels')
        .select('*')
        .eq('id', testWithVesselId)
        .single();

      if (vessel) {
        const dataCollection = {
          vessel: vessel,
          current: {
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString(),
            year: new Date().getFullYear().toString()
          }
        };

        let mappedCount = 0;
        let unmappedCount = 0;
        const mappingDetails = [];

        for (const placeholder of template.placeholders || []) {
          const mappedValue = findDataValue(dataCollection, placeholder);
          
          if (mappedValue && mappedValue !== '') {
            mappedCount++;
            mappingDetails.push({
              placeholder,
              mapped: true,
              value: mappedValue,
              source: 'vessel_data'
            });
          } else {
            unmappedCount++;
            mappingDetails.push({
              placeholder,
              mapped: false,
              value: null,
              source: 'will_use_random'
            });
          }
        }

        mappingStep.details = {
          vessel_used: vessel.name,
          total_placeholders: template.placeholders?.length || 0,
          mapped_from_data: mappedCount,
          will_use_random: unmappedCount,
          mapping_rate: Math.round((mappedCount / (template.placeholders?.length || 1)) * 100),
          mapping_details: mappingDetails
        };

        validation.placeholders_analysis = mappingDetails;

        if (mappedCount === 0) {
          mappingStep.status = 'error';
          mappingStep.issues.push('No placeholders could be mapped to vessel data');
          validation.issues.push('Placeholder mapping failed - no vessel data will be used');
        } else if (mappedCount < (template.placeholders?.length || 0) * 0.3) {
          mappingStep.status = 'warning';
          mappingStep.issues.push('Less than 30% of placeholders mapped to real data');
          validation.issues.push('Low data mapping rate - document will rely heavily on random data');
        }
      }
    } else {
      mappingStep.status = 'skipped';
      mappingStep.details = { reason: 'No test vessel ID provided' };
      validation.recommendations.push('Provide a test vessel ID to validate placeholder mapping');
    }

    validation.steps.push(mappingStep);

    // Step 4: Test document generation
    console.log('Step 3: Testing document generation...');
    const generationStep = {
      step: 'document_generation',
      status: 'success',
      details: {},
      issues: [] as string[]
    };

    if (testWithVesselId) {
      try {
        const { data: generationResult, error: generationError } = await supabase.functions.invoke('enhanced-document-processor', {
          body: {
            templateId: templateId,
            vesselId: testWithVesselId,
            format: 'docx'
          }
        });

        if (generationError) throw generationError;

        if (generationResult.success) {
          generationStep.details = {
            success: true,
            processing_stats: generationResult.processing_stats,
            document_url: generationResult.docx_url
          };

          validation.document_generation_test = generationResult.processing_stats;

          if (generationResult.processing_stats.filled_from_data === 0) {
            generationStep.status = 'warning';
            generationStep.issues.push('No placeholders were filled with real data');
            validation.issues.push('Document generation succeeded but used no real vessel data');
          }
        } else {
          throw new Error(generationResult.error || 'Generation failed');
        }
      } catch (error) {
        generationStep.status = 'error';
        generationStep.issues.push(`Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        validation.issues.push('Document generation test failed');
        validation.overall_status = 'error';
      }
    } else {
      generationStep.status = 'skipped';
      generationStep.details = { reason: 'No test vessel ID provided' };
    }

    validation.steps.push(generationStep);

    // Calculate final score
    let score = 100;
    
    // Deduct points for issues
    const errorSteps = validation.steps.filter(s => s.status === 'error');
    const warningSteps = validation.steps.filter(s => s.status === 'warning');
    
    score -= errorSteps.length * 40; // Heavy penalty for errors
    score -= warningSteps.length * 15; // Moderate penalty for warnings
    
    // Bonus for good mapping rate
    const mappingDetails = mappingStep.details as any;
    if (mappingDetails.mapping_rate && mappingDetails.mapping_rate >= 70) {
      score += 10;
    }
    
    validation.final_score = Math.max(0, score);

    // Set overall status
    if (errorSteps.length > 0) {
      validation.overall_status = 'error';
    } else if (warningSteps.length > 0) {
      validation.overall_status = 'warning';
    }

    // Generate recommendations
    if (validation.final_score >= 80) {
      validation.recommendations.push('Template is working well and ready for production use');
    } else if (validation.final_score >= 60) {
      validation.recommendations.push('Template works but has some issues that should be addressed');
    } else {
      validation.recommendations.push('Template has significant issues and should be fixed before use');
    }

    if (template.analysis_result?.extraction_method !== 'jszip_word_xml') {
      validation.recommendations.push('Consider re-uploading the template to use improved text extraction');
    }

    console.log('Template validation completed:', validation.overall_status);

    return new Response(JSON.stringify({
      success: true,
      validation: validation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Template validation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to find data value (same as in enhanced-document-processor)
function findDataValue(dataCollection: Record<string, any>, placeholderName: string): string {
  if (!placeholderName) return '';
  
  const normalized = placeholderName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Enhanced field mappings for common maritime placeholders
  const fieldMappings: Record<string, string[]> = {
    'vesselname': ['name', 'vessel_name'],
    'shipname': ['name', 'vessel_name'],
    'name': ['name', 'vessel_name'],
    'imonumber': ['imo'],
    'imo': ['imo'],
    'mmsi': ['mmsi'],
    'callsign': ['callsign'],
    'flagstate': ['flag', 'flag_country', 'flag_state'],
    'flag': ['flag', 'flag_country', 'flag_state'],
    'built': ['built', 'year_built'],
    'yearbuilt': ['built', 'year_built'],
    'deadweight': ['deadweight', 'dwt'],
    'dwt': ['deadweight', 'dwt'],
    'length': ['length', 'loa'],
    'beam': ['beam', 'width'],
    'draft': ['draft', 'draught'],
    'draught': ['draft', 'draught'],
    'speed': ['speed', 'max_speed'],
    'vesseltype': ['vessel_type', 'type'],
    'type': ['vessel_type', 'type'],
    'owner': ['owner_name', 'owner'],
    'ownername': ['owner_name', 'owner'],
    'operator': ['operator_name', 'operator'],
    'operatorname': ['operator_name', 'operator'],
    'currentdate': ['date'],
    'currenttime': ['time'],
    'currentyear': ['year'],
  };

  // Check direct mappings first
  const mappedFields = fieldMappings[normalized] || [];
  for (const [entityType, entityData] of Object.entries(dataCollection)) {
    if (!entityData || typeof entityData !== 'object') continue;
    
    for (const mappedField of mappedFields) {
      if (entityData[mappedField] != null && entityData[mappedField] !== '') {
        return String(entityData[mappedField]);
      }
    }
  }
  
  // Enhanced fuzzy matching
  let bestMatch = { field: '', value: '', score: 0 };
  
  for (const [entityType, entityData] of Object.entries(dataCollection)) {
    if (!entityData || typeof entityData !== 'object') continue;
    
    for (const [field, value] of Object.entries(entityData)) {
      if (value == null || value === '') continue;
      
      const normalizedField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
      let score = 0;
      
      if (normalized === normalizedField) {
        score = 100;
      } else if (normalized.length > 3 && normalizedField.length > 3) {
        if (normalizedField.includes(normalized)) {
          score = 70;
        } else if (normalized.includes(normalizedField)) {
          score = 60;
        }
      }
      
      if (score > bestMatch.score) {
        bestMatch = { field, value: String(value), score };
      }
    }
  }
  
  if (bestMatch.score >= 60) {
    return bestMatch.value;
  }
  
  return '';
}