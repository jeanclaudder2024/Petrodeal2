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
    const { title, subject, type, content, pageData, jobData, category } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt = '';
    let systemPrompt = '';

    // Helper function to clean HTML content
    const cleanHTMLContent = (content: string): string => {
      let cleaned = content;
      // Remove markdown code fences
      cleaned = cleaned.replace(/^```html\s*/gi, '');
      cleaned = cleaned.replace(/^```\s*/gi, '');
      cleaned = cleaned.replace(/```\s*$/gi, '');
      // Remove full HTML document wrapper if present
      cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/gi, '');
      cleaned = cleaned.replace(/<html[^>]*>/gi, '');
      cleaned = cleaned.replace(/<\/html>/gi, '');
      cleaned = cleaned.replace(/<head>[\s\S]*?<\/head>/gi, '');
      cleaned = cleaned.replace(/<body[^>]*>/gi, '');
      cleaned = cleaned.replace(/<\/body>/gi, '');
      return cleaned.trim();
    };

    // Get category-specific instructions and structure
    const getCategorySpecificPrompt = (categoryName: string | null) => {
      const normalizedCategory = categoryName?.toLowerCase()?.trim() || '';
      
      switch (normalizedCategory) {
        case 'deal strategies':
          return {
            instructions: `
CATEGORY: DEAL STRATEGIES
- Focus on strategic oil deal structuring and negotiation logic
- Present at least one realistic deal scenario with specific details
- Explain step-by-step strategic decision-making process
- Identify commercial, legal, and operational risks
- Reference key documents: SPA (Sales Purchase Agreement), LC (Letter of Credit), SGS (inspection), POP (Proof of Product), B/L (Bill of Lading), NCNDA, IMFPA
- Emphasize risk mitigation and deal protection strategies
- Show how structured intelligence platforms like PetroDealHub support informed deal execution
`,
            structure: `
REQUIRED STRUCTURE (use these as <h2> headings):
1. Strategic Context - Set the stage for why this deal strategy matters
2. Deal Scenario - Present a realistic example with quantities, pricing, and parties
3. Strategy Breakdown - Step-by-step analysis of the approach
4. Risk & Mitigation - Identify risks and protective measures
5. Institutional Execution Logic - How professional traders execute this
6. Conclusion - Key takeaways and strategic recommendations
`
          };
          
        case 'industry insights':
          return {
            instructions: `
CATEGORY: INDUSTRY INSIGHTS
- Write from an insider, industry-wide perspective
- Discuss oil refineries, major oil companies, and supply chains
- Reference upstream (exploration/production), midstream (transport), and downstream (refining/distribution) operations
- Include geographic and capacity-based insights (specific regions, refinery capacities in bpd)
- Demonstrate how industry intelligence connects refineries, companies, and markets
- Position PetroDealHub as an intelligence bridge across the industry ecosystem
`,
            structure: `
REQUIRED STRUCTURE (use these as <h2> headings):
1. Industry Overview - Current state of the sector
2. Key Players & Infrastructure - Major companies, refineries, and facilities
3. Operational Dynamics - How the industry operates day-to-day
4. Market Interconnections - How different parts of the value chain interact
5. Intelligence & Visibility Role - Why transparency and data matter
6. Conclusion & References - Summary with industry references
`
          };
          
        case 'market analysis':
          return {
            instructions: `
CATEGORY: MARKET ANALYSIS
- Use data-driven, analytical language throughout
- Include numerical data, trends, and specific timeframes
- Add tables for data comparisons (use HTML <table> tags)
- Analyze price movements, trading volumes, and market scenarios
- Interpret data for decision-making purposes
- Explain how intelligence platforms translate data into strategic insight
- Reference Brent, WTI, OPEC+ decisions, and regional price differentials
`,
            structure: `
REQUIRED STRUCTURE (use these as <h2> headings):
1. Market Snapshot - Current market conditions with key figures
2. Data Analysis - In-depth analysis of trends and indicators
3. Tables & Charts Section - Include at least one HTML table with market data
4. Scenario Interpretation - What different scenarios mean for traders
5. Strategic Implications - How to act on this analysis
6. Conclusion & References - Summary with data sources
`
          };
          
        case 'oil trading':
          return {
            instructions: `
CATEGORY: OIL TRADING
- Maintain strict professional and compliance-oriented tone
- Reference international standards and institutions: SGS, ICC (International Chamber of Commerce), Incoterms (CIF, FOB, DES, CFR)
- Explain documentation flows and legal frameworks in detail
- Highlight common trading risks and compliance failures
- Show how structured trading intelligence enhances trust and execution quality
- Reference banking instruments: LC, SBLC, DLC, MT799, MT760
`,
            structure: `
REQUIRED STRUCTURE (use these as <h2> headings):
1. Trading Framework - Overview of the trading structure
2. Institutional Standards - SGS, ICC, Incoterms requirements
3. Documentation Flow - Step-by-step document sequence
4. Risk & Compliance - Legal and operational risks
5. Professional Execution Model - Best practices for execution
6. Conclusion & References - Summary with institutional references
`
          };
          
        case 'platform updates':
          return {
            instructions: `
CATEGORY: PLATFORM UPDATES
- Write with transparency and institutional clarity
- Explain platform updates as infrastructure improvements
- Focus on user value, trust, and reliability
- Include real-world use cases or operational benefits
- Reference compliance alignment and industry credibility
- Show how PetroDealHub strengthens secure deal environments
`,
            structure: `
REQUIRED STRUCTURE (use these as <h2> headings):
1. Update Overview - What has changed and why
2. Why It Matters - The significance of this update
3. User Impact - How users benefit from these changes
4. Trust & Compliance Alignment - Security and regulatory aspects
5. Platform Vision - Future direction and goals
6. Conclusion, Proof & References - Summary with evidence
`
          };
          
        default:
          return {
            instructions: `
Apply general professional oil industry writing standards.
- Cover the topic comprehensively with industry expertise
- Include relevant data points and examples
- Maintain authoritative, institutional tone
`,
            structure: `
Use logical sections with clear headings:
- Introduction and context
- Main analysis or explanation
- Key considerations and implications
- Conclusion with actionable insights
`
          };
      }
    };

    if (type === 'content') {
      const categoryPrompt = getCategorySpecificPrompt(category);
      
      systemPrompt = `You are writing a professional, authoritative blog article for an oil & energy intelligence platform named "PetroDealHub".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERAL RULES (APPLY TO ALL CATEGORIES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Write in clear, professional, industry-grade language matching the title language
- Do NOT use marketing or promotional language - no hype, no buzzwords
- The article must read as expert analysis, not advertising - write as a human expert
- PetroDealHub must be integrated naturally as part of the solution ecosystem (1-2 mentions maximum), never as an ad
- Use realistic industry terminology and professional formatting
- Length: 1,300–1,900 words (this is critical)
- Include subheadings, logical flow, and strong conclusions
- Where appropriate, include tables, structured lists, or analytical summaries
- Tone: confident, institutional, credible - like a report from a senior analyst

${categoryPrompt.instructions}

${categoryPrompt.structure}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HTML FORMATTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Use <h2> for main section headings (use the structure above)
- Use <h3> for subsections within main sections
- Use <p> for paragraphs
- Use <table class="comparison-table"> for data tables with <thead> and <tbody>
- Use <blockquote class="expert-quote"> for important insights
- Use <ul class="benefit-list"> or <ol> for structured lists
- Use <strong> for emphasis on key terms
- Return ONLY clean HTML content - NO markdown code blocks, NO DOCTYPE, NO html/head/body tags
- Start directly with the first content element`;
      
      prompt = `Write a comprehensive, professional blog article about: "${subject}"

Title: ${title}
${category ? `Category: ${category}` : ''}

Create an authoritative article following the category-specific structure and guidelines provided. 

Remember:
- Write as a senior industry analyst, not AI
- Use specific data, examples, and references
- Maintain institutional credibility throughout
- 1,300-1,900 words minimum
- Return ONLY clean HTML (no code blocks, no document wrappers)`;

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
        max_tokens: type === 'content' ? 4000 : 1000,
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
