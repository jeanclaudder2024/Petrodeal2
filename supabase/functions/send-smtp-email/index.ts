import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  email_account_id?: string;
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
    const request: SendEmailRequest = await req.json();
    const { to, subject, body, html, from_name, from_email, reply_to, email_account_id } = request;

    if (!to || !subject || (!body && !html)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, subject, and body/html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];
    console.log(`[SEND-SMTP-EMAIL] Sending to ${recipients.length} recipients`);

    // Get SMTP configuration
    let smtpConfig: any = null;

    // If specific email_account_id provided, use that account
    if (email_account_id) {
      const { data: account, error: accountError } = await supabaseClient
        .from('email_accounts')
        .select('*')
        .eq('id', email_account_id)
        .single();

      if (!accountError && account && account.smtp_host) {
        smtpConfig = {
          host: account.smtp_host,
          port: account.smtp_port || 587,
          username: account.smtp_username,
          password: account.smtp_password,
          enable_tls: account.enable_tls ?? true,
          from_email: account.email_address,
          from_name: account.account_name,
        };
        console.log(`[SEND-SMTP-EMAIL] Using specified account: ${account.email_address}`);
      }
    }

    // If no specific account, try default account
    if (!smtpConfig) {
      const { data: defaultAccount } = await supabaseClient
        .from('email_accounts')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (defaultAccount && defaultAccount.smtp_host) {
        smtpConfig = {
          host: defaultAccount.smtp_host,
          port: defaultAccount.smtp_port || 587,
          username: defaultAccount.smtp_username,
          password: defaultAccount.smtp_password,
          enable_tls: defaultAccount.enable_tls ?? true,
          from_email: defaultAccount.email_address,
          from_name: defaultAccount.account_name,
        };
        console.log(`[SEND-SMTP-EMAIL] Using default account: ${defaultAccount.email_address}`);
      }
    }

    // If still no SMTP config, try email_configurations table
    if (!smtpConfig) {
      const { data: configData } = await supabaseClient
        .from('email_configurations')
        .select('*')
        .eq('type', 'smtp')
        .eq('active', true)
        .single();

      if (configData) {
        smtpConfig = {
          host: configData.host,
          port: configData.port || 587,
          username: configData.username,
          password: configData.password,
          enable_tls: configData.enable_tls ?? true,
          from_email: configData.from_email || configData.username,
          from_name: configData.from_name || 'PetroDealHub',
        };
        console.log(`[SEND-SMTP-EMAIL] Using email_configurations: ${smtpConfig.from_email}`);
      }
    }

    if (!smtpConfig) {
      console.error('[SEND-SMTP-EMAIL] No SMTP configuration found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No SMTP configuration found. Please configure SMTP settings in Email Configuration." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SEND-SMTP-EMAIL] SMTP config: ${smtpConfig.host}:${smtpConfig.port}`);

    // Create SMTP client using denomailer
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

    // Send email - IMPORTANT: from address MUST match SMTP authenticated user
    // Many SMTP servers (Hostinger, Gmail, etc.) reject emails where from address doesn't match auth user
    const senderEmail = smtpConfig.username; // Always use authenticated username as sender
    const senderName = from_name || smtpConfig.from_name;
    
    console.log(`[SEND-SMTP-EMAIL] Sending email from ${senderEmail} via denomailer...`);
    
    await client.send({
      from: `${senderName} <${senderEmail}>`,
      to: recipients,
      subject: subject,
      content: body,
      html: html || body,
    });

    await client.close();
    console.log('[SEND-SMTP-EMAIL] Email sent successfully');

    // Log success
    await supabaseClient
      .from('email_sending_history')
      .insert({
        recipient_email: recipients.join(', '),
        subject: subject,
        body: html || body,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: { 
          send_method: 'denomailer-smtp',
          smtp_host: smtpConfig.host
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully via SMTP'
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[SEND-SMTP-EMAIL] Error:", error);

    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});