-- Setup admin user using existing admin role system
-- This script will work with your existing admin panel setup

-- Step 1: See what users exist
SELECT 'Current users in the system:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at LIMIT 10;

-- Step 2: Automatically set the first user as admin (using existing admin role)
-- (You can modify the WHERE clause to target a specific email if needed)
INSERT INTO user_roles (user_id, role, assigned_at) 
SELECT id, 'admin'::app_role, now()
FROM auth.users 
ORDER BY created_at 
LIMIT 1
ON CONFLICT (user_id, role) 
DO UPDATE SET assigned_at = now();

-- Alternative: Set a specific user by email as admin (uncomment and modify email)
-- INSERT INTO user_roles (user_id, role, assigned_at) 
-- SELECT id, 'admin'::app_role, now()
-- FROM auth.users 
-- WHERE email = 'your-email@example.com'
-- ON CONFLICT (user_id, role) 
-- DO UPDATE SET assigned_at = now();

-- Step 3: Verify the admin role was set
SELECT 'Admin users setup:' as info;
SELECT ur.user_id, ur.role, au.email, au.created_at, ur.assigned_at
FROM user_roles ur 
JOIN auth.users au ON ur.user_id = au.id 
WHERE ur.role = 'admin'
ORDER BY au.created_at;

-- Step 4: Test the policies by checking if admin can see all tickets
SELECT 'Database status:' as info;
SELECT COUNT(*) as total_tickets FROM support_tickets;
SELECT COUNT(*) as total_messages FROM support_ticket_messages;
SELECT COUNT(*) as total_categories FROM support_categories;