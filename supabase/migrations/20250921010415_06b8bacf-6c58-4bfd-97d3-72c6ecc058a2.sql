-- Create table for Word document templates
CREATE TABLE public.word_document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  tags_found TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.word_document_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all word templates" 
ON public.word_document_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active word templates" 
ON public.word_document_templates 
FOR SELECT 
USING (is_active = true);

-- Add word_template_id to vessel_documents table
ALTER TABLE public.vessel_documents 
ADD COLUMN word_template_id UUID REFERENCES public.word_document_templates(id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_word_templates_updated_at
BEFORE UPDATE ON public.word_document_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for word templates
INSERT INTO storage.buckets (id, name, public) VALUES ('word-templates', 'word-templates', false);

-- Create storage policies for word templates
CREATE POLICY "Admins can upload word templates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'word-templates' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view word templates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'word-templates' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update word templates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'word-templates' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete word templates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'word-templates' AND has_role(auth.uid(), 'admin'::app_role));