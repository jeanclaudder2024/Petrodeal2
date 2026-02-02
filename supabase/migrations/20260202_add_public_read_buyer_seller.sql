-- =====================================================
-- ADD PUBLIC READ ACCESS FOR DOCUMENT PROCESSOR
-- This allows the document processor API to read from
-- buyer_companies and seller_companies tables
-- =====================================================

-- Allow public read access to buyer_companies
CREATE POLICY "Allow public read access to buyer_companies" 
ON public.buyer_companies
FOR SELECT 
USING (true);

-- Allow public read access to seller_companies
CREATE POLICY "Allow public read access to seller_companies" 
ON public.seller_companies
FOR SELECT 
USING (true);

-- Also allow read access to bank accounts for document generation
CREATE POLICY "Allow public read access to buyer_company_bank_accounts" 
ON public.buyer_company_bank_accounts
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to seller_company_bank_accounts" 
ON public.seller_company_bank_accounts
FOR SELECT 
USING (true);

-- =====================================================
-- NOTE: This only allows READ access (SELECT)
-- Admin policies still control INSERT, UPDATE, DELETE
-- =====================================================
