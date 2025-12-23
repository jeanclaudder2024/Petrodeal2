-- Create helper function to get user_id by email from auth.users
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = user_email LIMIT 1;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;