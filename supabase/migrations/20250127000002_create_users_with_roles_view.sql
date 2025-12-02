-- Create users_with_roles view for easier querying
-- This view combines auth.users with user_roles for admin management

CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    u.last_sign_in_at,
    COALESCE(ur.role, 'user'::public.app_role) as role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email_confirmed_at IS NOT NULL
ORDER BY u.created_at DESC;

-- Grant access to authenticated users
GRANT SELECT ON public.users_with_roles TO authenticated;

-- Enable RLS on the view (views inherit RLS from underlying tables)
ALTER VIEW public.users_with_roles SET (security_invoker = true);

-- Add comment
COMMENT ON VIEW public.users_with_roles IS 'View combining auth.users with user_roles for admin user management';

