-- Create enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'broker', 'trader', 'viewer');
CREATE TYPE public.subscription_plan AS ENUM ('free', 'premium', 'broker');
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'canceled');
CREATE TYPE public.membership_status AS ENUM ('pending', 'active', 'expired', 'revoked');
CREATE TYPE public.deal_status AS ENUM ('initiated', 'under_review', 'approved', 'rejected', 'completed');
CREATE TYPE public.company_type AS ENUM ('real', 'fake', 'trader', 'refinery', 'broker', 'shipping');
CREATE TYPE public.oil_type AS ENUM ('Brent', 'WTI', 'Dubai', 'Urals', 'Maya');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role user_role DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  plan subscription_plan DEFAULT 'free',
  status subscription_status DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  stripe_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type company_type NOT NULL,
  country TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ports table
CREATE TABLE public.ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  capacity INTEGER,
  facilities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create refineries table
CREATE TABLE public.refineries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  capacity INTEGER,
  oil_types oil_type[],
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vessels table
CREATE TABLE public.vessels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  imo_number TEXT UNIQUE,
  vessel_type TEXT,
  flag_country TEXT,
  build_year INTEGER,
  capacity INTEGER,
  current_port_id UUID REFERENCES public.ports(id),
  destination_port_id UUID REFERENCES public.ports(id),
  company_id UUID REFERENCES public.companies(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  speed DECIMAL(5, 2),
  course INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create brokers table
CREATE TABLE public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
  membership_status membership_status DEFAULT 'pending',
  verification_doc TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.profiles(user_id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create deals table
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id UUID NOT NULL REFERENCES public.vessels(id),
  broker_id UUID NOT NULL REFERENCES public.brokers(id),
  status deal_status DEFAULT 'initiated',
  deal_value DECIMAL(15, 2),
  steps JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create oil_prices table
CREATE TABLE public.oil_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oil_type oil_type NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  source TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(user_id),
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ai_logs table
CREATE TABLE public.ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refineries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for public data (companies, ports, refineries, vessels, oil_prices)
CREATE POLICY "Companies are viewable by authenticated users" ON public.companies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Ports are viewable by authenticated users" ON public.ports
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Refineries are viewable by authenticated users" ON public.refineries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Vessels are viewable by authenticated users" ON public.vessels
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Oil prices are viewable by authenticated users" ON public.oil_prices
  FOR SELECT TO authenticated USING (true);

-- Create RLS policies for brokers
CREATE POLICY "Users can view their own broker record" ON public.brokers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own broker record" ON public.brokers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own broker record" ON public.brokers
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for deals
CREATE POLICY "Brokers can view their own deals" ON public.deals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.brokers 
      WHERE brokers.id = deals.broker_id 
      AND brokers.user_id = auth.uid()
    )
  );
CREATE POLICY "Brokers can create deals" ON public.deals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brokers 
      WHERE brokers.id = deals.broker_id 
      AND brokers.user_id = auth.uid()
      AND brokers.approved = true
    )
  );

-- Create RLS policies for messages
CREATE POLICY "Users can view messages they sent or received" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Create RLS policies for ai_logs
CREATE POLICY "Users can view their own AI logs" ON public.ai_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create AI logs" ON public.ai_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email
  );
  
  -- Create default subscription
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at on all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ports_updated_at BEFORE UPDATE ON public.ports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_refineries_updated_at BEFORE UPDATE ON public.refineries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vessels_updated_at BEFORE UPDATE ON public.vessels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_brokers_updated_at BEFORE UPDATE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data for companies
INSERT INTO public.companies (name, type, country, email, website) VALUES
('Saudi Aramco', 'refinery', 'Saudi Arabia', 'contact@aramco.com', 'https://www.aramco.com'),
('Shell Trading', 'trader', 'Netherlands', 'trading@shell.com', 'https://www.shell.com'),
('BP Oil Trading', 'trader', 'United Kingdom', 'trading@bp.com', 'https://www.bp.com'),
('Maersk Tankers', 'shipping', 'Denmark', 'contact@maersk.com', 'https://www.maersk.com'),
('Exxon Mobil', 'refinery', 'United States', 'contact@exxonmobil.com', 'https://www.exxonmobil.com');

-- Insert seed data for ports
INSERT INTO public.ports (name, country, latitude, longitude, capacity, facilities) VALUES
('Port of Rotterdam', 'Netherlands', 51.9244, 4.4777, 469000000, ARRAY['crude_storage', 'product_storage', 'refinery']),
('Port of Singapore', 'Singapore', 1.2966, 103.7764, 682600000, ARRAY['crude_storage', 'product_storage', 'bunkering']),
('Port of Houston', 'United States', 29.7604, -95.3698, 247000000, ARRAY['crude_storage', 'refinery', 'export_terminal']),
('Port of Antwerp', 'Belgium', 51.2213, 4.4051, 271000000, ARRAY['crude_storage', 'product_storage']),
('Ras Tanura', 'Saudi Arabia', 26.7000, 50.1667, 550000000, ARRAY['crude_loading', 'export_terminal']);

-- Insert seed data for refineries
INSERT INTO public.refineries (name, country, latitude, longitude, capacity, oil_types, company_id) VALUES
('Ras Tanura Refinery', 'Saudi Arabia', 26.7000, 50.1667, 550000, ARRAY['Brent', 'Dubai'], (SELECT id FROM public.companies WHERE name = 'Saudi Aramco')),
('Shell Pernis Refinery', 'Netherlands', 51.8833, 4.3833, 416000, ARRAY['Brent', 'Urals'], (SELECT id FROM public.companies WHERE name = 'Shell Trading')),
('ExxonMobil Baytown', 'United States', 29.7355, -94.9777, 584000, ARRAY['WTI', 'Maya'], (SELECT id FROM public.companies WHERE name = 'Exxon Mobil'));

-- Insert seed data for vessels
INSERT INTO public.vessels (name, imo_number, vessel_type, flag_country, build_year, capacity, current_port_id, company_id, latitude, longitude, speed, course, status) VALUES
('Seaways Dubai', '9234567', 'VLCC', 'Marshall Islands', 2015, 300000, (SELECT id FROM public.ports WHERE name = 'Ras Tanura'), (SELECT id FROM public.companies WHERE name = 'Maersk Tankers'), 26.7000, 50.1667, 12.5, 090, 'loading'),
('Nordic Navigator', '9345678', 'Suezmax', 'Norway', 2018, 150000, (SELECT id FROM public.ports WHERE name = 'Port of Rotterdam'), (SELECT id FROM public.companies WHERE name = 'Shell Trading'), 51.9244, 4.4777, 0.0, 000, 'at_port'),
('Atlantic Pioneer', '9456789', 'Aframax', 'Liberia', 2020, 110000, (SELECT id FROM public.ports WHERE name = 'Port of Houston'), (SELECT id FROM public.companies WHERE name = 'Exxon Mobil'), 29.7604, -95.3698, 8.2, 180, 'discharging');

-- Insert seed data for oil prices
INSERT INTO public.oil_prices (oil_type, price, currency, source, recorded_at) VALUES
('Brent', 75.45, 'USD', 'ICE', now() - interval '1 hour'),
('WTI', 71.23, 'USD', 'NYMEX', now() - interval '1 hour'),
('Dubai', 73.67, 'USD', 'Platts', now() - interval '1 hour'),
('Urals', 69.85, 'USD', 'Argus', now() - interval '1 hour'),
('Maya', 65.12, 'USD', 'Platts', now() - interval '1 hour');