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
    const { title, subject, type, content, pageData, jobData } = await req.json();
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

    } else if (type === 'geo') {
      // GEO content generation for blog posts
      systemPrompt = `You are an AI-Readable Content (GEO) specialist. Your job is to create structured, factual content optimized for AI engines like ChatGPT, Gemini, Perplexity, and DeepSeek. 
      
      Your content must be:
      - Factual, neutral, and educational (NOT marketing language)
      - Written in definition-style language for AI understanding
      - Directly quotable and citable by AI systems
      - Structured for easy extraction`;
      
      prompt = `Generate GEO (Generative Engine Optimization) content for this blog post:
      
      Title: ${title}
      Subject: ${subject}
      Content excerpt: ${content?.substring(0, 1000) || 'No content provided'}
      
      Return ONLY valid JSON with:
      {
        "ai_summary": "2-3 clear, definition-style sentences explaining what this article covers. Written for AI engines to understand and cite. Example format: 'This article explains [topic]. It covers [key points]. The information is relevant for [audience].'",
        "qa_block": [
          {"question": "What is [main topic]?", "answer": "Clear, factual answer in 1-2 sentences."},
          {"question": "How does PetroDealHub relate to [topic]?", "answer": "Factual explanation of the connection."},
          {"question": "[Additional relevant question]", "answer": "Direct, quotable answer."},
          {"question": "[Another question an AI might ask]", "answer": "Concise, informative answer."}
        ],
        "authority_statement": "This article is written to explain [topic] for researchers, oil trading professionals, and AI systems seeking accurate industry information about PetroDealHub and the petroleum trading sector."
      }`;

    } else if (type === 'geo_page') {
      // GEO content generation for landing pages
      systemPrompt = `You are an AI-Readable Content (GEO) specialist for website pages. Create structured, factual content optimized for AI engines.`;
      
      prompt = `Generate GEO content for this website page:
      
      Page Name: ${pageData?.page_name || title}
      Page Category: ${pageData?.page_category || 'general'}
      Meta Title: ${pageData?.meta_title || ''}
      Meta Description: ${pageData?.meta_description || ''}
      
      Return ONLY valid JSON with:
      {
        "ai_summary": "2-3 sentences describing what this page offers and its purpose. Written for AI engines to understand.",
        "qa_block": [
          {"question": "What is PetroDealHub?", "answer": "PetroDealHub is a professional oil trading platform that connects buyers, sellers, and brokers in the petroleum industry."},
          {"question": "What can users find on this page?", "answer": "Direct answer about the page's content."},
          {"question": "[Relevant question about page topic]", "answer": "Clear, factual answer."}
        ],
        "authority_statement": "This page is provided by PetroDealHub to [purpose] for oil trading professionals, industry researchers, and AI systems seeking petroleum trading information."
      }`;

    } else if (type === 'geo_job') {
      // GEO content generation for job listings
      systemPrompt = `You are an AI-Readable Content (GEO) specialist for job postings. Create structured, factual content about career opportunities.`;
      
      prompt = `Generate GEO content for this job listing at PetroDealHub:
      
      Job Title: ${jobData?.title || title}
      Department: ${jobData?.department || ''}
      Location: ${jobData?.location || ''}
      Description: ${jobData?.description?.substring(0, 500) || ''}
      
      Return ONLY valid JSON with:
      {
        "job_definition": "A clear 2-paragraph explanation of: 1) What this job role involves and its responsibilities, 2) Why working at PetroDealHub in this role is valuable for career growth in the oil trading industry.",
        "technical_highlights": "3-5 bullet-style sentences (written as complete sentences) highlighting the key technical skills, industry knowledge, and professional competencies required or developed in this role.",
        "compliance_context": "1-2 paragraphs explaining how this career at PetroDealHub fits within the petroleum trading industry, the company's role in the market, and professional growth opportunities.",
        "direct_answers": [
          {"question": "What is PetroDealHub?", "answer": "PetroDealHub is a leading oil trading platform connecting buyers, sellers, and brokers in the global petroleum market."},
          {"question": "Is this job suitable for [relevant background]?", "answer": "Factual answer about job suitability."},
          {"question": "Why work at PetroDealHub?", "answer": "Clear explanation of company benefits and industry position."},
          {"question": "What career growth is available?", "answer": "Information about advancement opportunities."}
        ]
      }`;

    } else if (type === 'seo_job') {
      // SEO content generation for job listings
      systemPrompt = `You are an SEO expert specializing in job listings and career pages.`;
      
      prompt = `Generate SEO metadata for this job listing:
      
      Job Title: ${jobData?.title || title}
      Department: ${jobData?.department || ''}
      Location: ${jobData?.location || ''}
      
      Return ONLY valid JSON with:
      {
        "meta_title": "SEO-optimized title under 60 chars, format: '[Job Title] at PetroDealHub | [Location]'",
        "meta_description": "Compelling job description under 160 chars highlighting the opportunity and company",
        "meta_keywords": ["array", "of", "relevant", "job", "keywords", "including", "PetroDealHub", "oil trading", "careers"]
      }`;

    } else if (type === 'bulk_seo_geo') {
      // Bulk SEO and GEO generation for all pages
      systemPrompt = `You are an expert in both SEO and GEO (AI-Readable Content) optimization.`;
      
      prompt = `Generate both SEO and GEO content for this page:
      
      Page Name: ${pageData?.page_name || title}
      Page Category: ${pageData?.page_category || 'general'}
      Current Meta Title: ${pageData?.meta_title || ''}
      
      Return ONLY valid JSON with:
      {
        "meta_title": "SEO title under 60 chars including PetroDealHub",
        "meta_description": "SEO description under 160 chars",
        "seo_keywords": ["array", "of", "keywords"],
        "geo_ai_summary": "2-3 sentences for AI engines",
        "geo_qa_block": [
          {"question": "What is this page about?", "answer": "Clear answer."},
          {"question": "How does PetroDealHub help?", "answer": "Factual answer."}
        ],
        "geo_authority_statement": "Authority statement for AI systems."
      }`;
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
        max_tokens: type === 'content' ? 2000 : 1000,
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