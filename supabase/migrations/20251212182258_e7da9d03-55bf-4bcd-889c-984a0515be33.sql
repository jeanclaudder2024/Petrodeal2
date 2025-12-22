-- Add missing columns to subscription_discounts table
ALTER TABLE public.subscription_discounts 
ADD COLUMN IF NOT EXISTS promo_code TEXT,
ADD COLUMN IF NOT EXISTS max_redemptions INTEGER,
ADD COLUMN IF NOT EXISTS first_time_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_coupon_id TEXT;

-- Make promo_code unique if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_discounts_promo_code_key'
  ) THEN
    ALTER TABLE public.subscription_discounts ADD CONSTRAINT subscription_discounts_promo_code_key UNIQUE (promo_code);
  END IF;
END $$;