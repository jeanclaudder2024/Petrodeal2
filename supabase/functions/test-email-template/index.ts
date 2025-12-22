import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  templateId: string;
  recipientEmail: string;
  emailAccountId?: string;
}

// Sample data for testing
const SAMPLE_DATA = {
  // User placeholders
  user_name: 'John Doe',
  user_email: 'john.doe@example.com',
  user_id: 'usr_12345',
  
  // Subscription placeholders
  plan_name: 'Professional Plan',
  plan_tier: 'pro',
  subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  trial_days: '14',
  
  // Payment placeholders
  amount: '$99.00',
  currency: 'USD',
  invoice_id: 'INV-2024-001',
  payment_date: new Date().toLocaleDateString(),
  
  // Vessel placeholders
  vessel_name: 'MT Ocean Explorer',
  imo: '9876543',
  mmsi: '123456789',
  vessel_type: 'Oil Tanker',
  destination: 'Rotterdam',
  
  // Deal placeholders
  deal_id: 'DEAL-2024-001',
  deal_status: 'In Progress',
  cargo_type: 'Crude Oil',
  quantity: '50,000 MT',
  
  // Broker placeholders
  broker_name: 'Jane Smith',
  broker_email: 'jane.smith@example.com',
  membership_status: 'Active',
  
  // Port placeholders
  port_name: 'Port of Houston',
  port_country: 'United States',
  port_region: 'Gulf Coast',
  
  // Support placeholders
  ticket_id: 'TKT-2024-001',
  ticket_subject: 'Account Query',
  ticket_status: 'Open',
  
  // System placeholders
  platform_name: 'PetroDealHub',
  platform_url: 'https://petrodealhub.com',
  current_date: new Date().toLocaleDateString(),
  current_year: new Date().getFullYear().toString(),
};

// Replace placeholders in template
function replacePlaceholders(text: string, data: Record<string, any>): string {
  let result = text;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  return result;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { templateId, recipientEmail, emailAccountId }: TestEmailRequest = await req.json();

    if (!templateId || !recipientEmail) {
      return new Response(
        JSON.stringify({ success: false, message: 'Template ID and recipient email are required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[TEST-EMAIL-TEMPLATE] Testing template ${templateId} to ${recipientEmail}`);

    // Fetch the template
    const { data: template, error: templateError } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.error('[TEST-EMAIL-TEMPLATE] Template not found:', templateError);
      return new Response(
        JSON.stringify({ success: false, message: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subject = `[TEST] ${replacePlaceholders(template.subject, SAMPLE_DATA)}`;
    const body = replacePlaceholders(template.html_source || template.body, SAMPLE_DATA);
    
    const htmlContent = `
      <div style="background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px;">
          <div style="background: #fef3cd; border: 1px solid #ffc107; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
            <strong>⚠️ TEST EMAIL</strong> - This is a test email with sample data
          </div>
          ${body}
        </div>
      </div>
    `;

    // Send via SMTP helper function only (no Resend fallback)
    let emailSent = false;
    let sendMethod = '';
    let sendError = '';

    try {
      console.log('[TEST-EMAIL-TEMPLATE] Trying SMTP via send-smtp-email...');
      const smtpResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-smtp-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: subject,
          html: htmlContent,
          text: body.replace(/<[^>]*>/g, ''),
          email_account_id: emailAccountId || null
        })
      });

      const smtpResult = await smtpResponse.json();
      console.log('[TEST-EMAIL-TEMPLATE] SMTP result:', smtpResult);
      
      if (smtpResult.success) {
        emailSent = true;
        sendMethod = 'SMTP';
      } else {
        sendError = smtpResult.error || 'SMTP send failed';
      }
    } catch (smtpError: any) {
      console.error('[TEST-EMAIL-TEMPLATE] SMTP error:', smtpError);
      sendError = smtpError.message;
    }

    if (!emailSent) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `SMTP failed: ${sendError || 'Unknown error. Please check your SMTP configuration in Email Configuration.'}`
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log to history
    await supabaseClient
      .from('email_sending_history')
      .insert({
        template_id: templateId,
        recipient_email: recipientEmail,
        subject: subject,
        body: body,
        status: 'sent',
        metadata: { test: true, sample_data: SAMPLE_DATA, send_method: sendMethod }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email sent to ${recipientEmail} via ${sendMethod}` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[TEST-EMAIL-TEMPLATE] Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Failed to send test email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
