-- Create vessel documents table
CREATE TABLE public.vessel_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  ai_prompt TEXT NOT NULL,
  subscription_level TEXT NOT NULL DEFAULT 'basic', -- basic, premium, enterprise
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.vessel_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for vessel documents
CREATE POLICY "Admins can manage all documents" 
ON public.vessel_documents 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view documents based on subscription" 
ON public.vessel_documents 
FOR SELECT 
USING (
  is_active = true AND (
    subscription_level = 'basic' OR
    (subscription_level = 'premium' AND EXISTS (
      SELECT 1 FROM subscribers 
      WHERE user_id = auth.uid() 
      AND subscribed = true 
      AND subscription_tier IN ('premium', 'enterprise')
    )) OR
    (subscription_level = 'enterprise' AND EXISTS (
      SELECT 1 FROM subscribers 
      WHERE user_id = auth.uid() 
      AND subscribed = true 
      AND subscription_tier = 'enterprise'
    ))
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_vessel_documents_updated_at
  BEFORE UPDATE ON public.vessel_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for document generation logs
CREATE TABLE public.document_generation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  document_id UUID REFERENCES public.vessel_documents(id),
  vessel_id INTEGER REFERENCES public.vessels(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  file_size INTEGER,
  error_message TEXT
);

-- Enable RLS on logs
ALTER TABLE public.document_generation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for logs
CREATE POLICY "Users can view their own generation logs" 
ON public.document_generation_logs 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all generation logs" 
ON public.document_generation_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert generation logs" 
ON public.document_generation_logs 
FOR INSERT 
WITH CHECK (true);