import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { templateId, vesselId } = await req.json();

    const { data: template } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    const templateResponse = await fetch(template.file_url);
    const templateBuffer = await templateResponse.arrayBuffer();

    const { data: vessel } = await supabase
      .from('vessels')
      .select('*')
      .eq('id', vesselId)
      .single();

    // Replacement data
    const replacements: Record<string, string> = {
      'document_number': 'ICPO-2025-1234',
      'issue_date': '2025-01-03',
      'valid_until': '2025-02-03',
      'notary_number': 'NOT-12345',
      'buyer_company_name': 'Global Maritime Trading Ltd',
      'authorized_person_name': 'Michael Johnson',
      'imo_number': vessel?.imo || 'IMO1234567',
      'flag_state': vessel?.flag || 'Panama',
      'vessel_type': vessel?.vessel_type || 'Oil Tanker',
      'call_sign': vessel?.callsign || 'ABCD',
      'year_built': vessel?.built || '2010',
      'vessel_owner': vessel?.owner_name || 'Sample Owner',
      'length_overall': vessel?.length || '200',
      'vessel_operator': vessel?.operator_name || 'Sample Operator',
      'beam': vessel?.beam || '32',
      'ism_manager': 'International Ship Management',
      'draft': vessel?.draught || '12',
      'registry_port': 'Panama City',
      'gross_tonnage': vessel?.gross_tonnage || '50000',
      'deadweight': vessel?.deadweight || '100000',
      'net_tonnage': vessel?.net_tonnage || '30000',
      'cargo_capacity': '120525',
      'class_society': 'Lloyds Register',
      'cargo_tanks': '12',
      'engine_type': 'MAN B&W',
      'pumping_capacity': '2500',
      'speed': vessel?.speed || '14',
      'shipping_terms': 'FOB',
      'total_quantity': '100000 MT',
      'monthly_delivery': '25000 MT',
      'contract_duration': '12 months',
      'payment_terms': 'LC at sight',
      'contract_value': 'USD 75000000',
      'performance_bond': '2 percent',
      'shipping_documents': 'Bill of Lading Invoice Certificate',
      'buyer_name': 'Michael Johnson',
      'buyer_position': 'CEO',
      'buyer_registration': 'REG123456',
      'buyer_address': '123 Maritime Plaza',
      'buyer_city_country': 'Singapore',
      'buyer_office_tel': '+65 6123 4567',
      'buyer_mobile': '+65 9123 4567',
      'buyer_fax': '+65 6123 4568',
      'buyer_email': 'michael@company.com',
      'issuing_bank_name': 'Standard Chartered Bank',
      'issuing_bank_address': '8 Marina Boulevard Singapore',
      'issuing_bank_swift': 'SCBLSG22',
      'issuing_bank_tel': '+65 6747 7000',
      'issuing_bank_account_number': '001234567890',
      'issuing_bank_account_name': 'Global Maritime Trading',
      'issuing_bank_officer': 'Sarah Chen',
      'issuing_bank_officer_contact': 'sarah.chen@sc.com',
      'confirming_bank_name': 'HSBC Bank',
      'confirming_bank_address': 'Dubai UAE',
      'confirming_bank_swift': 'BBMEAEAD',
      'confirming_bank_tel': '+971 4 423 6000',
      'confirming_bank_account_number': '002345678901',
      'confirming_bank_account_name': 'Global Maritime Trading',
      'confirming_bank_officer': 'Ahmed Al-Rashid',
      'confirming_bank_officer_contact': 'ahmed@hsbc.ae',
      'buyer_signatory_name': 'Michael Johnson',
      'buyer_signatory_position': 'CEO',
      'buyer_signatory_date': '2025-01-03',
      'buyer_signature': 'SIGNATURE AND SEAL',
      'seller_signatory_name': 'David Smith',
      'seller_signatory_position': 'Managing Director',
      'seller_signatory_date': '2025-01-03',
      'seller_signature': 'SIGNATURE AND SEAL'
    };

    // Process Word document - THE KEY FIX
    const zip = await JSZip.loadAsync(templateBuffer);
    const documentFile = zip.files['word/document.xml'];
    let xml = await documentFile.async('string');

    // CRITICAL: Remove all Word formatting that splits placeholders
    // This combines split text runs into single runs
    xml = xml.replace(/<w:r[^>]*>.*?<\/w:r>/gs, (match) => {
      // Extract all text content from this run
      const texts = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (!texts) return match;
      
      // Combine all text
      const combinedText = texts.map(t => t.replace(/<w:t[^>]*>([^<]*)<\/w:t>/, '$1')).join('');
      
      // Keep run properties but replace with single text element
      const runStart = match.match(/<w:r[^>]*>/)[0];
      const runProps = match.match(/<w:rPr>.*?<\/w:rPr>/s)?.[0] || '';
      
      return `${runStart}${runProps}<w:t>${combinedText}</w:t></w:r>`;
    });

    // Now replace placeholders
    for (const [key, value] of Object.entries(replacements)) {
      xml = xml.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    zip.file('word/document.xml', xml);

    const processedDocx = await zip.generateAsync({ type: 'uint8array' });
    const base64String = encode(processedDocx);

    return new Response(JSON.stringify({
      success: true,
      docx_base64: base64String,
      filled_placeholders: replacements,
      message: 'Document processed successfully!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});