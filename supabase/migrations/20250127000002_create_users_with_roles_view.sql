-- Create users_with_roles view for easier querying
-- Note: Supabase doesn't allow direct views on auth.users, so we use a security definer function
-- This creates a view that wraps the RPC function for easier querying

-- First, ensure the function exists (it should from previous migration)
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  role app_role
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT 
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    u.last_sign_in_at,
    COALESCE(ur.role, 'user'::app_role) as role
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE u.email_confirmed_at IS NOT NULL
  ORDER BY u.created_at DESC;
$$;

-- Create a table that can be queried directly (updated via trigger)
CREATE TABLE IF NOT EXISTS public.users_with_roles_cache (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  role app_role DEFAULT 'user'::app_role,
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_with_roles_cache_email ON public.users_with_roles_cache(email);
CREATE INDEX IF NOT EXISTS idx_users_with_roles_cache_role ON public.users_with_roles_cache(role);

-- Enable RLS
ALTER TABLE public.users_with_roles_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all, users can view their own
CREATE POLICY "Admins can view all users" ON public.users_with_roles_cache
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can view themselves" ON public.users_with_roles_cache
  FOR SELECT
  USING (id = auth.uid());

-- Function to refresh the cache
CREATE OR REPLACE FUNCTION public.refresh_users_with_roles_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clear existing cache
  DELETE FROM public.users_with_roles_cache;
  
  -- Populate from function
  INSERT INTO public.users_with_roles_cache (id, email, created_at, email_confirmed_at, last_sign_in_at, role)
  SELECT * FROM public.get_users_with_roles();
END;
$$;

-- Initial population
SELECT public.refresh_users_with_roles_cache();

-- Create a view that points to the cache table (for easier querying)
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT * FROM public.users_with_roles_cache;

-- Grant access
GRANT SELECT ON public.users_with_roles TO authenticated;
GRANT SELECT ON public.users_with_roles_cache TO authenticated;

-- Add comment
COMMENT ON VIEW public.users_with_roles IS 'View of users with roles (cached from auth.users and user_roles)';
COMMENT ON TABLE public.users_with_roles_cache IS 'Cached table of users with roles, refreshed via refresh_users_with_roles_cache() function';

