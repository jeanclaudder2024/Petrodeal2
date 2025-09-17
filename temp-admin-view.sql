-- SIMPLE SAFE ADMIN SETUP
-- This adds admin role directly but with full safety and easy rollback

-- Step 1: Show current state BEFORE any changes
SELECT 'BEFORE - Current users:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at LIMIT 10;

SELECT 'BEFORE - Current admin users:' as info;
SELECT u.email, ur.role, ur.assigned_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin';

-- Step 2: Add admin role to YOUR EMAIL (CHANGE THIS!)
-- Replace 'your-email@example.com' with your actual email
INSERT INTO user_roles (user_id, role, assigned_at) 
SELECT id, 'admin'::app_role, now()
FROM auth.users 
WHERE email = 'jeanclaudedergham@gmail.com'  -- CHANGE THIS TO YOUR EMAIL
ON CONFLICT (user_id, role) 
DO UPDATE SET assigned_at = now();

-- Step 3: Verify the change worked
SELECT 'AFTER - Admin users now:' as info;
SELECT u.email, ur.role, ur.assigned_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin'
ORDER BY ur.assigned_at DESC;

-- Step 4: Test admin access
SELECT 'Testing admin access:' as info;
SELECT COUNT(*) as total_tickets FROM support_tickets;
SELECT COUNT(*) as total_messages FROM support_ticket_messages;

-- ROLLBACK COMMAND (if you want to remove admin access later):
-- DELETE FROM user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jeanclaudedergham@gmail.com') AND role = 'admin';

-- SUCCESS MESSAGE
SELECT 'Setup complete! You should now have admin access.' as result;