-- Add UUID columns to vessels table for proper foreign key relationships
-- This fixes the INTEGER vs UUID type mismatch between vessels and company tables

ALTER TABLE vessels 
ADD COLUMN IF NOT EXISTS buyer_company_uuid UUID REFERENCES buyer_companies(id) ON DELETE SET NULL;

ALTER TABLE vessels 
ADD COLUMN IF NOT EXISTS seller_company_uuid UUID REFERENCES seller_companies(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vessels_buyer_company_uuid ON vessels(buyer_company_uuid);
CREATE INDEX IF NOT EXISTS idx_vessels_seller_company_uuid ON vessels(seller_company_uuid);

-- Add comments for documentation
COMMENT ON COLUMN vessels.buyer_company_uuid IS 'UUID reference to buyer_companies table for proper foreign key relationship';
COMMENT ON COLUMN vessels.seller_company_uuid IS 'UUID reference to seller_companies table for proper foreign key relationship';