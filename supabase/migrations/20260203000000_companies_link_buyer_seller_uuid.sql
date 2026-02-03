-- Link companies table to buyer_companies and seller_companies (UUID) for document fill.
-- When company_type = 'buyer', admin can set buyer_company_uuid.
-- When company_type = 'seller', admin can set seller_company_uuid.
-- Document processor can then resolve vessel -> companies -> UUID -> buyer_companies/seller_companies.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS buyer_company_uuid UUID REFERENCES public.buyer_companies(id),
  ADD COLUMN IF NOT EXISTS seller_company_uuid UUID REFERENCES public.seller_companies(id);

CREATE INDEX IF NOT EXISTS idx_companies_buyer_company_uuid ON public.companies(buyer_company_uuid);
CREATE INDEX IF NOT EXISTS idx_companies_seller_company_uuid ON public.companies(seller_company_uuid);
