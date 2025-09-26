-- Add vessel-specific document prompt customization
CREATE TABLE IF NOT EXISTS public.vessel_document_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id INTEGER NOT NULL,
  document_id UUID NOT NULL REFERENCES public.vessel_documents(id),
  custom_prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  UNIQUE(vessel_id, document_id)
);

-- Enable RLS
ALTER TABLE public.vessel_document_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view vessel document prompts" 
  ON public.vessel_document_prompts 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create vessel document prompts" 
  ON public.vessel_document_prompts 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vessel document prompts" 
  ON public.vessel_document_prompts 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Authenticated users can delete vessel document prompts" 
  ON public.vessel_document_prompts 
  FOR DELETE 
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_vessel_document_prompts_updated_at
  BEFORE UPDATE ON public.vessel_document_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();