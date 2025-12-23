-- Add admin access policies for unsubscribe_requests and subscribers tables

-- Admin can view all unsubscribe requests
CREATE POLICY "Admins can view all unsubscribe requests" 
ON public.unsubscribe_requests 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can update unsubscribe requests
CREATE POLICY "Admins can update unsubscribe requests" 
ON public.unsubscribe_requests 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can view all subscribers
CREATE POLICY "Admins can view all subscribers" 
ON public.subscribers 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can update subscribers
CREATE POLICY "Admins can update subscribers" 
ON public.subscribers 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::app_role));