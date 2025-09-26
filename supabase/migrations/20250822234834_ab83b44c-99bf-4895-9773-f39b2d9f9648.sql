-- Create subscribers table for subscription management
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
  subscription_end TIMESTAMPTZ,
  vessel_limit INTEGER DEFAULT 10,
  port_limit INTEGER DEFAULT 20,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for subscribers table
CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can update their own subscription" ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Insert subscription" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Create brokers table
CREATE TABLE public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  specialization TEXT[],
  experience_years INTEGER,
  certification TEXT[],
  regions TEXT[],
  commission_rate NUMERIC(5,2),
  rating NUMERIC(3,2) DEFAULT 0,
  total_deals INTEGER DEFAULT 0,
  total_volume BIGINT DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on brokers table
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- Create policies for brokers
CREATE POLICY "Anyone can view active brokers" ON public.brokers
FOR SELECT
USING (status = 'active');

CREATE POLICY "Brokers can update their own profile" ON public.brokers
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create broker profile" ON public.brokers
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create deals table for tracking broker deals
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES public.brokers(id) ON DELETE CASCADE,
  vessel_id INTEGER REFERENCES public.vessels(id),
  buyer_company TEXT,
  seller_company TEXT,
  cargo_type TEXT,
  quantity NUMERIC(15,2),
  price_per_unit NUMERIC(10,2),
  total_value NUMERIC(15,2),
  commission NUMERIC(15,2),
  deal_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on deals table
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create policies for deals
CREATE POLICY "Brokers can view their own deals" ON public.deals
FOR SELECT
USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()));

CREATE POLICY "Brokers can manage their own deals" ON public.deals
FOR ALL
USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()));

-- Add indexes for performance
CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_brokers_user_id ON public.brokers(user_id);
CREATE INDEX idx_brokers_status ON public.brokers(status);
CREATE INDEX idx_deals_broker_id ON public.deals(broker_id);
CREATE INDEX idx_deals_status ON public.deals(status);