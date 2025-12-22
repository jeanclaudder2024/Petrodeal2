import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCampaignRequest {
  campaign_id: string;
}

// Replace placeholders in template
function replacePlaceholders(text: string, data: Record<string, any>): string {
  let result = text;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  
  // Add default system placeholders
  const systemPlaceholders: Record<string, string> = {
    platform_name: 'PetroDealHub',
    platform_url: 'https://petrodealhub.com',
    current_date: new Date().toLocaleDateString(),
    current_year: new Date().getFullYear().toString(),
  };
  
  Object.keys(systemPlaceholders).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, systemPlaceholders[key]);
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
    const { campaign_id }: SendCampaignRequest = await req.json();

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ success: false, error: "campaign_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SEND-CAMPAIGN] Starting campaign: ${campaign_id}`);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('email_campaigns')
      .select('*, email_accounts(*)')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ success: false, error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get SMTP configuration
    const smtpConfig = await getSmtpConfig(supabaseClient, campaign.email_account_id);
    
    if (!smtpConfig) {
      console.error('[SEND-CAMPAIGN] No SMTP configuration found');
      return new Response(
        JSON.stringify({ success: false, error: "No SMTP configuration found. Please configure SMTP settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SEND-CAMPAIGN] Using SMTP: ${smtpConfig.host}:${smtpConfig.port}`);

    // Update campaign status to sending
    await supabaseClient
      .from('email_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign_id);

    // Get pending recipients
    const { data: recipients, error: recipientsError } = await supabaseClient
      .from('campaign_recipients')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('status', 'pending');

    if (recipientsError || !recipients || recipients.length === 0) {
      await supabaseClient
        .from('email_campaigns')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', campaign_id);

      return new Response(
        JSON.stringify({ success: true, message: "No pending recipients", sent: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SEND-CAMPAIGN] Found ${recipients.length} recipients`);

    let sentCount = 0;
    let failedCount = 0;

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
    const senderName = campaign.email_accounts?.account_name || smtpConfig.from_name || 'PetroDealHub';

    // Process recipients in batches of 5
    const batchSize = 5;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      for (const recipient of batch) {
        try {
          // Prepare personalized content
          const placeholderData = {
            user_name: recipient.name || 'Valued Customer',
            user_email: recipient.email,
            ...(recipient.placeholders || {})
          };

          const subject = replacePlaceholders(campaign.subject, placeholderData);
          const htmlContent = replacePlaceholders(campaign.html_content || campaign.body, placeholderData);

          // Send email via SMTP
          await client.send({
            from: `${senderName} <${senderEmail}>`,
            to: [recipient.email],
            subject: subject,
            content: campaign.body || '',
            html: htmlContent,
          });

          // Update recipient status
          await supabaseClient
            .from('campaign_recipients')
            .update({ 
              status: 'sent', 
              sent_at: new Date().toISOString() 
            })
            .eq('id', recipient.id);

          sentCount++;
          console.log(`[SEND-CAMPAIGN] Sent to: ${recipient.email}`);
        } catch (error: any) {
          console.error(`[SEND-CAMPAIGN] Failed for ${recipient.email}:`, error.message);
          
          await supabaseClient
            .from('campaign_recipients')
            .update({ 
              status: 'failed', 
              error_message: error.message 
            })
            .eq('id', recipient.id);

          failedCount++;
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    await client.close();

    // Update campaign stats
    await supabaseClient
      .from('email_campaigns')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        failed_count: failedCount
      })
      .eq('id', campaign_id);

    console.log(`[SEND-CAMPAIGN] Complete. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Campaign sent successfully via SMTP`,
        sent: sentCount,
        failed: failedCount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[SEND-CAMPAIGN] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to send campaign" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
