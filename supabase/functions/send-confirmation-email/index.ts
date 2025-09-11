import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"
import { Resend } from "npm:resend@4.0.0"
import { renderAsync } from "npm:@react-email/components@0.0.22"
import React from "npm:react@18.3.1"
import { ConfirmationEmail } from "./_templates/confirmation-email.tsx"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    // For webhook verification (if using Supabase auth webhooks)
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
      // Webhook verification for Supabase auth emails
      const wh = new Webhook(hookSecret)
      emailData = wh.verify(payload, headers) as any
    } else {
      // Direct API call
      emailData = JSON.parse(payload)
    }

    const { user, email_data } = emailData
    const { token_hash, redirect_to, email_action_type } = email_data
    
    // Extract user name from metadata or email
    const userName = user.user_metadata?.full_name || user.email.split('@')[0]
    
    // Build confirmation URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

    console.log("Sending confirmation email to:", user.email)
    console.log("User name:", userName)
    console.log("Confirmation URL:", confirmationUrl)

    // Render the email template
    const emailHtml = await renderAsync(
      React.createElement(ConfirmationEmail, {
        name: userName,
        confirmationUrl: confirmationUrl,
      })
    )

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "PetroDealHub <onboarding@resend.dev>",
      to: [user.email],
      subject: "🔒 [PetroDealHub] – Activate Your Account & Start Your Free Global Trial",
      html: emailHtml,
    })

    if (error) {
      console.error("Resend error:", error)
      throw error
    }

    console.log("Email sent successfully:", data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Confirmation email sent successfully",
        data 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    )

  } catch (error: any) {
    console.error("Error sending confirmation email:", error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send confirmation email" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    )
  }
}

serve(handler)