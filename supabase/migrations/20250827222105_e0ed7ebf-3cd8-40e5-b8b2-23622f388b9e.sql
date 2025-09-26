-- Add owner field to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS owner_name text,
ADD COLUMN IF NOT EXISTS ceo_name text,
ADD COLUMN IF NOT EXISTS headquarters_address text;

-- Create company partnership requests table
CREATE TABLE IF NOT EXISTS public.company_partnership_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id integer NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  notes text,
  UNIQUE(requester_id, company_id)
);

-- Enable RLS on company partnership requests
ALTER TABLE public.company_partnership_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company partnership requests
CREATE POLICY "Users can view their own partnership requests" 
ON public.company_partnership_requests 
FOR SELECT 
USING (requester_id = auth.uid());

CREATE POLICY "Broker members can create partnership requests" 
ON public.company_partnership_requests 
FOR INSERT 
WITH CHECK (
  requester_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.broker_memberships bm 
    WHERE bm.user_id = auth.uid() 
    AND bm.membership_status = 'active' 
    AND bm.payment_status = 'completed'
  )
);

CREATE POLICY "Users can update their own partnership requests" 
ON public.company_partnership_requests 
FOR UPDATE 
USING (requester_id = auth.uid())
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Admins can manage all partnership requests" 
ON public.company_partnership_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to check broker membership status
CREATE OR REPLACE FUNCTION public.check_broker_membership_status(user_id_param uuid DEFAULT auth.uid())
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'has_membership', EXISTS(
      SELECT 1 FROM public.broker_memberships 
      WHERE user_id = user_id_param 
      AND membership_status = 'active' 
      AND payment_status = 'completed'
    ),
    'membership_status', (
      SELECT membership_status 
      FROM public.broker_memberships 
      WHERE user_id = user_id_param 
      ORDER BY created_at DESC 
      LIMIT 1
    ),
    'payment_status', (
      SELECT payment_status 
      FROM public.broker_memberships 
      WHERE user_id = user_id_param 
      ORDER BY created_at DESC 
      LIMIT 1
    )
  );
$$;

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_partnership_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_partnership_requests_updated_at
BEFORE UPDATE ON public.company_partnership_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_partnership_requests_updated_at();