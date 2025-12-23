-- Create IMFPA Agreements table
CREATE TABLE public.imfpa_agreements (
  imfpa_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES broker_deals(id) ON DELETE CASCADE,
  imfpa_reference_code TEXT UNIQUE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'completed', 'cancelled')),
  
  -- Broker info
  broker_role TEXT CHECK (broker_role IN ('mandate_holder', 'introducing_broker', 'co_broker')),
  broker_entity_name TEXT,
  broker_registration_country TEXT,
  broker_company_number TEXT,
  
  -- Seller/Buyer (locked until deal step 8)
  seller_entity_name TEXT,
  buyer_entity_name TEXT,
  
  -- Commission & payment
  commodity_type TEXT,
  commission_type TEXT CHECK (commission_type IN ('per_bbl', 'percentage', 'lump_sum')),
  commission_value NUMERIC,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT CHECK (payment_method IN ('mt103', 'split_payment', 'escrow', 'paymaster')),
  payment_trigger TEXT CHECK (payment_trigger IN ('upon_spa_signature', 'upon_lc_issuance', 'upon_bl_release', 'upon_sgs_confirmation')),
  
  -- Banking
  bank_name TEXT,
  bank_swift TEXT,
  beneficiary_account_masked TEXT,
  
  -- Validity & legal
  valid_from DATE,
  valid_until DATE,
  governing_law TEXT,
  jurisdiction TEXT,
  
  -- Signatures
  signed_by_broker BOOLEAN DEFAULT false,
  signed_by_seller BOOLEAN DEFAULT false,
  signed_by_buyer BOOLEAN DEFAULT false,
  signature_hash TEXT,
  document_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.imfpa_agreements ENABLE ROW LEVEL SECURITY;

-- Brokers can view their own IMFPA agreements
CREATE POLICY "Brokers can view their own IMFPAs"
ON public.imfpa_agreements
FOR SELECT
USING (
  deal_id IN (
    SELECT bd.id FROM broker_deals bd
    JOIN broker_profiles bp ON bd.broker_id = bp.id
    WHERE bp.user_id = auth.uid()
  )
);

-- Brokers can create their own IMFPA agreements
CREATE POLICY "Brokers can create IMFPAs"
ON public.imfpa_agreements
FOR INSERT
WITH CHECK (
  deal_id IN (
    SELECT bd.id FROM broker_deals bd
    JOIN broker_profiles bp ON bd.broker_id = bp.id
    WHERE bp.user_id = auth.uid()
  )
);

-- Brokers can update their own IMFPA agreements
CREATE POLICY "Brokers can update their own IMFPAs"
ON public.imfpa_agreements
FOR UPDATE
USING (
  deal_id IN (
    SELECT bd.id FROM broker_deals bd
    JOIN broker_profiles bp ON bd.broker_id = bp.id
    WHERE bp.user_id = auth.uid()
  )
);

-- Admins can manage all IMFPA agreements
CREATE POLICY "Admins can manage all IMFPAs"
ON public.imfpa_agreements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_imfpa_agreements_updated_at
BEFORE UPDATE ON public.imfpa_agreements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();