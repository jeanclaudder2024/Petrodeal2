-- Fix the get_users_with_roles function to match return type
-- The issue is character varying(255) vs text type mismatch
DROP FUNCTION IF EXISTS public.get_users_with_roles();

CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY: Only admins can access user data
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at,
    u.email_confirmed_at,
    u.last_sign_in_at,
    COALESCE(ur.role::text, 'user') as role
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE u.email_confirmed_at IS NOT NULL
  ORDER BY u.created_at DESC;
END;
$$;