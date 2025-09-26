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

-- Create policies for word document templates
CREATE POLICY "Admins can manage word templates" 
ON public.word_document_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active word templates" 
ON public.word_document_templates 
FOR SELECT 
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_word_templates_updated_at
BEFORE UPDATE ON public.word_document_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();