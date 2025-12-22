import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  templateId: string;
  recipientEmail: string;
  data?: Record<string, any>;
  automationRuleId?: string;
  emailAccountId?: string;
}

// Replace placeholders in template
function replacePlaceholders(text: string, data: Record<string, any>): string {
  let result = text;
  
  // System placeholders
  result = result.replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString());
  result = result.replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString());
  result = result.replace(/\{\{platform_name\}\}/g, data.platform_name || 'PetroDealHub');
  result = result.replace(/\{\{platform_url\}\}/g, data.platform_url || 'https://petrodealhub.com');
  
  // Replace all custom placeholders
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  
  return result;
}

// Get SMTP configuration from database
async function getSmtpConfig(supabaseClient: any, emailAccountId?: string) {
  // If specific email_account_id provided, use that account
  if (emailAccountId) {
    const { data: account } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', emailAccountId)
      .single();

    if (account && account.smtp_host) {
      return {
        host: account.smtp_host,
        port: account.smtp_port || 587,
        username: account.smtp_username,
        password: account.smtp_password,
        enable_tls: account.enable_tls ?? true,
        from_email: account.email_address,
        from_name: account.account_name,
      };
    }
  }

  // Try default account
  const { data: defaultAccount } = await supabaseClient
    .from('email_accounts')
    .select('*')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  if (defaultAccount && defaultAccount.smtp_host) {
    return {
      host: defaultAccount.smtp_host,
      port: defaultAccount.smtp_port || 587,
      username: defaultAccount.smtp_username,
      password: defaultAccount.smtp_password,
      enable_tls: defaultAccount.enable_tls ?? true,
      from_email: defaultAccount.email_address,
      from_name: defaultAccount.account_name,
    };
  }

  // Try email_configurations table
  const { data: configData } = await supabaseClient
    .from('email_configurations')
    .select('*')
    .eq('type', 'smtp')
    .eq('active', true)
    .single();

  if (configData) {
    return {
      host: configData.host,
      port: configData.port || 587,
      username: configData.username,
      password: configData.password,
      enable_tls: configData.enable_tls ?? true,
      from_email: configData.from_email || configData.username,
      from_name: configData.from_name || 'PetroDealHub',
    };
  }

  return null;
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
    const { templateId, recipientEmail, data = {}, automationRuleId, emailAccountId }: EmailRequest = await req.json();

    if (!templateId || !recipientEmail) {
      return new Response(
        JSON.stringify({ success: false, message: 'Template ID and recipient email are required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SEND-AUTOMATED-EMAIL] Sending email template ${templateId} to ${recipientEmail}`);

    // Fetch the template
    const { data: template, error: templateError } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.error('[SEND-AUTOMATED-EMAIL] Template not found:', templateError);
      return new Response(
        JSON.stringify({ success: false, message: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get SMTP configuration - prioritize template's linked account
    const smtpConfig = await getSmtpConfig(supabaseClient, emailAccountId || template.default_email_account_id);
    
    if (!smtpConfig) {
      console.error('[SEND-AUTOMATED-EMAIL] No SMTP configuration found');
      return new Response(
        JSON.stringify({ success: false, message: 'No SMTP configuration found. Please configure SMTP settings.' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare email content
    const subject = replacePlaceholders(template.subject, data);
    const body = replacePlaceholders(template.html_source || template.body, data);
    let emailSent = false;
    let errorMessage = '';

    try {
      // Create SMTP client
      const client = new SMTPClient({
        connection: {
          hostname: smtpConfig.host,
          port: smtpConfig.port,
          tls: smtpConfig.port === 465,
          auth: {
            username: smtpConfig.username,
            password: smtpConfig.password,
          },
        },
      });

      // Sender must be the authenticated SMTP user
      const senderEmail = smtpConfig.username;
      const senderName = smtpConfig.from_name || 'PetroDealHub';

      console.log(`[SEND-AUTOMATED-EMAIL] Sending via SMTP: ${smtpConfig.host}:${smtpConfig.port}`);

      await client.send({
        from: `${senderName} <${senderEmail}>`,
        to: [recipientEmail],
        subject: subject,
        content: template.body || '',
        html: body,
      });

      await client.close();
      
      console.log('[SEND-AUTOMATED-EMAIL] Email sent via SMTP');
      emailSent = true;
    } catch (smtpError: any) {
      console.error('[SEND-AUTOMATED-EMAIL] SMTP error:', smtpError);
      errorMessage = smtpError.message || 'SMTP sending error';
    }

    // Log the email to history
    const { error: historyError } = await supabaseClient
      .from('email_sending_history')
      .insert({
        template_id: templateId,
        automation_rule_id: automationRuleId || null,
        recipient_email: recipientEmail,
        subject: subject,
        body: body,
        status: emailSent ? 'sent' : 'failed',
        error_message: emailSent ? null : errorMessage,
        metadata: { data, send_method: 'smtp' }
      });

    if (historyError) {
      console.error('[SEND-AUTOMATED-EMAIL] History logging error:', historyError);
    }

    if (!emailSent) {
      return new Response(
        JSON.stringify({ success: false, message: errorMessage || 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully via SMTP' }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[SEND-AUTOMATED-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
