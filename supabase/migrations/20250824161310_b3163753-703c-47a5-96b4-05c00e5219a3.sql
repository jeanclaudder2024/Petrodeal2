-- Add fields to distinguish between real and fake companies and store additional details
ALTER TABLE public.companies 
ADD COLUMN company_type text NOT NULL DEFAULT 'real',
ADD COLUMN description text,
ADD COLUMN website text,
ADD COLUMN email text,
ADD COLUMN phone text,
ADD COLUMN address text,
ADD COLUMN country text,
ADD COLUMN city text,
ADD COLUMN industry text,
ADD COLUMN employees_count integer,
ADD COLUMN annual_revenue numeric,
ADD COLUMN founded_year integer,
ADD COLUMN is_verified boolean DEFAULT false;