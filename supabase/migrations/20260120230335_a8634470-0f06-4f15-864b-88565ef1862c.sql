-- Add GEO columns to blog_posts table
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS geo_ai_summary TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS geo_qa_block JSONB DEFAULT '[]';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS geo_authority_statement TEXT;

-- Add GEO columns to cms_page_content table
ALTER TABLE cms_page_content ADD COLUMN IF NOT EXISTS geo_ai_summary TEXT;
ALTER TABLE cms_page_content ADD COLUMN IF NOT EXISTS geo_qa_block JSONB DEFAULT '[]';
ALTER TABLE cms_page_content ADD COLUMN IF NOT EXISTS geo_authority_statement TEXT;

-- Add SEO and GEO columns to job_listings table
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS meta_keywords TEXT[];
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS geo_job_definition TEXT;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS geo_technical_highlights TEXT;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS geo_compliance_context TEXT;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS geo_direct_answers JSONB DEFAULT '[]';