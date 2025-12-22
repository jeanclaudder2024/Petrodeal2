import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface BillingEmailRequest {
  user_email: string
  user_name: string
  subscription_details: {
    plan_name: string
    amount: number
    currency: string
    billing_cycle: string
    trial_end?: string
    subscription_id: string
    invoice_url?: string
  }
  company_info?: {
    company_name?: string
    company_size?: string
  }
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
    result = result.replace(regex, data[key]?.toString() || '');
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

  // Try default account first
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const requestData: BillingEmailRequest = await req.json()
    const { user_email, user_name, subscription_details, company_info } = requestData

    // Mask email for logging
    const maskedEmail = user_email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    console.log("[SEND-BILLING] Processing for:", maskedEmail);

    // Try to fetch template from database first
    const { data: template } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('name', 'subscription_confirmation')
      .eq('active', true)
      .single();

    // Prepare placeholder data
    const placeholderData = {
      user_name: user_name,
      user_email: user_email,
      plan_name: subscription_details.plan_name,
      amount: `$${(subscription_details.amount / 100).toFixed(2)}`,
      billing_cycle: subscription_details.billing_cycle,
      trial_end_date: subscription_details.trial_end 
        ? new Date(subscription_details.trial_end).toLocaleDateString() 
        : '',
      subscription_id: subscription_details.subscription_id,
      invoice_url: subscription_details.invoice_url || '',
      company_name: company_info?.company_name || '',
      company_size: company_info?.company_size || '',
      platform_name: 'PetroDealHub',
      platform_url: 'https://petrodealhub.com',
    };

    let emailSubject: string;
    let emailHtml: string;
    let templateId: string | null = null;
    let templateName: string | null = null;

    if (template && template.html_source) {
      // Use database template
      console.log("[SEND-BILLING] Using database template:", template.name);
      emailSubject = replacePlaceholders(template.subject, placeholderData);
      emailHtml = replacePlaceholders(template.html_source, placeholderData);
      templateId = template.id;
      templateName = template.name;
    } else {
      // Fallback to default template
      console.log("[SEND-BILLING] Using default hardcoded template");
      emailSubject = `🧾 [PetroDealHub] Subscription Confirmed - ${subscription_details.plan_name}`;
      emailHtml = generateDefaultBillingHtml(placeholderData, subscription_details);
    }

    // Get SMTP configuration
    const smtpConfig = await getSmtpConfig(supabaseClient, template?.email_account_id);
    
    if (!smtpConfig) {
      console.error('[SEND-BILLING] No SMTP configuration found');
      return new Response(
        JSON.stringify({ success: false, error: "No SMTP configuration found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SEND-BILLING] Using SMTP: ${smtpConfig.host}:${smtpConfig.port}`);

    // Create SMTP client and send
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

    const senderEmail = smtpConfig.username;
    const senderName = smtpConfig.from_name || 'PetroDealHub Billing';

    await client.send({
      from: `${senderName} <${senderEmail}>`,
      to: [user_email],
      subject: emailSubject,
      content: `Welcome ${user_name}! Your ${subscription_details.plan_name} subscription has been confirmed.`,
      html: emailHtml,
    });

    await client.close();
    console.log("[SEND-BILLING] Email sent successfully");

    // Log to email_sending_history
    await supabaseClient.from('email_sending_history').insert({
      template_id: templateId,
      template_name: templateName || 'subscription_confirmation',
      recipient_email: user_email,
      subject: emailSubject,
      body: emailHtml,
      status: 'sent',
      source: 'system',
      metadata: { 
        type: 'billing_confirmation',
        plan_name: subscription_details.plan_name,
        send_method: 'smtp'
      }
    });

    return new Response(
      JSON.stringify({ success: true, message: "Billing email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    )

  } catch (error: any) {
    console.error("[SEND-BILLING] Error:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to send billing email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    )
  }
}

function generateDefaultBillingHtml(data: Record<string, any>, subscription: any): string {
  const trialSection = subscription.trial_end ? `
    <div style="background: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 15px; margin-top: 20px;">
      <div style="color: #1e40af; font-weight: 600;">🎉 Free Trial Active</div>
      <div style="color: #1e3a8a; font-size: 14px;">Your free trial ends on ${data.trial_end_date}. No charges until then!</div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🛢️ PetroDealHub</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Subscription Confirmed</p>
  </div>
  <div style="background: white; padding: 40px 30px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="background: #22c55e; color: white; padding: 12px 24px; border-radius: 50px; font-weight: bold; display: inline-block;">✓ Payment Successful</span>
    </div>
    <h2 style="color: #1f2937;">Welcome aboard, ${data.user_name}!</h2>
    <p>Thank you for choosing PetroDealHub. Your subscription has been successfully activated.</p>
    <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <h3 style="color: #1e40af; margin: 0 0 20px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📋 Subscription Details</h3>
      <div style="display: grid; gap: 15px;">
        <div style="display: flex; justify-content: space-between; padding: 10px 0;">
          <span style="color: #6b7280;">Plan:</span>
          <span style="color: #1f2937; font-weight: bold;">${data.plan_name}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Amount:</span>
          <span style="color: #059669; font-weight: bold; font-size: 18px;">${data.amount}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Billing Cycle:</span>
          <span style="color: #1f2937; font-weight: 600;">${data.billing_cycle}</span>
        </div>
      </div>
      ${trialSection}
    </div>
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://petrodealhub.com/dashboard" style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">🚀 Access Your Dashboard</a>
    </div>
  </div>
  <div style="background: #1f2937; padding: 30px; text-align: center; color: #9ca3af;">
    <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} PetroDealHub. All rights reserved.</p>
  </div>
</body>
</html>`;
}

serve(handler)