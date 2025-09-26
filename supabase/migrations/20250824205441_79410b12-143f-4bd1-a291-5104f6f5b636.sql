-- Drop existing triggers and policies first
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles and admins can view all" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create better RLS policies for user roles
CREATE POLICY "Users can view their own roles and admins can view all"
ON public.user_roles FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create policy for admins to manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Update the user role assignment trigger to handle email confirmation better
CREATE OR REPLACE FUNCTION public.handle_user_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If user just got confirmed and doesn't have a role yet, assign one
  IF (OLD.email_confirmed_at IS NULL OR OLD.confirmed_at IS NULL) 
     AND (NEW.email_confirmed_at IS NOT NULL OR NEW.confirmed_at IS NOT NULL) THEN
    
    -- Check if user already has a role
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
      -- Count existing confirmed users  
      DECLARE
        user_count INTEGER;
      BEGIN
        SELECT COUNT(*) INTO user_count 
        FROM auth.users 
        WHERE (email_confirmed_at IS NOT NULL OR confirmed_at IS NOT NULL) AND id != NEW.id;
        
        -- If this is among the first users, make them admin
        IF user_count <= 1 THEN
          INSERT INTO public.user_roles (user_id, role, assigned_by, assigned_at)
          VALUES (NEW.id, 'admin', NEW.id, now())
          ON CONFLICT (user_id, role) DO NOTHING;
        ELSE
          -- Otherwise, assign default user role
          INSERT INTO public.user_roles (user_id, role, assigned_at)
          VALUES (NEW.id, 'user', now())
          ON CONFLICT (user_id, role) DO NOTHING;
        END IF;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_confirmation();

-- Add unique constraint to user_roles to prevent duplicate roles per user
ALTER TABLE public.user_roles ADD CONSTRAINT unique_user_role UNIQUE (user_id, role);

-- Ensure existing users have roles assigned (for those who might not have them)
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT 
    au.id,
    CASE 
        WHEN COUNT(*) OVER() = 1 OR au.email LIKE '%admin%' THEN 'admin'::app_role
        ELSE 'user'::app_role
    END,
    now()
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM public.user_roles)
  AND (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL)
ON CONFLICT (user_id, role) DO NOTHING;