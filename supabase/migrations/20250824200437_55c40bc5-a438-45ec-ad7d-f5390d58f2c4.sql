-- Add new columns to subscribers table to support the enhanced subscription features
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS regions_limit INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS refinery_limit INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS document_access TEXT[] DEFAULT ARRAY['basic']::TEXT[],
ADD COLUMN IF NOT EXISTS support_level TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS user_seats INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS api_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS real_time_analytics BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

-- Update existing basic plan defaults
UPDATE public.subscribers 
SET 
  regions_limit = 4,
  port_limit = 30,
  vessel_limit = 90,
  refinery_limit = 15,
  document_access = ARRAY['basic']::TEXT[],
  support_level = 'email',
  user_seats = 1,
  api_access = false,
  real_time_analytics = false
WHERE subscription_tier = 'basic' OR subscription_tier IS NULL;