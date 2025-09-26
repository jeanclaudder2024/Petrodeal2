-- Fix RLS policies for deal_steps table - brokers need to be able to insert and update their own deal steps

-- Add INSERT policy for brokers to create deal steps for their own deals
CREATE POLICY "Brokers can insert deal steps for their own deals" 
ON public.deal_steps 
FOR INSERT 
TO authenticated
WITH CHECK (deal_id IN (
  SELECT bd.id 
  FROM broker_deals bd
  JOIN broker_profiles bp ON bd.broker_id = bp.id
  WHERE bp.user_id = auth.uid()
));

-- Add UPDATE policy for brokers to update deal steps for their own deals
CREATE POLICY "Brokers can update deal steps for their own deals" 
ON public.deal_steps 
FOR UPDATE 
TO authenticated
USING (deal_id IN (
  SELECT bd.id 
  FROM broker_deals bd
  JOIN broker_profiles bp ON bd.broker_id = bp.id
  WHERE bp.user_id = auth.uid()
))
WITH CHECK (deal_id IN (
  SELECT bd.id 
  FROM broker_deals bd
  JOIN broker_profiles bp ON bd.broker_id = bp.id
  WHERE bp.user_id = auth.uid()
));

-- Ensure broker-documents storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('broker-documents', 'broker-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for broker-documents bucket (only if they don't exist)
DO $$
BEGIN
  -- Check and create upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Brokers can upload documents for their deals'
  ) THEN
    CREATE POLICY "Brokers can upload documents for their deals" 
    ON storage.objects 
    FOR INSERT 
    TO authenticated
    WITH CHECK (
      bucket_id = 'broker-documents' AND
      auth.uid() IN (
        SELECT bp.user_id 
        FROM broker_profiles bp
        WHERE bp.user_id = auth.uid()
      )
    );
  END IF;

  -- Check and create view policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Brokers can view documents for their deals'
  ) THEN
    CREATE POLICY "Brokers can view documents for their deals" 
    ON storage.objects 
    FOR SELECT 
    TO authenticated
    USING (
      bucket_id = 'broker-documents' AND (
        auth.uid() IN (
          SELECT bp.user_id 
          FROM broker_profiles bp
          WHERE bp.user_id = auth.uid()
        ) OR
        has_role(auth.uid(), 'admin'::app_role)
      )
    );
  END IF;

  -- Check and create update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Brokers can update documents for their deals'
  ) THEN
    CREATE POLICY "Brokers can update documents for their deals" 
    ON storage.objects 
    FOR UPDATE 
    TO authenticated
    USING (
      bucket_id = 'broker-documents' AND
      auth.uid() IN (
        SELECT bp.user_id 
        FROM broker_profiles bp
        WHERE bp.user_id = auth.uid()
      )
    );
  END IF;
END $$;