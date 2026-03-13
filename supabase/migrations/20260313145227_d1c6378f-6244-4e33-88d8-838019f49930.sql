
-- Add broker_unique_id column
ALTER TABLE public.broker_profiles ADD COLUMN IF NOT EXISTS broker_unique_id TEXT UNIQUE;

-- Function to generate sequential broker IDs
CREATE OR REPLACE FUNCTION public.generate_broker_unique_id()
RETURNS TRIGGER AS $$
DECLARE seq_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(broker_unique_id, '[^0-9]', '', 'g'), '')::INTEGER
  ), 0) + 1 INTO seq_num FROM public.broker_profiles WHERE broker_unique_id IS NOT NULL;
  NEW.broker_unique_id := 'PDH-BRK-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger on insert
DROP TRIGGER IF EXISTS set_broker_unique_id ON public.broker_profiles;
CREATE TRIGGER set_broker_unique_id
BEFORE INSERT ON public.broker_profiles
FOR EACH ROW
WHEN (NEW.broker_unique_id IS NULL)
EXECUTE FUNCTION public.generate_broker_unique_id();

-- Backfill existing brokers
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM public.broker_profiles
  WHERE broker_unique_id IS NULL
)
UPDATE public.broker_profiles
SET broker_unique_id = 'PDH-BRK-' || LPAD(numbered.rn::TEXT, 6, '0')
FROM numbered
WHERE public.broker_profiles.id = numbered.id;

-- Create broker_company_verifications table
CREATE TABLE IF NOT EXISTS public.broker_company_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES public.broker_profiles(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  years_working INTEGER,
  supporting_document_url TEXT,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(broker_id, company_id)
);

-- Enable RLS
ALTER TABLE public.broker_company_verifications ENABLE ROW LEVEL SECURITY;

-- Brokers can view their own verifications
CREATE POLICY "Brokers can view own verifications"
ON public.broker_company_verifications
FOR SELECT
TO authenticated
USING (
  broker_id IN (SELECT id FROM public.broker_profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Brokers can insert their own verifications
CREATE POLICY "Brokers can request verifications"
ON public.broker_company_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  broker_id IN (SELECT id FROM public.broker_profiles WHERE user_id = auth.uid())
);

-- Admins can update verifications
CREATE POLICY "Admins can manage verifications"
ON public.broker_company_verifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete verifications
CREATE POLICY "Admins can delete verifications"
ON public.broker_company_verifications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Updated at trigger
CREATE TRIGGER update_broker_company_verifications_updated_at
BEFORE UPDATE ON public.broker_company_verifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('broker-verifications', 'broker-verifications', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Brokers can upload verification docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'broker-verifications' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Brokers can view own verification docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'broker-verifications' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all verification docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'broker-verifications' AND public.has_role(auth.uid(), 'admin'::app_role));
