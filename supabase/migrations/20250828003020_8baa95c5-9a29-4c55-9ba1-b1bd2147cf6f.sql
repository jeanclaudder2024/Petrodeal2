-- Update RLS policy to show all active documents to authenticated users
DROP POLICY IF EXISTS "Users can view documents based on subscription" ON vessel_documents;

CREATE POLICY "Users can view all active documents" 
ON vessel_documents 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Add broker_membership_required column to vessel_documents
ALTER TABLE vessel_documents 
ADD COLUMN IF NOT EXISTS broker_membership_required boolean NOT NULL DEFAULT false;