-- Create broker memberships table for lifetime membership payments
CREATE TABLE public.broker_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  amount INTEGER DEFAULT 49900, -- $499 lifetime membership in cents (50% discount from $999)
  currency TEXT DEFAULT 'usd',
  payment_date TIMESTAMPTZ,
  membership_status TEXT DEFAULT 'pending', -- pending, active, suspended
  verification_status TEXT DEFAULT 'pending', -- pending, verified, rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for broker memberships
ALTER TABLE public.broker_memberships ENABLE ROW LEVEL SECURITY;

-- Policies for broker memberships
CREATE POLICY "Users can view their own membership" ON public.broker_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own membership" ON public.broker_memberships
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Edge functions can manage memberships" ON public.broker_memberships
  FOR ALL USING (true);

-- Create broker profiles table for detailed broker information
CREATE TABLE public.broker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  membership_id UUID REFERENCES public.broker_memberships(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  country TEXT,
  city TEXT,
  license_number TEXT,
  years_experience INTEGER,
  specializations TEXT[],
  id_document_url TEXT, -- URL to uploaded ID/passport
  additional_documents TEXT[], -- Additional document URLs
  bio TEXT,
  profile_image_url TEXT,
  verification_notes TEXT, -- Admin notes during verification
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for broker profiles
ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for broker profiles
CREATE POLICY "Users can view their own profile" ON public.broker_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.broker_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.broker_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.broker_profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Edge functions can manage profiles" ON public.broker_profiles
  FOR ALL USING (true);

-- Create broker deals table for deal management
CREATE TABLE public.broker_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES public.broker_profiles(id) ON DELETE CASCADE NOT NULL,
  vessel_id INTEGER REFERENCES public.vessels(id),
  deal_type TEXT NOT NULL, -- 'buy', 'sell', 'charter'
  cargo_type TEXT,
  quantity NUMERIC,
  price_per_unit NUMERIC,
  total_value NUMERIC,
  currency TEXT DEFAULT 'usd',
  source_port TEXT,
  destination_port TEXT,
  deal_date DATE,
  delivery_date DATE,
  terms_conditions TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed, cancelled
  admin_notes TEXT,
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 5,
  commission_rate NUMERIC DEFAULT 2.5,
  commission_amount NUMERIC,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for broker deals
ALTER TABLE public.broker_deals ENABLE ROW LEVEL SECURITY;

-- Policies for broker deals
CREATE POLICY "Brokers can view their own deals" ON public.broker_deals
  FOR SELECT USING (broker_id IN (
    SELECT id FROM public.broker_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Brokers can create deals" ON public.broker_deals
  FOR INSERT WITH CHECK (broker_id IN (
    SELECT id FROM public.broker_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Brokers can update their own deals" ON public.broker_deals
  FOR UPDATE USING (broker_id IN (
    SELECT id FROM public.broker_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all deals" ON public.broker_deals
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create broker chat messages table for admin communication
CREATE TABLE public.broker_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES public.broker_profiles(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES public.broker_deals(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL, -- 'broker', 'admin'
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'file', 'image'
  file_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for chat messages
ALTER TABLE public.broker_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat messages
CREATE POLICY "Brokers can view their own chats" ON public.broker_chat_messages
  FOR SELECT USING (
    broker_id IN (SELECT id FROM public.broker_profiles WHERE user_id = auth.uid())
    OR sender_id = auth.uid()
  );

CREATE POLICY "Brokers can send messages" ON public.broker_chat_messages
  FOR INSERT WITH CHECK (
    (broker_id IN (SELECT id FROM public.broker_profiles WHERE user_id = auth.uid()) AND sender_type = 'broker')
    OR (has_role(auth.uid(), 'admin') AND sender_type = 'admin')
  );

CREATE POLICY "Admins can view all chats" ON public.broker_chat_messages
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update read status" ON public.broker_chat_messages
  FOR UPDATE USING (
    broker_id IN (SELECT id FROM public.broker_profiles WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Create deal steps table for tracking deal progress
CREATE TABLE public.deal_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.broker_deals(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_description TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for deal steps
ALTER TABLE public.deal_steps ENABLE ROW LEVEL SECURITY;

-- Policies for deal steps
CREATE POLICY "Users can view deal steps" ON public.deal_steps
  FOR SELECT USING (
    deal_id IN (
      SELECT bd.id FROM public.broker_deals bd
      JOIN public.broker_profiles bp ON bd.broker_id = bp.id
      WHERE bp.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage deal steps" ON public.deal_steps
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for broker documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('broker-documents', 'broker-documents', false);

-- Create storage policies for broker documents
CREATE POLICY "Brokers can upload their documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'broker-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Brokers can view their documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'broker-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all broker documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'broker-documents' 
    AND has_role(auth.uid(), 'admin')
  );

-- Create indexes for better performance
CREATE INDEX idx_broker_memberships_user_id ON public.broker_memberships(user_id);
CREATE INDEX idx_broker_profiles_user_id ON public.broker_profiles(user_id);
CREATE INDEX idx_broker_deals_broker_id ON public.broker_deals(broker_id);
CREATE INDEX idx_broker_deals_status ON public.broker_deals(status);
CREATE INDEX idx_broker_chat_messages_broker_id ON public.broker_chat_messages(broker_id);
CREATE INDEX idx_deal_steps_deal_id ON public.deal_steps(deal_id);

-- Create updated_at triggers
CREATE TRIGGER update_broker_memberships_updated_at
  BEFORE UPDATE ON public.broker_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broker_profiles_updated_at
  BEFORE UPDATE ON public.broker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broker_deals_updated_at
  BEFORE UPDATE ON public.broker_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();