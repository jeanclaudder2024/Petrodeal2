-- Add original_price and sale_price columns to broker_membership_content
ALTER TABLE public.broker_membership_content 
ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 999,
ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT 499,
ADD COLUMN IF NOT EXISTS discount_badge_text TEXT DEFAULT '50% OFF - Limited Time',
ADD COLUMN IF NOT EXISTS savings_text TEXT DEFAULT 'Save $500 - Limited Time Offer!',
ADD COLUMN IF NOT EXISTS payment_note TEXT DEFAULT 'One-time payment • No recurring fees • Lifetime access',
ADD COLUMN IF NOT EXISTS guarantee_text TEXT DEFAULT '30-day money-back guarantee';

-- Update existing row with default values
UPDATE public.broker_membership_content 
SET 
  original_price = 999,
  sale_price = COALESCE(price, 499),
  discount_badge_text = '50% OFF - Limited Time',
  savings_text = 'Save $500 - Limited Time Offer!',
  payment_note = 'One-time payment • No recurring fees • Lifetime access',
  guarantee_text = '30-day money-back guarantee'
WHERE is_active = true AND original_price IS NULL;