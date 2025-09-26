import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"
import { Resend } from "https://esm.sh/resend@2.0.0"

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

    // Create simple HTML email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Activate Your PetroDealHub Account</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🛢️ PetroDealHub</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Global Oil Trading Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome ${userName}!</h2>
            
            <p>Thank you for signing up for PetroDealHub. To activate your account and start your free global trial, please click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;
                        text-align: center;">
                ✨ Activate Your Account
              </a>
            </div>
            
            <p style="margin-top: 30px;">Or copy and paste this link into your browser:</p>
            <p style="background: #e9ecef; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 14px;">
              ${confirmationUrl}
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <h3 style="color: #495057;">🚀 What's waiting for you:</h3>
              <ul style="color: #6c757d; padding-left: 20px;">
                <li>Access to global oil trading networks</li>
                <li>Real-time vessel and port tracking</li>
                <li>Advanced refinery and company databases</li>
                <li>5-day free trial to explore all features</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
            <p>© 2024 PetroDealHub. All rights reserved.</p>
            <p>Global Oil Trading & Maritime Intelligence Platform</p>
          </div>
        </body>
      </html>
    `

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