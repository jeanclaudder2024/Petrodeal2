-- Create admin subscription management table for plan discounts
CREATE TABLE IF NOT EXISTS public.subscription_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_tier TEXT NOT NULL,
  discount_percentage INTEGER NOT NULL DEFAULT 0,
  discount_name TEXT,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_discounts ENABLE ROW LEVEL SECURITY;

-- Create policies for admin-only access
CREATE POLICY "Admins can manage subscription discounts" 
ON public.subscription_discounts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_discounts_updated_at
BEFORE UPDATE ON public.subscription_discounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();