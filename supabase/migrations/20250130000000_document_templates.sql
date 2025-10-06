-- Drop existing tables if they exist (to handle schema changes)
DROP TABLE IF EXISTS processed_documents CASCADE;
DROP TABLE IF EXISTS document_templates CASCADE;

-- Note: Assuming vessels table exists with integer id column
-- If your vessels table has a different structure, adjust the foreign key accordingly

-- Create document templates table
CREATE TABLE document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_file BYTEA NOT NULL, -- Store the actual .docx file
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    placeholders JSONB DEFAULT '[]'::jsonb, -- Array of placeholder names found in template
    placeholder_mappings JSONB DEFAULT '{}'::jsonb, -- Mapping of placeholders to data sources
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create processed documents table
CREATE TABLE processed_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES document_templates(id) ON DELETE CASCADE,
    vessel_id INTEGER, -- Will add foreign key constraint after confirming vessels table structure
    vessel_imo VARCHAR(50),
    processed_file BYTEA, -- Store the processed .docx file
    pdf_file BYTEA, -- Store the processed PDF file
    file_name VARCHAR(255) NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    processing_log TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_document_templates_active ON document_templates(is_active);
CREATE INDEX idx_document_templates_created_by ON document_templates(created_by);
CREATE INDEX idx_processed_documents_template_id ON processed_documents(template_id);
CREATE INDEX idx_processed_documents_vessel_id ON processed_documents(vessel_id);
CREATE INDEX idx_processed_documents_status ON processed_documents(processing_status);

-- Enable Row Level Security
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_templates
DROP POLICY IF EXISTS "Users can view active templates" ON document_templates;
CREATE POLICY "Users can view active templates" ON document_templates
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can create templates" ON document_templates;
CREATE POLICY "Authenticated users can create templates" ON document_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own templates" ON document_templates;
CREATE POLICY "Users can update their own templates" ON document_templates
    FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own templates" ON document_templates;
CREATE POLICY "Users can delete their own templates" ON document_templates
    FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for processed_documents
DROP POLICY IF EXISTS "Users can view their own processed documents" ON processed_documents;
CREATE POLICY "Users can view their own processed documents" ON processed_documents
    FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can create processed documents" ON processed_documents;
CREATE POLICY "Authenticated users can create processed documents" ON processed_documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own processed documents" ON processed_documents;
CREATE POLICY "Users can update their own processed documents" ON processed_documents
    FOR UPDATE USING (auth.uid() = created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_document_templates_updated_at ON document_templates;
CREATE TRIGGER update_document_templates_updated_at 
    BEFORE UPDATE ON document_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to extract placeholders from template
CREATE OR REPLACE FUNCTION extract_template_placeholders(template_content BYTEA)
RETURNS TEXT[] AS $$
DECLARE
    placeholders TEXT[];
BEGIN
    -- This is a placeholder function - in practice, you'd need to implement
    -- actual .docx parsing logic here or handle it in the application layer
    RETURN ARRAY[]::TEXT[];
END;
$$ LANGUAGE plpgsql;

-- Sample template insertion removed to avoid conflicts
-- You can add sample data through the admin panel or API after the migration is complete

-- TODO: Add foreign key constraint for vessel_id after confirming vessels table structure
-- ALTER TABLE processed_documents ADD CONSTRAINT fk_processed_documents_vessel_id 
-- FOREIGN KEY (vessel_id) REFERENCES vessels(id) ON DELETE CASCADE;
