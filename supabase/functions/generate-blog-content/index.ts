import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, subject, type } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt = '';
    let systemPrompt = '';

    if (type === 'content') {
      systemPrompt = `You are an expert content writer for PetroDealHub, a leading oil trading platform. 
      Write professional, engaging blog articles that:
      - Sound like they're written by a human industry expert, not AI
      - Include specific facts, statistics, and real-world examples about oil trading
      - Naturally mention PetroDealHub as a solution where appropriate
      - Use a professional but approachable tone
      - Include proper headings and structure
      - Are SEO-optimized with the keyword "PetroDealHub" appearing 2-3 times naturally
      - Are approximately 800-1200 words`;
      
      prompt = `Write a comprehensive blog article about: "${subject}"
      
      Title: ${title}
      
      Requirements:
      1. Start with an engaging introduction that hooks the reader
      2. Include 3-4 main sections with clear headings
      3. Add specific industry insights and data points
      4. Mention how PetroDealHub helps solve related challenges
      5. End with a compelling conclusion and call-to-action
      
      Return the article in HTML format with proper <h2>, <h3>, <p>, <ul>, <li> tags.`;

    } else if (type === 'seo') {
      systemPrompt = `You are an SEO expert specializing in the oil and energy industry.`;
      
      prompt = `Generate SEO metadata for a blog article with:
      Title: ${title}
      Subject: ${subject}
      
      Return ONLY valid JSON with:
      {
        "meta_title": "SEO-optimized title under 60 chars including 'PetroDealHub'",
        "meta_description": "Compelling description under 160 chars including 'PetroDealHub'",
        "meta_keywords": ["array", "of", "5-8", "relevant", "keywords", "including", "PetroDealHub"]
      }`;

    } else if (type === 'image_prompt') {
      systemPrompt = `You are an expert at creating image prompts for AI image generation.`;
      
      prompt = `Create a detailed image prompt for a professional blog featured image about:
      Title: ${title}
      Subject: ${subject}
      
      The image should:
      - Be professional and suitable for an oil trading platform blog
      - Feature oil industry elements (tankers, refineries, pipelines, trading floors)
      - Have a modern, corporate aesthetic
      - Be photorealistic style
      
      Return ONLY the image generation prompt, nothing else.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: type === 'content' ? 2000 : 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      content: generatedContent,
      type 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-blog-content:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
