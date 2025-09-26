-- Grant admin role to admin@petrodealhub.com account
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT 
  au.id,
  'admin'::app_role,
  now()
FROM auth.users au
WHERE au.email = 'admin@petrodealhub.com'
ON CONFLICT (user_id, role) 
DO UPDATE SET assigned_at = now();