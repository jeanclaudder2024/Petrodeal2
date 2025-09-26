import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompanyData {
  name: string;
  description?: string;
  industry?: string;
  country?: string;
  city?: string;
  website?: string;
  email?: string;
  phone?: string;
  founded_year?: number;
  employees_count?: number;
  annual_revenue?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { companyName } = await req.json()

    if (!companyName) {
      return new Response(
        JSON.stringify({ error: 'Company name is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const prompt = `Generate realistic company information for: "${companyName}". This could be a real company or you can create realistic details for a company with this name.

Please provide the information in the following JSON format:
{
  "name": "${companyName}",
  "description": "Brief company description (2-3 sentences)",
  "industry": "Main industry sector",
  "country": "Country name",
  "city": "City name",
  "website": "https://example.com format",
  "email": "contact@company.com format",
  "phone": "International format phone number",
  "founded_year": "Year as number (realistic year)",
  "employees_count": "Number of employees (realistic estimate)",
  "annual_revenue": "Annual revenue in USD (realistic estimate, no currency symbol)"
}

Make sure all values are realistic and professional. For the website, use a realistic domain. For email, use a professional contact email. For phone, use international format with country code.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates realistic company information. Always respond with valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    let companyData: CompanyData
    try {
      companyData = JSON.parse(content)
    } catch (parseError) {
      throw new Error('Failed to parse AI response as JSON')
    }

    return new Response(
      JSON.stringify({ success: true, data: companyData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in autofill-company-data function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate company data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})