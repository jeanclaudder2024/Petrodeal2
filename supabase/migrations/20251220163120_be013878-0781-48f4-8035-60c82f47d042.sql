-- Add new columns to companies table for enhanced company management

-- Basic Info additions
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS trade_name text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_objective text;

-- Logo & Branding
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS director_photo_url text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS signatory_signature_url text;

-- Contact additions
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS official_email text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS operations_email text;

-- Legal & Representative Details
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS registration_country text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS legal_address text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS representative_name text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS representative_title text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS passport_number text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS passport_country text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS representative_email text;

-- Refinery & Supply Details (Seller Only)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_refinery_owner boolean DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS refinery_name text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS refinery_location text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS refinery_capacity_bpd integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS products_supplied text[];
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS loading_ports text[];

-- Compliance & KYC
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'pending';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS sanctions_status text DEFAULT 'pending';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country_risk text DEFAULT 'low';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS compliance_notes text;

-- Business Details additions
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS primary_activity text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS trading_regions text[];

-- Update company_type to support new types
-- First update existing 'fake' values to 'buyer_test'
UPDATE public.companies SET company_type = 'buyer_test' WHERE company_type = 'fake';

-- Create company_bank_accounts table for multiple bank accounts
CREATE TABLE IF NOT EXISTS public.company_bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id integer NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  bank_address text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  iban text NOT NULL,
  swift_code text NOT NULL,
  beneficiary_address text NOT NULL,
  currency text DEFAULT 'USD',
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on bank accounts table
ALTER TABLE public.company_bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank accounts - Admin only access
CREATE POLICY "Admins can manage company bank accounts"
ON public.company_bank_accounts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_bank_accounts_company_id ON public.company_bank_accounts(company_id);

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_company_bank_accounts_updated_at
BEFORE UPDATE ON public.company_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();