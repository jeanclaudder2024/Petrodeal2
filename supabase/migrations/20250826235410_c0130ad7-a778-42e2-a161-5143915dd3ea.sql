-- Create function to get users with roles for admin management
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