-- Create broker_deal_companies table for admin-defined selectable companies
CREATE TABLE public.broker_deal_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id INTEGER NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('Principal', 'Mandated Seller', 'Mandated Buyer')),
  product_tags TEXT[] DEFAULT '{}',
  display_order INTEGER NOT NULL CHECK (display_order BETWEEN 1 AND 3),
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(display_order)
);

-- Add selected_company_id to broker_deals
ALTER TABLE public.broker_deals ADD COLUMN selected_company_id UUID REFERENCES public.broker_deal_companies(id);

-- Enable RLS
ALTER TABLE public.broker_deal_companies ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read enabled companies
CREATE POLICY "Authenticated users can view enabled deal companies"
ON public.broker_deal_companies
FOR SELECT
USING (is_enabled = true);

-- Policy: Admins can manage all companies (using user_roles table)
CREATE POLICY "Admins can manage deal companies"
ON public.broker_deal_companies
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_broker_deal_companies_updated_at
BEFORE UPDATE ON public.broker_deal_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();