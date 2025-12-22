-- Add new columns to vessels table for the comprehensive vessel/tanker structure

-- Section 5: Cargo Information (New Fields)
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS commodity_name TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS commodity_category TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS hs_code TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS cargo_origin_country TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS source_refinery TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS sanctions_status TEXT DEFAULT 'non-sanctioned';
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS min_quantity NUMERIC;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS max_quantity NUMERIC;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS quantity_unit TEXT DEFAULT 'MT';
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS total_shipment_quantity NUMERIC;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS quality_specification TEXT;

-- Section 6: Commercial Parties (New Fields with FK references)
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS buyer_company_id INTEGER REFERENCES public.companies(id);
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS seller_company_id INTEGER REFERENCES public.companies(id);
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS commodity_source_company_id INTEGER REFERENCES public.companies(id);

-- Section 7: Deal & Commercial Terms (New Section)
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS deal_reference_id TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS deal_status TEXT DEFAULT 'open';
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS contract_type TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS delivery_terms TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'Vessel';
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS price_basis TEXT DEFAULT 'TBD';
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS benchmark_reference TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS indicative_price NUMERIC;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS price_notes TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS payment_timing TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS payment_notes TEXT;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS voyage_status TEXT DEFAULT 'planned';
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS voyage_notes TEXT;

-- Additional Fields
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS ai_autofill_source TEXT DEFAULT 'manual';
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS cargo_capacity_bbl INTEGER;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS service_speed NUMERIC;
ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS discharge_port TEXT;

-- Create index for deal_reference_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_vessels_deal_reference ON public.vessels(deal_reference_id);

-- Create index for sanctions_status for filtering
CREATE INDEX IF NOT EXISTS idx_vessels_sanctions_status ON public.vessels(sanctions_status);

-- Create index for deal_status for filtering
CREATE INDEX IF NOT EXISTS idx_vessels_deal_status ON public.vessels(deal_status);