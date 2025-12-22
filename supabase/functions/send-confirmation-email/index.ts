import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Replace placeholders in template
function replacePlaceholders(text: string, data: Record<string, any>): string {
  let result = text;
  
  result = result.replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString());
  result = result.replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString());
  result = result.replace(/\{\{platform_name\}\}/g, data.platform_name || 'PetroDealHub');
  result = result.replace(/\{\{platform_url\}\}/g, data.platform_url || 'https://petrodealhub.com');
  
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, data[key]?.toString() || '');
  });
  
  return result;
}

// Get SMTP configuration from database
async function getSmtpConfig(supabaseClient: any, emailAccountId?: string) {
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
        from_name: account.account_name,
      };
    }
  }

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
      from_name: defaultAccount.account_name,
    };
  }

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
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET")
    
    let emailData: {
      user: { email: string; user_metadata?: { full_name?: string } }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
      }
    }

    if (hookSecret) {
      const wh = new Webhook(hookSecret)
      emailData = wh.verify(payload, headers) as any
    } else {
      emailData = JSON.parse(payload)
    }

    const { user, email_data } = emailData
    const { token_hash, redirect_to, email_action_type } = email_data
    
    const userName = user.user_metadata?.full_name || user.email.split('@')[0]
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

    // Mask email for logging
    const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    console.log("[SEND-CONFIRMATION] Processing for:", maskedEmail);

    // Try to fetch template from database
    const { data: template } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('name', 'account_verification')
      .eq('active', true)
      .single();

    const placeholderData = {
      user_name: userName,
      user_email: user.email,
      confirmation_url: confirmationUrl,
      platform_name: 'PetroDealHub',
      platform_url: 'https://petrodealhub.com',
    };

    let emailSubject: string;
    let emailHtml: string;
    let templateId: string | null = null;
    let templateName: string | null = null;

    if (template && template.html_source) {
      console.log("[SEND-CONFIRMATION] Using database template:", template.name);
      emailSubject = replacePlaceholders(template.subject, placeholderData);
      emailHtml = replacePlaceholders(template.html_source, placeholderData);
      templateId = template.id;
      templateName = template.name;
    } else {
      console.log("[SEND-CONFIRMATION] Using default template");
      emailSubject = "🔒 [PetroDealHub] – Activate Your Account & Start Your Free Trial";
      emailHtml = generateDefaultConfirmationHtml(userName, confirmationUrl);
    }

    // Get SMTP configuration
    const smtpConfig = await getSmtpConfig(supabaseClient, template?.email_account_id);
    
    if (!smtpConfig) {
      console.error('[SEND-CONFIRMATION] No SMTP configuration found');
      return new Response(
        JSON.stringify({ success: false, error: "No SMTP configuration found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SEND-CONFIRMATION] Using SMTP: ${smtpConfig.host}:${smtpConfig.port}`);

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
    const senderName = smtpConfig.from_name || 'PetroDealHub';

    await client.send({
      from: `${senderName} <${senderEmail}>`,
      to: [user.email],
      subject: emailSubject,
      content: `Welcome ${userName}! Please activate your account: ${confirmationUrl}`,
      html: emailHtml,
    });

    await client.close();
    console.log("[SEND-CONFIRMATION] Email sent successfully");

    // Log to email_sending_history
    await supabaseClient.from('email_sending_history').insert({
      template_id: templateId,
      template_name: templateName || 'account_verification',
      recipient_email: user.email,
      subject: emailSubject,
      body: emailHtml,
      status: 'sent',
      source: 'system',
      metadata: { type: 'account_verification', send_method: 'smtp' }
    });

    return new Response(
      JSON.stringify({ success: true, message: "Confirmation email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    )

  } catch (error: any) {
    console.error("[SEND-CONFIRMATION] Error:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to send confirmation email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    )
  }
}

function generateDefaultConfirmationHtml(userName: string, confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🛢️ PetroDealHub</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Global Oil Trading Platform</p>
  </div>
  <div style="background: white; padding: 40px 30px;">
    <h2 style="color: #333; margin-top: 0;">Welcome ${userName}!</h2>
    <p>Thank you for signing up for PetroDealHub. To activate your account and start your free global trial, please click the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">✨ Activate Your Account</a>
    </div>
    <p style="margin-top: 30px;">Or copy and paste this link into your browser:</p>
    <p style="background: #e9ecef; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">${confirmationUrl}</p>
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6;">
      <h3 style="color: #495057;">🚀 What's waiting for you:</h3>
      <ul style="color: #6c757d; padding-left: 20px;">
        <li>Access to global oil trading networks</li>
        <li>Real-time vessel and port tracking</li>
        <li>Advanced refinery and company databases</li>
        <li>5-day free trial to explore all features</li>
      </ul>
    </div>
    <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">If you didn't create this account, you can safely ignore this email.</p>
  </div>
  <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af;">
    <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} PetroDealHub. All rights reserved.</p>
  </div>
</body>
</html>`;
}

serve(handler)