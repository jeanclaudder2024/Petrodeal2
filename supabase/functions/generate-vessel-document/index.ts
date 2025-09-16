import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@^1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateDocumentRequest {
  documentId: string;
  vesselId: number;
  vesselData: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== GENERATE-VESSEL-DOCUMENT FUNCTION STARTED ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Supabase client initialized');

    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { documentId, vesselId, vesselData }: GenerateDocumentRequest = requestBody;

    console.log('Extracted parameters:', {
      documentId,
      vesselId,
      hasVesselData: !!vesselData
    });

    // Use provided vessel data directly - avoid complex database queries that might fail
    const enhancedVesselData = {
      ...vesselData,
      // Add some fallback values for missing fields
      length: vesselData.length || 250,
      beam: vesselData.beam || vesselData.width || 45,
      draught: vesselData.draught || vesselData.draft || 15,
      gross_tonnage: vesselData.gross_tonnage || 85000,
      engine_power: vesselData.engine_power || 15000,
      fuel_consumption: vesselData.fuel_consumption || 50,
      crew_size: vesselData.crew_size || 25,
      callsign: vesselData.callsign || 'AUTO',
      course: vesselData.course || vesselData.metadata?.course || 0,
      nav_status: vesselData.nav_status || vesselData.metadata?.navStatus || 'underway'
    };

    console.log('Using enhanced vessel data with fallbacks');

    if (!documentId || !vesselId || !vesselData) {
      throw new Error('Missing required parameters');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log('Generating document for user:', user.id, 'documentId:', documentId, 'vesselId:', vesselId);

    // Validate OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get the document template
    const { data: document, error: docError } = await supabaseClient
      .from('vessel_documents')
      .select('*')
      .eq('id', documentId)
      .eq('is_active', true)
      .single();

    if (docError || !document) {
      throw new Error('Document template not found or inactive');
    }

    // Check for vessel-specific custom prompt
    const { data: customPrompt } = await supabaseClient
      .from('vessel_document_prompts')
      .select('custom_prompt')
      .eq('vessel_id', vesselId)
      .eq('document_id', documentId)
      .single();

    // Use custom prompt if available, otherwise use default
    const finalPrompt = customPrompt?.custom_prompt || document.ai_prompt;
    
    if (!finalPrompt) {
      throw new Error('Document template has no AI prompt configured');
    }

    console.log('Document template loaded:', {
      title: document.title,
      subscription_level: document.subscription_level,
      broker_membership_required: document.broker_membership_required,
      hasCustomPrompt: !!customPrompt?.custom_prompt,
      promptSource: customPrompt?.custom_prompt ? 'vessel-specific' : 'default-template'
    });

    // Check broker membership if required
    if (document.broker_membership_required) {
      const { data: brokerMembership, error: brokerError } = await supabaseClient
        .from('broker_memberships')
        .select('membership_status, payment_status')
        .eq('user_id', user.id)
        .eq('membership_status', 'active')
        .eq('payment_status', 'completed')
        .single();

      if (brokerError || !brokerMembership) {
        console.log('Broker membership check failed:', brokerError);
        throw new Error('Active broker membership required for this document');
      }
    }

    // Check user subscription access
    const { data: subscription } = await supabaseClient
      .from('subscribers')
      .select('subscription_tier, subscribed')
      .eq('user_id', user.id)
      .single();

    const canAccess = checkDocumentAccess(document.subscription_level, subscription);
    if (!canAccess) {
      throw new Error('Insufficient subscription level for this document');
    }

    // Log the generation attempt
    const { data: logEntry } = await supabaseClient
      .from('document_generation_logs')
      .insert({
        user_id: user.id,
        document_id: documentId,
        vessel_id: vesselId,
        status: 'pending'
      })
      .select()
      .single();

    try {
      // Prepare vessel data for AI prompt with enhanced data
      const vesselDataString = formatVesselDataForAI(enhancedVesselData);
      
      // Validate the AI prompt exists and is not corrupted
      if (!finalPrompt || finalPrompt.trim().length === 0) {
        throw new Error('Document template has no AI prompt configured');
      }

      // Check for corrupted prompt data
      if (finalPrompt.length < 10 || !/[a-zA-Z\s]/.test(finalPrompt)) {
        console.error('Corrupted AI prompt detected:', finalPrompt);
        throw new Error('Document template has corrupted AI prompt. Please update the template in admin panel.');
      }

      console.log('Original AI prompt from database:', finalPrompt);
      console.log('AI prompt length:', finalPrompt.length);
      console.log('Prompt source:', customPrompt?.custom_prompt ? 'Custom vessel-specific prompt' : 'Default document template');
      
      // Process the document prompt and replace vessel data placeholders
      let processedPrompt = finalPrompt;
      
      // Replace all vessel data placeholders with actual data
      processedPrompt = processedPrompt.replace(/\{vessel_data\}/g, vesselDataString);
      processedPrompt = processedPrompt.replace(/\{vessel_name\}/g, enhancedVesselData.name || 'Unknown Vessel');
      processedPrompt = processedPrompt.replace(/\{vessel_type\}/g, enhancedVesselData.vessel_type || 'Oil Tanker');
      processedPrompt = processedPrompt.replace(/\{mmsi\}/g, enhancedVesselData.mmsi || 'N/A');
      processedPrompt = processedPrompt.replace(/\{imo\}/g, enhancedVesselData.imo || 'N/A');
      processedPrompt = processedPrompt.replace(/\{flag\}/g, enhancedVesselData.flag_country || enhancedVesselData.flag || 'N/A');
      processedPrompt = processedPrompt.replace(/\{deadweight\}/g, enhancedVesselData.deadweight || 'N/A');
      processedPrompt = processedPrompt.replace(/\{cargo_capacity\}/g, enhancedVesselData.cargo_capacity || 'N/A');
      processedPrompt = processedPrompt.replace(/\{built_year\}/g, enhancedVesselData.built || 'N/A');
      processedPrompt = processedPrompt.replace(/\{current_position\}/g, `${enhancedVesselData.current_lat || 'N/A'}, ${enhancedVesselData.current_lng || 'N/A'}`);
      processedPrompt = processedPrompt.replace(/\{speed\}/g, enhancedVesselData.speed || 'N/A');
      processedPrompt = processedPrompt.replace(/\{status\}/g, enhancedVesselData.status || 'N/A');
      
      // Additional placeholders for common document fields
      processedPrompt = processedPrompt.replace(/\{deal_data\}/g, vesselDataString);
      processedPrompt = processedPrompt.replace(/\{buyer_name\}/g, enhancedVesselData.buyer_name || '[BUYER NAME TO BE GENERATED]');
      processedPrompt = processedPrompt.replace(/\{seller_name\}/g, enhancedVesselData.seller_name || '[SELLER NAME TO BE GENERATED]');
      processedPrompt = processedPrompt.replace(/\{cargo_type\}/g, enhancedVesselData.cargo_type || enhancedVesselData.oil_type || '[CARGO TYPE TO BE GENERATED]');
      processedPrompt = processedPrompt.replace(/\{quantity\}/g, enhancedVesselData.cargo_quantity || enhancedVesselData.quantity || '[QUANTITY TO BE GENERATED]');
      processedPrompt = processedPrompt.replace(/\{loading_port\}/g, enhancedVesselData.loading_port_name || enhancedVesselData.departure_port_name || '[LOADING PORT TO BE GENERATED]');
      processedPrompt = processedPrompt.replace(/\{discharge_port\}/g, enhancedVesselData.destination_port_name || '[DISCHARGE PORT TO BE GENERATED]');
      processedPrompt = processedPrompt.replace(/\{deal_value\}/g, enhancedVesselData.deal_value || enhancedVesselData.dealvalue || '[DEAL VALUE TO BE GENERATED]');
      processedPrompt = processedPrompt.replace(/\{price\}/g, enhancedVesselData.price || enhancedVesselData.market_price || '[PRICE TO BE GENERATED]');
      processedPrompt = processedPrompt.replace(/\{duration\}/g, '[CONTRACT DURATION TO BE GENERATED]');
      processedPrompt = processedPrompt.replace(/\{timestamp\}/g, Date.now().toString());

      console.log('Processed prompt with vessel data:', processedPrompt.substring(0, 300) + '...');
      console.log('Processed prompt length:', processedPrompt.length);

      // Validate processed prompt before sending to OpenAI
      if (!processedPrompt || processedPrompt.trim().length < 50) {
        throw new Error('Processed prompt is too short or empty');
      }

      console.log('Calling OpenAI with processed prompt (first 200 chars):', processedPrompt.substring(0, 200) + '...');

      // Call OpenAI to generate document content
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional maritime document generator. Follow the user's EXACT instructions and document template requirements.

CRITICAL INSTRUCTIONS:
- Follow the EXACT document format and requirements specified in the user prompt
- Use the provided vessel data to fill in ALL details throughout the document
- Generate realistic professional values for any missing data based on vessel type
- Maintain proper maritime terminology and official document formatting
- Create a complete, detailed document as specified in the prompt`
            },
            {
              role: 'user',
              content: `VESSEL DATA TO USE:
${vesselDataString}

DOCUMENT REQUIREMENTS (FOLLOW EXACTLY):
${processedPrompt}

IMPORTANT: Use all the vessel data provided above to create the exact document format requested. Fill in every detail using the vessel information provided.`
            }
          ],
          max_tokens: 4000,
          temperature: 0.3
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API error (${openaiResponse.status}): ${errorText}`);
      }

      const aiResult = await openaiResponse.json();
      
      if (!openaiResponse.ok) {
        console.error('OpenAI API error response:', aiResult);
        throw new Error(`OpenAI API error (${openaiResponse.status}): ${aiResult.error?.message || 'Unknown OpenAI error'}`);
      }
      
      if (!aiResult.choices || !aiResult.choices[0] || !aiResult.choices[0].message) {
        console.error('Invalid OpenAI response structure:', aiResult);
        throw new Error('Invalid response structure from OpenAI');
      }
      
      const documentContent = aiResult.choices[0].message.content;

      console.log('Generated document content length:', documentContent.length);

      // Check for empty content
      if (!documentContent || documentContent.trim().length === 0) {
        throw new Error('Generated document content is empty');
      }

      // Check if user already has this document generated for this vessel
      const { data: existingDocument } = await supabaseClient
        .from('user_document_storage')
        .select('id')
        .eq('user_id', user.id)
        .eq('document_id', documentId)
        .eq('vessel_id', vesselId)
        .single();

      if (existingDocument) {
        return new Response(
          JSON.stringify({
            error: 'Document already generated and stored in your storage. Please check your document storage section to view or download.',
            alreadyExists: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409
          }
        );
      }

      // Generate PDF with enhanced data and custom template if available
      const pdfBase64 = await generatePDF(
        documentContent, 
        document.title, 
        enhancedVesselData.name, 
        enhancedVesselData,
        document.template_file_url,
        supabaseClient
      );

      // Convert base64 to bytes for storage
      const pdfBytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
      const fileName = `${user.id}/${vesselId}/${documentId}_${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_${enhancedVesselData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;

      // Store PDF in Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('user-documents')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading PDF to storage:', uploadError);
        throw new Error('Failed to store document in storage');
      }

      console.log('Document uploaded to storage:', uploadData.path);

      // Get the public URL for the stored document
      const { data: { publicUrl } } = supabaseClient.storage
        .from('user-documents')
        .getPublicUrl(uploadData.path);

      // Save document info to user_document_storage table
      const { error: storageError } = await supabaseClient
        .from('user_document_storage')
        .insert({
          user_id: user.id,
          document_id: documentId,
          vessel_id: vesselId,
          document_title: document.title,
          vessel_name: enhancedVesselData.name,
          file_url: publicUrl,
          file_size: pdfBytes.length
        });

      if (storageError) {
        console.error('Error saving document storage record:', storageError);
        // Clean up uploaded file
        await supabaseClient.storage
          .from('user-documents')
          .remove([uploadData.path]);
        throw new Error('Failed to save document storage record');
      }

      // Update log with success
      await supabaseClient
        .from('document_generation_logs')
        .update({
          status: 'completed',
          file_size: pdfBytes.length
        })
        .eq('id', logEntry.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Document generated and stored successfully! Check your document storage to view or download.',
          documentTitle: document.title,
          stored: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (error) {
      console.error('Error generating document:', error);
      
      // Update log with error and more details
      if (logEntry) {
        await supabaseClient
          .from('document_generation_logs')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error'
          })
          .eq('id', logEntry.id);
      }

      // Re-throw with more context
      throw new Error(`Document generation failed: ${error.message || 'Unknown error'}`);
    }

    } catch (error) {
      console.error('=== CRITICAL ERROR IN GENERATE-VESSEL-DOCUMENT ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message || 'Unknown error');
      console.error('Error name:', error?.name);
      console.error('Full error object:', error);
      console.error('Error stack:', error?.stack);
      
      // Enhanced error response with more debugging info
      const errorResponse = {
        error: error?.message || 'Unknown error occurred',
        details: {
          timestamp: new Date().toISOString(),
          function: 'generate-vessel-document',
          errorType: error?.constructor?.name || 'UnknownError',
          stage: 'document-generation',
          hasDocumentId: !!requestBody?.documentId,
          hasVesselId: !!requestBody?.vesselId,
          hasVesselData: !!requestBody?.vesselData
        },
        troubleshooting: {
          message: 'Check admin panel for corrupted document templates',
          checkPrompts: 'Verify AI prompts are not empty or corrupted in document management'
        }
      };
      
      console.error('Sending detailed error response:', JSON.stringify(errorResponse, null, 2));
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 422, // Changed from 500 to 422 to be more specific
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
  }
});

function checkDocumentAccess(docLevel: string, subscription: any): boolean {
  if (docLevel === 'basic') return true;
  if (!subscription?.subscribed) return false;
  
  if (docLevel === 'premium') {
    return ['premium', 'enterprise'].includes(subscription.subscription_tier);
  }
  
  if (docLevel === 'enterprise') {
    return subscription.subscription_tier === 'enterprise';
  }
  
  return false;
}

function formatVesselDataForAI(vesselData: any): string {
  console.log('Formatting vessel data for AI:', JSON.stringify(vesselData, null, 2));
  
  // Smart value formatter that provides context for AI generation
  const formatValue = (value: any, context?: string) => {
    if (value && value !== 'N/A' && value !== null && value !== undefined && value !== '' && value !== 0) {
      return value;
    }
    return `[MISSING - Generate realistic ${context || 'value'} for ${vesselData.vessel_type || 'oil tanker'} vessel]`;
  };
  
  const formattedData = `
VESSEL IDENTIFICATION:
- Vessel Name: ${vesselData.name || '[VESSEL NAME REQUIRED]'}
- MMSI: ${formatValue(vesselData.mmsi, '9-digit MMSI')}
- IMO Number: ${formatValue(vesselData.imo, '7-digit IMO number')}
- Vessel Type: ${vesselData.vessel_type || 'Oil Tanker'}
- Flag State: ${formatValue(vesselData.flag_country || vesselData.flag, 'flag state')}
- Year Built: ${formatValue(vesselData.built, 'build year')}
- Call Sign: ${formatValue(vesselData.callsign, 'international call sign')}

TECHNICAL SPECIFICATIONS:
- Deadweight Tonnage: ${formatValue(vesselData.deadweight, 'deadweight tonnage')} DWT
- Gross Tonnage: ${formatValue(vesselData.gross_tonnage, 'gross tonnage')} GT
- Length Overall: ${formatValue(vesselData.length, 'vessel length')} meters
- Beam (Width): ${formatValue(vesselData.beam || vesselData.width, 'beam width')} meters
- Maximum Draught: ${formatValue(vesselData.draught || vesselData.draft, 'maximum draught')} meters
- Cargo Capacity: ${formatValue(vesselData.cargo_capacity, 'cargo capacity')} barrels
- Main Engine Power: ${formatValue(vesselData.engine_power, 'main engine power')} kW
- Crew Complement: ${formatValue(vesselData.crew_size, 'crew size')} persons
- Daily Fuel Consumption: ${formatValue(vesselData.fuel_consumption, 'fuel consumption')} MT/day

CURRENT OPERATIONAL STATUS:
- Vessel Status: ${formatValue(vesselData.status, 'operational status')}
- Current Position: ${formatValue(vesselData.current_lat, 'latitude')}°, ${formatValue(vesselData.current_lng, 'longitude')}°
- Current Speed: ${formatValue(vesselData.speed, 'speed through water')} knots
- Course Over Ground: ${formatValue(vesselData.course, 'course')}°
- Navigation Status: ${formatValue(vesselData.nav_status, 'AIS navigation status')}
- Operating Region: ${formatValue(vesselData.current_region, 'current operating region')}

CARGO & COMMERCIAL DETAILS:
- Cargo Type: ${formatValue(vesselData.cargo_type)}
- Oil Type: ${formatValue(vesselData.oil_type, 'petroleum product type')}
- Oil Source: ${formatValue(vesselData.oil_source, 'cargo origin')}
- Cargo Quantity: ${formatValue(vesselData.cargo_quantity || vesselData.quantity, 'cargo quantity')} barrels
- Shipping Type: ${formatValue(vesselData.shipping_type, 'charter type')}
- Deal Value: $${formatValue(vesselData.deal_value, 'total cargo value')}
- Price: $${formatValue(vesselData.price, 'price per barrel')}
- Market Price: $${formatValue(vesselData.market_price, 'current market price')}

VOYAGE INFORMATION:
- Departure Port: ${formatValue(vesselData.departure_port_name, 'loading port name')}
- Loading Port: ${formatValue(vesselData.loading_port_name, 'loading terminal')}
- Destination Port: ${formatValue(vesselData.destination_port_name, 'discharge port name')}
- Departure Date: ${formatValue(vesselData.departure_date, 'sailing date')}
- Arrival Date: ${formatValue(vesselData.arrival_date, 'expected arrival')}
- ETA: ${formatValue(vesselData.eta, 'estimated time of arrival')}
- Route Distance: ${formatValue(vesselData.route_distance, 'voyage distance')} nm

COMMERCIAL PARTIES:
- Owner: ${formatValue(vesselData.owner_name, 'registered owner')}
- Operator: ${formatValue(vesselData.operator_name, 'commercial operator')}
- Buyer: ${formatValue(vesselData.buyer_name, 'cargo buyer')}
- Seller: ${formatValue(vesselData.seller_name, 'cargo seller')}
- Source Company: ${formatValue(vesselData.source_company, 'supply company')}
- Target Refinery: ${formatValue(vesselData.target_refinery, 'destination refinery')}
- Company: ${formatValue(vesselData.company_name, 'associated company')}

ADDITIONAL VESSEL INFORMATION:
- Route Details: ${formatValue(vesselData.route_info, 'voyage routing information')}
- Data Last Updated: ${formatValue(vesselData.last_updated, 'last update timestamp')}
- Company Association: ${formatValue(vesselData.company_id, 'associated company ID')}
`;

  console.log('Generated vessel data string for AI:', formattedData);
  return formattedData;
}

async function generatePDF(
  content: string, 
  title: string, 
  vesselName: string, 
  vesselData?: any, 
  templateFileUrl?: string,
  supabaseClient?: any
): Promise<string> {
  try {
    console.log('Generating PDF for:', title, 'vessel:', vesselName);
    
    let pdfDoc;
    let page;
    let width;
    let height;

    // Check if custom template is provided
    if (templateFileUrl && supabaseClient) {
      console.log('Attempting to use custom PDF template:', templateFileUrl);
      
      try {
        // The template file URL is stored as just the file path from upload
        const filePath = templateFileUrl;
        console.log('Using template file path:', filePath);
        
        // Download the template from Supabase storage
        const { data: templateData, error: downloadError } = await supabaseClient.storage
          .from('document-templates')
          .download(filePath);
          
        if (downloadError) {
          console.error('Template download error:', downloadError);
          console.log('Falling back to default template due to download error');
          throw new Error(`Template download failed: ${downloadError.message}`);
        }

        if (!templateData) {
          console.log('No template data received, falling back to default');
          throw new Error('Template download returned null data');
        }

        console.log('Template downloaded successfully, size:', templateData.size, 'bytes');

        // Load the existing PDF template
        const templateBytes = await templateData.arrayBuffer();
        console.log('Template loaded, size:', templateBytes.byteLength, 'bytes');
        
        pdfDoc = await PDFDocument.load(templateBytes);
        
        // Get the first page of the template (or add a page if none exist)
        let pages = pdfDoc.getPages();
        if (pages.length === 0) {
          page = pdfDoc.addPage([612, 792]);
          console.log('Template PDF had no pages, created default page');
        } else {
          page = pages[0];
          console.log('Using first page of template PDF, total pages:', pages.length);
        }
        
        const dimensions = page.getSize();
        width = dimensions.width;
        height = dimensions.height;
        
        console.log('Custom PDF template loaded successfully - dimensions:', width, 'x', height);
        
      } catch (templateError) {
        console.error('TEMPLATE ERROR - Full error object:', templateError);
        console.error('Template error message:', templateError.message);
        console.error('Template error stack:', templateError.stack);
        
        // Fall back to default template
        console.log('Falling back to default template due to error');
        pdfDoc = await PDFDocument.create();
        page = pdfDoc.addPage([612, 792]);
        const dimensions = page.getSize();
        width = dimensions.width;
        height = dimensions.height;
        await createBackgroundTemplate(page, width, height);
        console.log('Default background template created successfully');
      }
    } else {
      // Use default template
      console.log('Using default PDF template');
      pdfDoc = await PDFDocument.create();
      page = pdfDoc.addPage([612, 792]);
      const dimensions = page.getSize();
      width = dimensions.width;
      height = dimensions.height;
      await createBackgroundTemplate(page, width, height);
    }
    
    // Embed fonts
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Document setup - adjusted for template
    const leftMargin = 80;
    const rightMargin = 80;
    const topMargin = 150; // More space if using template header
    const bottomMargin = 100;
    const usableWidth = width - leftMargin - rightMargin;
    
    // Generate document details
    const certificateNumber = Math.floor(10000 + Math.random() * 90000).toString();
    const issueDate = new Date().toLocaleDateString('en-GB');
    const documentRef = `SGS-${certificateNumber}-${new Date().getFullYear()}`;
    
    let yPosition = height - topMargin;
    
    // Add document title and info on top of template
    page.drawText(title.toUpperCase(), {
      x: leftMargin,
      y: yPosition,
      size: 16,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    yPosition -= 30;
    // Document info in top section
    page.drawText(`Certificate No: ${certificateNumber}`, {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    page.drawText(`Date: ${issueDate}`, {
      x: width - rightMargin - 100,
      y: yPosition,
      size: 11,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    yPosition -= 40;
    
    // Vessel Information Section
    page.drawText('VESSEL DETAILS', {
      x: leftMargin,
      y: yPosition,
      size: 13,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    yPosition -= 20;
    
    // Vessel details from provided data - ensure all values are strings
    const vesselInfo = [
      ['Vessel Name:', String(vesselData?.name || vesselName || 'N/A')],
      ['IMO Number:', String(vesselData?.imo || 'N/A')],
      ['MMSI:', String(vesselData?.mmsi || 'N/A')],
      ['Flag:', String(vesselData?.flag_country || vesselData?.flag || 'N/A')],
      ['Built:', String(vesselData?.built || 'N/A')],
      ['Deadweight:', String((vesselData?.deadweight || 'N/A') + ' MT')],
      ['Cargo Type:', String(vesselData?.cargo_type || 'N/A')],
      ['Loading Port:', String(vesselData?.loading_port_name || vesselData?.loading_port || 'N/A')],
      ['Destination:', String(vesselData?.destination_port_name || 'N/A')]
    ];
    
    // Create two columns for vessel data
    const colWidth = usableWidth / 2;
    let leftColY = yPosition;
    let rightColY = yPosition;
    
    for (let i = 0; i < vesselInfo.length; i++) {
      const [label, value] = vesselInfo[i];
      const isLeftCol = i % 2 === 0;
      const xPos = isLeftCol ? leftMargin : leftMargin + colWidth;
      const currentY = isLeftCol ? leftColY : rightColY;
      
      // Draw label and value
      page.drawText(String(label), {
        x: xPos,
        y: currentY,
        size: 10,
        font: helveticaBold,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText(String(value), {
        x: xPos + 120,
        y: currentY,
        size: 10,
        font: timesRoman,
        color: rgb(0.1, 0.1, 0.1),
      });
      
      // Update Y position for next row
      if (isLeftCol) {
        leftColY -= 16;
      } else {
        rightColY -= 16;
      }
    }
    
    yPosition = Math.min(leftColY, rightColY) - 20;
    
    yPosition -= 30;
    
    // Certificate statement
    const certStatement = `This certificate confirms that the vessel ${vesselName} has been inspected and meets international maritime standards. All documentation and safety equipment have been verified as compliant.`;
    
    page.drawText('CERTIFICATION STATEMENT', {
      x: leftMargin,
      y: yPosition,
      size: 14,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    yPosition -= 25;
    
    // Word wrap the statement
    const words = certStatement.split(' ');
    let line = '';
    
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      if (testLine.length * 6 > usableWidth) {
        page.drawText(line, {
          x: leftMargin,
          y: yPosition,
          size: 11,
          font: timesRoman,
          color: rgb(0.2, 0.2, 0.2),
        });
        line = word;
        yPosition -= 16;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: timesRoman,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    
    // Footer
    const footerY = bottomMargin;
    page.drawText(`Document Reference: ${documentRef}`, {
      x: leftMargin,
      y: footerY,
      size: 9,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    page.drawText('SGS Maritime Services', {
      x: width - rightMargin - 120,
      y: footerY,
      size: 9,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.8),
    });
    
    // Generate PDF
    const pdfBytes = await pdfDoc.save();
    
    // Convert to base64 safely (avoid stack overflow for large PDFs)
    const uint8Array = new Uint8Array(pdfBytes);
    let binaryString = '';
    const chunkSize = 8192; // Process in chunks to avoid stack overflow
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64String = btoa(binaryString);
    
    console.log('PDF generation completed, bytes length:', pdfBytes.length, 'base64 length:', base64String.length);
    return base64String;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

// Function to create professional background template with decorative SVG borders
async function createBackgroundTemplate(page: any, width: number, height: number) {
  try {
    // Professional maritime document background design with decorative borders
    
    // Main outer border frame (thicker, professional)
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: rgb(0.17, 0.32, 0.51), // #2c5282
      borderWidth: 3,
    });
    
    // Inner decorative dashed border
    for (let i = 30; i < width - 30; i += 10) {
      page.drawLine({
        start: { x: i, y: 30 },
        end: { x: i + 5, y: 30 },
        color: rgb(0.17, 0.32, 0.51),
        thickness: 1,
      });
      page.drawLine({
        start: { x: i, y: height - 30 },
        end: { x: i + 5, y: height - 30 },
        color: rgb(0.17, 0.32, 0.51),
        thickness: 1,
      });
    }
    
    for (let i = 30; i < height - 30; i += 10) {
      page.drawLine({
        start: { x: 30, y: i },
        end: { x: 30, y: i + 5 },
        color: rgb(0.17, 0.32, 0.51),
        thickness: 1,
      });
      page.drawLine({
        start: { x: width - 30, y: i },
        end: { x: width - 30, y: i + 5 },
        color: rgb(0.17, 0.32, 0.51),
        thickness: 1,
      });
    }
    
    // Corner decorative squares
    // Top left corner
    page.drawRectangle({
      x: 40,
      y: height - 60,
      width: 20,
      height: 20,
      borderColor: rgb(0.17, 0.32, 0.51),
      borderWidth: 2,
    });
    
    // Top right corner
    page.drawRectangle({
      x: width - 60,
      y: height - 60,
      width: 20,
      height: 20,
      borderColor: rgb(0.17, 0.32, 0.51),
      borderWidth: 2,
    });
    
    // Bottom left corner
    page.drawRectangle({
      x: 40,
      y: 40,
      width: 20,
      height: 20,
      borderColor: rgb(0.17, 0.32, 0.51),
      borderWidth: 2,
    });
    
    // Bottom right corner
    page.drawRectangle({
      x: width - 60,
      y: 40,
      width: 20,
      height: 20,
      borderColor: rgb(0.17, 0.32, 0.51),
      borderWidth: 2,
    });
    
    // Large watermark text "PETRO DEAL HUB" rotated in center
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create watermark effect with large, rotated text
    page.drawText('PETRO DEAL HUB', {
      x: centerX - 120,
      y: centerY - 20,
      size: 48,
      font: await page.doc.embedFont(StandardFonts.HelveticaBold),
      color: rgb(0.89, 0.91, 0.94), // Very light gray #e2e8f0
      opacity: 0.3,
      rotate: {
        type: 'degrees',
        angle: -45
      }
    });
    
    // Header section with light background
    page.drawRectangle({
      x: 50,
      y: height - 140,
      width: width - 100,
      height: 90,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: rgb(0.17, 0.32, 0.51),
      borderWidth: 1,
    });
    
    // Subtle decorative elements - maritime themed
    // Add some nautical design elements
    
    // Navigation compass rose outline (very subtle)
    const compassSize = 30;
    const compassX = width - 100;
    const compassY = 100;
    
    // Draw compass rose with 8 points
    for (let angle = 0; angle < 360; angle += 45) {
      const radians = (angle * Math.PI) / 180;
      const endX = compassX + Math.cos(radians) * compassSize;
      const endY = compassY + Math.sin(radians) * compassSize;
      
      page.drawLine({
        start: { x: compassX, y: compassY },
        end: { x: endX, y: endY },
        color: rgb(0.95, 0.96, 0.98),
        thickness: 0.5,
      });
    }
    
    // Add subtle grid pattern in background
    const gridSpacing = 40;
    const gridColor = rgb(0.98, 0.99, 0.99);
    
    // Vertical grid lines
    for (let x = 80; x < width - 80; x += gridSpacing) {
      page.drawLine({
        start: { x, y: 60 },
        end: { x, y: height - 160 },
        color: gridColor,
        thickness: 0.2,
      });
    }
    
    // Horizontal grid lines  
    for (let y = 80; y < height - 160; y += gridSpacing) {
      page.drawLine({
        start: { x: 80, y },
        end: { x: width - 80, y },
        color: gridColor,
        thickness: 0.2,
      });
    }
    
    // Footer line
    page.drawLine({
      start: { x: 50, y: 80 },
      end: { x: width - 50, y: 80 },
      color: rgb(0.17, 0.32, 0.51),
      thickness: 1,
    });
    
    console.log('Background template created successfully');
    
  } catch (error) {
    console.error('Error creating background template:', error);
    // Continue without background if there's an error
  }
}

// Helper function to draw corner decorations
function drawCornerDecoration(page: any, x: number, y: number, corner: string) {
  const size = 20;
  const color = rgb(0.3, 0.4, 0.6);
  
  switch (corner) {
    case 'tl': // Top left
      page.drawLine({
        start: { x: x - size, y },
        end: { x: x + size, y },
        color,
        thickness: 2,
      });
      page.drawLine({
        start: { x, y: y - size },
        end: { x, y: y + size },
        color,
        thickness: 2,
      });
      break;
      
    case 'tr': // Top right
      page.drawLine({
        start: { x: x - size, y },
        end: { x: x + size, y },
        color,
        thickness: 2,
      });
      page.drawLine({
        start: { x, y: y - size },
        end: { x, y: y + size },
        color,
        thickness: 2,
      });
      break;
      
    case 'bl': // Bottom left
      page.drawLine({
        start: { x: x - size, y },
        end: { x: x + size, y },
        color,
        thickness: 2,
      });
      page.drawLine({
        start: { x, y: y - size },
        end: { x, y: y + size },
        color,
        thickness: 2,
      });
      break;
      
    case 'br': // Bottom right
      page.drawLine({
        start: { x: x - size, y },
        end: { x: x + size, y },
        color,
        thickness: 2,
      });
      page.drawLine({
        start: { x, y: y - size },
        end: { x, y: y + size },
        color,
        thickness: 2,
      });
      break;
  }
}

// Helper function to draw watermark pattern
function drawWatermarkPattern(page: any, width: number, height: number) {
  // Light background pattern with maritime elements
  const patternColor = rgb(0.97, 0.98, 0.99);
  
  // Draw subtle diagonal lines
  for (let i = 0; i < width; i += 60) {
    page.drawLine({
      start: { x: i, y: 0 },
      end: { x: i + height * 0.3, y: height },
      color: patternColor,
      thickness: 0.5,
    });
  }
  
  // Add subtle compass rose in center
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 80;
  
  // Draw compass rose outline (very subtle)
  for (let angle = 0; angle < 360; angle += 45) {
    const radians = (angle * Math.PI) / 180;
    const endX = centerX + Math.cos(radians) * radius;
    const endY = centerY + Math.sin(radians) * radius;
    
    page.drawLine({
      start: { x: centerX, y: centerY },
      end: { x: endX, y: endY },
      color: rgb(0.98, 0.98, 0.99),
      thickness: 0.3,
    });
  }
}
function parseVesselDataFromContent(content: string): any {
  const data: any = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes(':')) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      
      // Map common fields
      if (key.includes('Name')) data.name = value;
      else if (key.includes('IMO')) data.imo = value;
      else if (key.includes('MMSI')) data.mmsi = value;
      else if (key.includes('Call Sign')) data.callsign = value;
      else if (key.includes('Flag')) data.flag = value;
      else if (key.includes('Built')) data.built = value;
      else if (key.includes('Vessel Type')) data.type = value;
      else if (key.includes('Deadweight')) data.deadweight = value.replace(/[^0-9]/g, '');
      else if (key.includes('Gross Tonnage')) data.gross_tonnage = value.replace(/[^0-9]/g, '');
      else if (key.includes('Length')) data.length = value.replace(/[^0-9.]/g, '');
      else if (key.includes('Beam')) data.beam = value.replace(/[^0-9.]/g, '');
      else if (key.includes('Draught')) data.draught = value.replace(/[^0-9.]/g, '');
      else if (key.includes('Cargo Type')) data.cargo_type = value;
      else if (key.includes('Oil Type')) data.oil_type = value;
      else if (key.includes('Cargo Quantity')) data.quantity = value.replace(/[^0-9]/g, '');
      else if (key.includes('Loading Port')) data.loading_port = value;
      else if (key.includes('Destination Port')) data.destination_port = value;
    }
  }
  
  return data;
}

function parseContentIntoSections(content: string) {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const sections = [];
  let currentSection = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if it's a section header (all caps, contains keywords, ends with colon)
    if (trimmedLine.match(/^[A-Z\s&-]+:?\s*$/) || 
        trimmedLine.includes('VESSEL') || 
        trimmedLine.includes('TECHNICAL') || 
        trimmedLine.includes('COMMERCIAL') || 
        trimmedLine.includes('CARGO') || 
        trimmedLine.includes('VOYAGE')) {
      
      // Save previous section
      if (currentSection && currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      
      // Start new section
      currentSection = {
        title: trimmedLine.replace(':', ''),
        items: []
      };
    } else if (currentSection && trimmedLine.length > 0) {
      // Add to current section
      currentSection.items.push(trimmedLine);
    } else if (!currentSection && trimmedLine.length > 0) {
      // Create default section for orphaned content
      if (sections.length === 0) {
        currentSection = {
          title: 'DOCUMENT DETAILS',
          items: [trimmedLine]
        };
      }
    }
  }
  
  // Add last section
  if (currentSection && currentSection.items.length > 0) {
    sections.push(currentSection);
  }
  
  return sections;
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string {
  // Simple text wrapping - split long text into multiple lines
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    
    // Rough estimation of text width (this is approximate)
    const estimatedWidth = testLine.length * (fontSize * 0.6);
    
    if (estimatedWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is too long, just use it
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
}