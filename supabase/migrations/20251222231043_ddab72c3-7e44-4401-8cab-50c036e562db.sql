-- Fix security issue: Add admin role check to SECURITY DEFINER functions

-- Drop and recreate get_users_with_roles with admin check
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  role app_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- SECURITY: Only admins can access user data
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  RETURN QUERY
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
END;
$$;

-- Drop and recreate refresh_users_with_roles_cache with admin check
CREATE OR REPLACE FUNCTION public.refresh_users_with_roles_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- SECURITY: Only admins can refresh the cache
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Clear existing cache
  DELETE FROM public.users_with_roles_cache;
  
  -- Populate from function (use direct query since we're already admin-verified)
  INSERT INTO public.users_with_roles_cache (id, email, created_at, email_confirmed_at, last_sign_in_at, role)
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
END;
$$;