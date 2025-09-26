import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

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
    const requestData: BillingEmailRequest = await req.json()
    
    const { 
      user_email, 
      user_name, 
      subscription_details,
      company_info
    } = requestData

    console.log("Sending billing email to:", user_email)
    console.log("Subscription details:", subscription_details)

    // Format amount for display
    const formattedAmount = `$${(subscription_details.amount / 100).toFixed(2)}`
    const trialText = subscription_details.trial_end 
      ? `Your free trial ends on ${new Date(subscription_details.trial_end).toLocaleDateString()}`
      : 'Your subscription is now active'

    // Create beautiful billing email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PetroDealHub Subscription Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%); padding: 40px 30px; text-align: center;">
            <div style="display: inline-block; background: white; padding: 15px; border-radius: 50%; margin-bottom: 20px;">
              <div style="font-size: 32px;">🛢️</div>
            </div>
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">PetroDealHub</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Subscription Confirmed</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: white; padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 50px; font-weight: bold; font-size: 16px;">
                ✓ Payment Successful
              </div>
            </div>

            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Welcome aboard, ${user_name}!</h2>
            
            <p style="font-size: 16px; color: #4b5563; margin-bottom: 30px;">
              Thank you for choosing PetroDealHub. Your subscription has been successfully activated and you're ready to access our comprehensive oil trading platform.
            </p>

            <!-- Subscription Details Card -->
            <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
              <h3 style="color: #1e40af; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                📋 Subscription Details
              </h3>
              
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                  <span style="color: #6b7280; font-weight: 500;">Plan:</span>
                  <span style="color: #1f2937; font-weight: bold; font-size: 16px;">${subscription_details.plan_name}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Amount:</span>
                  <span style="color: #059669; font-weight: bold; font-size: 18px;">${formattedAmount}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Billing Cycle:</span>
                  <span style="color: #1f2937; font-weight: 600;">${subscription_details.billing_cycle}</span>
                </div>
                
                ${subscription_details.trial_end ? `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Free Trial:</span>
                  <span style="color: #3b82f6; font-weight: 600;">Until ${new Date(subscription_details.trial_end).toLocaleDateString()}</span>
                </div>
                ` : ''}
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Subscription ID:</span>
                  <span style="color: #6b7280; font-family: monospace; font-size: 12px;">${subscription_details.subscription_id.substring(0, 20)}...</span>
                </div>
              </div>
              
              ${subscription_details.trial_end ? `
              <div style="background: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 15px; margin-top: 20px;">
                <div style="color: #1e40af; font-weight: 600; margin-bottom: 5px;">🎉 Free Trial Active</div>
                <div style="color: #1e3a8a; font-size: 14px;">${trialText}. No charges until then!</div>
              </div>
              ` : ''}
            </div>

            ${company_info?.company_name ? `
            <!-- Company Info -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #166534; margin: 0 0 10px 0;">Company Information</h4>
              <p style="color: #15803d; margin: 5px 0;"><strong>Company:</strong> ${company_info.company_name}</p>
              ${company_info.company_size ? `<p style="color: #15803d; margin: 5px 0;"><strong>Size:</strong> ${company_info.company_size}</p>` : ''}
            </div>
            ` : ''}

            <!-- Action Buttons -->
            <div style="text-align: center; margin: 40px 0;">
              <div style="margin-bottom: 15px;">
                <a href="${Deno.env.get("SUPABASE_URL")?.replace('supabase.co', 'lovable.app') || 'https://preview--aivessel-trade-flow.lovable.app'}/dashboard" 
                   style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
                          color: white; 
                          padding: 16px 32px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          display: inline-block;
                          font-size: 16px;
                          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                  🚀 Access Your Dashboard
                </a>
              </div>
              
              <div>
                <a href="${Deno.env.get("SUPABASE_URL")?.replace('supabase.co', 'lovable.app') || 'https://preview--aivessel-trade-flow.lovable.app'}/subscription" 
                   style="background: transparent; 
                          color: #1e40af; 
                          padding: 12px 24px; 
                          text-decoration: none; 
                          border: 2px solid #1e40af;
                          border-radius: 8px; 
                          font-weight: 600; 
                          display: inline-block;
                          font-size: 14px;">
                  📄 Manage Subscription
                </a>
              </div>
            </div>

            <!-- Features Highlight -->
            <div style="background: #fafafa; border-radius: 12px; padding: 30px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin: 0 0 20px 0; text-align: center;">🌟 What's Included in Your Plan</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="color: #22c55e; font-size: 18px;">✅</div>
                  <span style="color: #4b5563;">Real-time vessel tracking and port monitoring</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="color: #22c55e; font-size: 18px;">✅</div>
                  <span style="color: #4b5563;">Comprehensive refinery and company databases</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="color: #22c55e; font-size: 18px;">✅</div>
                  <span style="color: #4b5563;">Advanced oil market analytics and pricing</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="color: #22c55e; font-size: 18px;">✅</div>
                  <span style="color: #4b5563;">Document generation and management tools</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="color: #22c55e; font-size: 18px;">✅</div>
                  <span style="color: #4b5563;">24/7 customer support</span>
                </div>
              </div>
            </div>

            <!-- Support Info -->
            <div style="text-align: center; padding: 20px; background: #f1f5f9; border-radius: 8px; margin: 30px 0;">
              <h4 style="color: #1e40af; margin: 0 0 10px 0;">Need Help Getting Started?</h4>
              <p style="color: #64748b; margin: 0 0 15px 0;">Our team is here to help you make the most of your PetroDealHub subscription.</p>
              <a href="${Deno.env.get("SUPABASE_URL")?.replace('supabase.co', 'lovable.app') || 'https://preview--aivessel-trade-flow.lovable.app'}/support" 
                 style="color: #1e40af; text-decoration: none; font-weight: 600;">
                📧 Contact Support
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #1f2937; padding: 30px; text-align: center; color: #9ca3af;">
            <div style="margin-bottom: 20px;">
              <div style="display: inline-block; background: #374151; padding: 10px; border-radius: 50%; margin-bottom: 15px;">
                <div style="color: #60a5fa; font-size: 24px;">🛢️</div>
              </div>
              <h4 style="color: white; margin: 0;">PetroDealHub</h4>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Global Oil Trading & Maritime Intelligence Platform</p>
            </div>
            
            <div style="border-top: 1px solid #374151; padding-top: 20px;">
              <p style="margin: 0; font-size: 12px;">© 2024 PetroDealHub. All rights reserved.</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">
                This is an automated billing confirmation. Please keep this email for your records.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send billing email via Resend
    const { data, error } = await resend.emails.send({
      from: "PetroDealHub Billing <billing@resend.dev>",
      to: [user_email],
      subject: `🧾 [PetroDealHub] Subscription Confirmed - ${subscription_details.plan_name}`,
      html: emailHtml,
    })

    if (error) {
      console.error("Resend error:", error)
      throw error
    }

    console.log("Billing email sent successfully:", data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Billing email sent successfully",
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
    console.error("Error sending billing email:", error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send billing email" 
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