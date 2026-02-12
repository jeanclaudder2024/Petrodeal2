-- Add commodity_product_id column to vessels table for Broker Only View
ALTER TABLE public.vessels 
ADD COLUMN IF NOT EXISTS commodity_product_id UUID REFERENCES public.oil_products(id);