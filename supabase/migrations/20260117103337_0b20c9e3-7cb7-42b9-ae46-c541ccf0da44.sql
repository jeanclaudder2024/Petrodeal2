-- Add missing columns to broker_deals table
ALTER TABLE broker_deals ADD COLUMN IF NOT EXISTS seller_company_name TEXT;
ALTER TABLE broker_deals ADD COLUMN IF NOT EXISTS buyer_company_name TEXT;
ALTER TABLE broker_deals ADD COLUMN IF NOT EXISTS broker_role TEXT DEFAULT 'mandate';
ALTER TABLE broker_deals ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'protected';
ALTER TABLE broker_deals ADD COLUMN IF NOT EXISTS price_basis TEXT;
ALTER TABLE broker_deals ADD COLUMN IF NOT EXISTS pricing_formula TEXT;
ALTER TABLE broker_deals ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE broker_deals ADD COLUMN IF NOT EXISTS laycan_start DATE;
ALTER TABLE broker_deals ADD COLUMN IF NOT EXISTS laycan_end DATE;
ALTER TABLE broker_deals ADD COLUMN IF NOT EXISTS deal_validity TIMESTAMPTZ;

-- Create trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION public.update_broker_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_broker_deals_timestamp ON broker_deals;
CREATE TRIGGER update_broker_deals_timestamp
BEFORE UPDATE ON broker_deals
FOR EACH ROW
EXECUTE FUNCTION public.update_broker_deals_updated_at();