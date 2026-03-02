import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { ticket_id, notification_type, recipient_email, subject, message } = await req.json();

    if (!ticket_id && !recipient_email) {
      return new Response(
        JSON.stringify({ error: 'ticket_id or recipient_email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let emailTo = recipient_email;
    let emailSubject = subject;
    let emailBody = message;

    // Get ticket data if ticket_id provided
    if (ticket_id) {
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticket_id)
        .single();

      if (ticket) {
        emailTo = emailTo || ticket.email;
        
        switch (notification_type) {
          case 'new_ticket':
            emailSubject = emailSubject || `Support Ticket #${ticket.id.slice(0, 8)} Created`;
            emailBody = emailBody || `Your support ticket "${ticket.subject}" has been created. We'll respond shortly.`;
            break;
          case 'ticket_reply':
            emailSubject = emailSubject || `Reply to Support Ticket #${ticket.id.slice(0, 8)}`;
            emailBody = emailBody || `There's a new reply on your support ticket "${ticket.subject}".`;
            break;
          case 'ticket_resolved':
            emailSubject = emailSubject || `Support Ticket #${ticket.id.slice(0, 8)} Resolved`;
            emailBody = emailBody || `Your support ticket "${ticket.subject}" has been resolved.`;
            break;
          case 'ticket_escalated':
            emailSubject = emailSubject || `Support Ticket #${ticket.id.slice(0, 8)} Escalated`;
            emailBody = emailBody || `Support ticket "${ticket.subject}" has been escalated for priority handling.`;
            break;
          default:
            emailSubject = emailSubject || `Support Ticket Update #${ticket.id.slice(0, 8)}`;
            emailBody = emailBody || `There's an update on your support ticket "${ticket.subject}".`;
        }
      }
    }

    if (!emailTo) throw new Error('No recipient email found');

    // Try to send via SMTP edge function
    const smtpResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-smtp-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: emailTo,
        subject: emailSubject,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">${emailSubject}</h2>
          <p style="color: #333; line-height: 1.6;">${emailBody}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">PetroDealHub Support Team</p>
        </div>`
      })
    });

    const smtpResult = await smtpResponse.json();

    // Log notification
    await supabase
      .from('notifications')
      .insert({
        type: 'support',
        title: emailSubject,
        message: emailBody,
        metadata: { ticket_id, notification_type, email_sent: smtpResponse.ok }
      });

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: smtpResponse.ok,
        recipient: emailTo,
        notification_type
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[send-support-notification] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
