-- Grant admin access to jeanclaudedergham1@gmail.com
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT 
  au.id,
  'admin'::app_role,
  now()
FROM auth.users au
WHERE au.email = 'jeanclaudedergham1@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;