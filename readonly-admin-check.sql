-- READ-ONLY ADMIN CHECK (NO DATABASE CHANGES)
-- This script only READS data, makes ZERO changes to your database
-- 100% safe - just shows you information

-- Step 1: Show all users in the system
SELECT 'All users in your system:' as info;
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at;

-- Step 2: Show current admin users
SELECT 'Current admin users:' as info;
SELECT 
    u.email,
    ur.role,
    ur.assigned_at,
    ur.assigned_by
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin'
ORDER BY ur.assigned_at;

-- Step 3: Show all user roles
SELECT 'All user roles:' as info;
SELECT 
    u.email,
    ur.role,
    ur.assigned_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
ORDER BY u.email;

-- Step 4: Check support system access
SELECT 'Support system status:' as info;
SELECT 
    'Total tickets' as item,
    COUNT(*) as count
FROM support_tickets
UNION ALL
SELECT 
    'Total messages' as item,
    COUNT(*) as count
FROM support_ticket_messages
UNION ALL
SELECT 
    'Total categories' as item,
    COUNT(*) as count
FROM support_categories;

-- Step 5: Show what would happen if we added admin role (SIMULATION ONLY)
SELECT 'SIMULATION: What would happen if we added admin role to first user:' as info;
SELECT 
    'Would add admin role to: ' || email as action,
    id as user_id,
    created_at
FROM auth.users 
ORDER BY created_at 
LIMIT 1;

-- NOTE: This script makes NO CHANGES to your database
-- It only shows information to help you decide what to do