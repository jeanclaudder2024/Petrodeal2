-- =====================================================
-- BUYER COMPANIES TABLE (Admin-only)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.buyer_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trade_name TEXT,
  logo_url TEXT,
  director_photo_url TEXT,
  signatory_signature_url TEXT,
  description TEXT,
  company_objective TEXT,
  website TEXT,
  email TEXT,
  official_email TEXT,
  operations_email TEXT,
  phone TEXT,
  address TEXT,
  country TEXT,
  city TEXT,
  industry TEXT,
  employees_count INTEGER,
  annual_revenue NUMERIC,
  founded_year INTEGER,
  is_verified BOOLEAN DEFAULT false,
  primary_activity TEXT,
  trading_regions TEXT[],
  registration_number TEXT,
  registration_country TEXT,
  legal_address TEXT,
  representative_name TEXT,
  representative_title TEXT,
  passport_number TEXT,
  passport_country TEXT,
  representative_email TEXT,
  kyc_status TEXT DEFAULT 'pending',
  sanctions_status TEXT DEFAULT 'pending',
  country_risk TEXT DEFAULT 'low',
  compliance_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.buyer_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to buyer_companies" ON public.buyer_companies
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- SELLER COMPANIES TABLE (Admin-only)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.seller_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trade_name TEXT,
  logo_url TEXT,
  director_photo_url TEXT,
  signatory_signature_url TEXT,
  description TEXT,
  company_objective TEXT,
  website TEXT,
  email TEXT,
  official_email TEXT,
  operations_email TEXT,
  phone TEXT,
  address TEXT,
  country TEXT,
  city TEXT,
  industry TEXT,
  employees_count INTEGER,
  annual_revenue NUMERIC,
  founded_year INTEGER,
  is_verified BOOLEAN DEFAULT false,
  primary_activity TEXT,
  trading_regions TEXT[],
  registration_number TEXT,
  registration_country TEXT,
  legal_address TEXT,
  representative_name TEXT,
  representative_title TEXT,
  passport_number TEXT,
  passport_country TEXT,
  representative_email TEXT,
  is_refinery_owner BOOLEAN DEFAULT false,
  refinery_name TEXT,
  refinery_location TEXT,
  refinery_capacity_bpd INTEGER,
  products_supplied TEXT[],
  loading_ports TEXT[],
  kyc_status TEXT DEFAULT 'pending',
  sanctions_status TEXT DEFAULT 'pending',
  country_risk TEXT DEFAULT 'low',
  compliance_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to seller_companies" ON public.seller_companies
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- BUYER COMPANY BANK ACCOUNTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.buyer_company_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.buyer_companies(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  bank_address TEXT,
  account_name TEXT NOT NULL,
  account_number TEXT,
  iban TEXT,
  swift_code TEXT,
  beneficiary_address TEXT,
  currency TEXT DEFAULT 'USD',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.buyer_company_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to buyer_company_bank_accounts" ON public.buyer_company_bank_accounts
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- SELLER COMPANY BANK ACCOUNTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.seller_company_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.seller_companies(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  bank_address TEXT,
  account_name TEXT NOT NULL,
  account_number TEXT,
  iban TEXT,
  swift_code TEXT,
  beneficiary_address TEXT,
  currency TEXT DEFAULT 'USD',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_company_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to seller_company_bank_accounts" ON public.seller_company_bank_accounts
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- OIL PRODUCTS TABLE (Admin-only)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.oil_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT UNIQUE,
  commodity_name TEXT NOT NULL,
  commodity_type TEXT,
  grade TEXT,
  sulphur_content_ppm INTEGER,
  origin TEXT,
  origin_country TEXT,
  destination_ports TEXT[],
  loading_ports TEXT[],
  discharge_ports TEXT[],
  quantity_min_mt NUMERIC,
  quantity_max_mt NUMERIC,
  quantity_unit TEXT DEFAULT 'MT',
  contract_type TEXT,
  contract_duration_months INTEGER,
  option_months INTEGER,
  delivery_terms TEXT,
  incoterms TEXT,
  price_type TEXT,
  price_basis TEXT,
  price_reference TEXT,
  premium_discount NUMERIC,
  currency TEXT DEFAULT 'USD',
  payment_terms TEXT,
  payment_condition TEXT,
  payment_days INTEGER,
  density_kg_m3 NUMERIC,
  flash_point_min_c NUMERIC,
  viscosity_cst NUMERIC,
  cetane_number_min NUMERIC,
  cloud_point_c NUMERIC,
  pour_point_c NUMERIC,
  water_content_max_ppm NUMERIC,
  ash_content_max NUMERIC,
  carbon_residue_max NUMERIC,
  distillation_range TEXT,
  color_max NUMERIC,
  oxidation_stability NUMERIC,
  lubricity_um NUMERIC,
  fame_content_max NUMERIC,
  test_method TEXT,
  lab_name TEXT,
  lab_certificate_url TEXT,
  analysis_date DATE,
  q88_document_url TEXT,
  msds_url TEXT,
  coa_url TEXT,
  refinery_id UUID REFERENCES public.refineries(id),
  supplier_company_id UUID REFERENCES public.seller_companies(id),
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'available',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.oil_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to oil_products" ON public.oil_products
  FOR ALL USING (public.is_admin(auth.uid()));

-- Triggers
CREATE TRIGGER update_buyer_companies_updated_at BEFORE UPDATE ON public.buyer_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seller_companies_updated_at BEFORE UPDATE ON public.seller_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_buyer_company_bank_accounts_updated_at BEFORE UPDATE ON public.buyer_company_bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seller_company_bank_accounts_updated_at BEFORE UPDATE ON public.seller_company_bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_oil_products_updated_at BEFORE UPDATE ON public.oil_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_buyer_companies_name ON public.buyer_companies(name);
CREATE INDEX IF NOT EXISTS idx_buyer_companies_country ON public.buyer_companies(country);
CREATE INDEX IF NOT EXISTS idx_seller_companies_name ON public.seller_companies(name);
CREATE INDEX IF NOT EXISTS idx_seller_companies_country ON public.seller_companies(country);
CREATE INDEX IF NOT EXISTS idx_oil_products_commodity_type ON public.oil_products(commodity_type);
CREATE INDEX IF NOT EXISTS idx_oil_products_status ON public.oil_products(status);
CREATE INDEX IF NOT EXISTS idx_oil_products_supplier ON public.oil_products(supplier_company_id);