-- Unsubscribe requests table for admin approval workflow
CREATE TABLE public.unsubscribe_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscriber_id UUID REFERENCES public.subscribers(id),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  policy_accepted BOOLEAN DEFAULT false,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unsubscribe_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own unsubscribe requests" 
ON public.unsubscribe_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create their own unsubscribe requests" 
ON public.unsubscribe_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_unsubscribe_requests_updated_at
BEFORE UPDATE ON public.unsubscribe_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();