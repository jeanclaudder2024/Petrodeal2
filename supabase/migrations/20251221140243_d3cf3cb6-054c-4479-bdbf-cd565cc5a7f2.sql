-- Drop the existing check constraint and recreate it to include 'both'
ALTER TABLE public.subscription_discounts 
DROP CONSTRAINT IF EXISTS subscription_discounts_billing_cycle_check;

ALTER TABLE public.subscription_discounts 
ADD CONSTRAINT subscription_discounts_billing_cycle_check 
CHECK (billing_cycle IN ('monthly', 'annual', 'both'));