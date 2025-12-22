import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIReplyRequest {
  email_id: string;
  from_email: string;
  subject: string;
  body: string;
  send_reply?: boolean;
  email_account_id?: string;
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
    const request: AIReplyRequest = await req.json();
    const { email_id, from_email, subject, body, send_reply = false, email_account_id } = request;

    if (!from_email || !subject || !body) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AI-REPLY] Generating reply for email from: ${from_email}`);

    // Generate AI reply
    const systemPrompt = `You are a professional customer support representative for PetroDealHub, an oil and petroleum trading platform.
    
Generate professional, helpful, and friendly email replies. Key guidelines:
- Be concise but thorough
- Address all questions or concerns raised
- Maintain a professional yet warm tone
- Include relevant platform information when appropriate
- Sign off as "PetroDealHub Support Team"
- If the email is about technical issues, suggest contacting support@petrodealhub.com
- For pricing inquiries, mention our subscription plans are available at https://petrodealhub.com/subscription
- For broker-related questions, mention our broker membership program

Return ONLY a JSON object with this structure:
{
  "reply_subject": "Re: Original subject",
  "reply_body": "The email reply body in HTML format",
  "detected_intent": "inquiry/complaint/support/other",
  "suggested_priority": "low/medium/high"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a reply for this email:\n\nFrom: ${from_email}\nSubject: ${subject}\n\nBody:\n${body}` }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const replyContent = JSON.parse(content);
    console.log('[AI-REPLY] Generated reply for intent:', replyContent.detected_intent);

    // If send_reply is true, send the email via SMTP
    if (send_reply && email_id) {
      const smtpConfig = await getSmtpConfig(supabaseClient, email_account_id);
      
      if (smtpConfig) {
        try {
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
          const senderName = smtpConfig.from_name || 'PetroDealHub Support';

          await client.send({
            from: `${senderName} <${senderEmail}>`,
            to: [from_email],
            subject: replyContent.reply_subject,
            content: replyContent.reply_body.replace(/<[^>]*>/g, ''), // Plain text version
            html: replyContent.reply_body,
          });

          await client.close();

          // Update incoming email record
          await supabaseClient
            .from('incoming_emails')
            .update({
              processed: true,
              auto_replied: true,
              reply_body: replyContent.reply_body,
              replied_at: new Date().toISOString()
            })
            .eq('id', email_id);

          console.log('[AI-REPLY] Reply sent via SMTP to:', from_email);
        } catch (smtpError: any) {
          console.error('[AI-REPLY] SMTP error:', smtpError);
          throw new Error(`Failed to send email via SMTP: ${smtpError.message}`);
        }
      } else {
        console.error('[AI-REPLY] No SMTP configuration found');
        throw new Error('No SMTP configuration found. Please configure SMTP settings.');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reply: replyContent,
        sent: send_reply 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[AI-REPLY] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to generate reply" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
