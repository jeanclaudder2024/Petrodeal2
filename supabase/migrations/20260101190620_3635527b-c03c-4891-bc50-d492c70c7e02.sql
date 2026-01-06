-- Create document_saved_templates table for template library
CREATE TABLE public.document_saved_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL,
  entity_types TEXT[] DEFAULT '{}',
  content TEXT NOT NULL,
  content_format TEXT DEFAULT 'html',
  placeholders TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_saved_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view public templates or their own
CREATE POLICY "Users can view public templates or own"
ON public.document_saved_templates
FOR SELECT
USING (is_public = true OR auth.uid() = created_by);

-- Policy: Users can create their own templates
CREATE POLICY "Users can create own templates"
ON public.document_saved_templates
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own templates
CREATE POLICY "Users can update own templates"
ON public.document_saved_templates
FOR UPDATE
USING (auth.uid() = created_by);

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete own templates"
ON public.document_saved_templates
FOR DELETE
USING (auth.uid() = created_by);

-- Policy: Admins can manage all templates
CREATE POLICY "Admins can manage all templates"
ON public.document_saved_templates
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_document_saved_templates_updated_at
  BEFORE UPDATE ON public.document_saved_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();