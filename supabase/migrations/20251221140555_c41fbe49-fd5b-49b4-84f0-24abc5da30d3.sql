-- Add unique constraint on promo_code for upsert to work
ALTER TABLE public.subscription_discounts 
DROP CONSTRAINT IF EXISTS subscription_discounts_promo_code_key;

ALTER TABLE public.subscription_discounts 
ADD CONSTRAINT subscription_discounts_promo_code_key UNIQUE (promo_code);