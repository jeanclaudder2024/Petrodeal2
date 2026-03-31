
-- Create special_promo_codes table
CREATE TABLE public.special_promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage >= 1 AND discount_percentage <= 100),
  free_months INTEGER NOT NULL CHECK (free_months >= 1 AND free_months <= 12),
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('basic', 'professional')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_redemptions INTEGER,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ,
  stripe_coupon_id TEXT,
  stripe_promo_code_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.special_promo_codes ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage special promo codes"
  ON public.special_promo_codes
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow edge functions (service role) to read for checkout validation
CREATE POLICY "Service role can read special promo codes"
  ON public.special_promo_codes
  FOR SELECT
  TO anon
  USING (true);

-- Updated_at trigger
CREATE TRIGGER update_special_promo_codes_updated_at
  BEFORE UPDATE ON public.special_promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
