-- Fix function search path security issues
ALTER FUNCTION public.has_role(_user_id UUID, _role app_role) SET search_path = public;
ALTER FUNCTION public.get_user_role(_user_id UUID) SET search_path = public;
ALTER FUNCTION public.handle_new_user_role() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;