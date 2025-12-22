import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateEmailRequest {
  prompt: string;
  type?: 'promotional' | 'newsletter' | 'announcement' | 'follow-up';
  tone?: 'professional' | 'friendly' | 'urgent' | 'casual';
  include_placeholders?: boolean;
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: GenerateEmailRequest = await req.json();
    const { prompt, type = 'promotional', tone = 'professional', include_placeholders = true } = request;

    if (!prompt) {
      return new Response(
        JSON.stringify({ success: false, error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[GENERATE-MARKETING-EMAIL] Generating ${type} email with ${tone} tone`);

    const systemPrompt = `You are an expert email marketing copywriter for PetroDealHub, an oil and petroleum trading platform. 
Generate professional HTML marketing emails that are:
- Visually appealing with clean, modern design
- Mobile-responsive
- Compelling and conversion-focused
- Brand-consistent with petroleum/oil trading industry

${include_placeholders ? `Include these placeholders where appropriate:
- {{user_name}} - Recipient's name
- {{company_name}} - Recipient's company
- {{platform_name}} - PetroDealHub
- {{platform_url}} - https://petrodealhub.com
- {{current_date}} - Current date
- {{unsubscribe_link}} - Unsubscribe link` : ''}

Email type: ${type}
Tone: ${tone}

Return ONLY a JSON object with this structure:
{
  "subject": "Email subject line",
  "preview_text": "Email preview text (50-100 chars)",
  "html_content": "Complete HTML email with inline styles"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
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

    const emailContent = JSON.parse(content);
    console.log('[GENERATE-MARKETING-EMAIL] Generated email:', emailContent.subject);

    return new Response(
      JSON.stringify({ 
        success: true, 
        email: emailContent
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[GENERATE-MARKETING-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to generate email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
