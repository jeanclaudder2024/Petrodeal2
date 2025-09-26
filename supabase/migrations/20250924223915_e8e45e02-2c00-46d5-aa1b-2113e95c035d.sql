-- Create document templates table for Word document processing
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  placeholders JSONB DEFAULT '[]'::jsonb, -- Array of placeholders found in document
  field_mappings JSONB DEFAULT '{}'::jsonb, -- Mapping of placeholders to database fields
  analysis_result JSONB DEFAULT '{}'::jsonb, -- Analysis of what matches database
  subscription_level TEXT DEFAULT 'basic',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage all document templates" 
ON public.document_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public viewing for active templates
CREATE POLICY "Anyone can view active document templates" 
ON public.document_templates 
FOR SELECT 
USING (is_active = true);

-- Create processed documents table to track document generation
CREATE TABLE public.processed_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.document_templates(id),
  vessel_id INTEGER,
  port_id INTEGER,
  refinery_id UUID,
  company_id INTEGER,
  generated_file_url TEXT,
  processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  placeholders_filled JSONB DEFAULT '{}'::jsonb, -- What data was filled
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.processed_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own processed documents
CREATE POLICY "Users can view their own processed documents" 
ON public.processed_documents 
FOR SELECT 
USING (created_by = auth.uid());

-- Users can create processed documents
CREATE POLICY "Users can create processed documents" 
ON public.processed_documents 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- Admins can manage all
CREATE POLICY "Admins can manage all processed documents" 
ON public.processed_documents 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update triggers
CREATE TRIGGER update_document_templates_updated_at
BEFORE UPDATE ON public.document_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();