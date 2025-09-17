-- BACKUP-FIRST ADMIN SETUP (SAFEST FOR PRODUCTION)
-- This script backs up your data BEFORE making any changes
-- You can easily rollback if anything goes wrong

-- Step 1: Create backup table for user_roles
CREATE TABLE IF NOT EXISTS user_roles_backup_$(date +%Y%m%d_%H%M%S) AS 
SELECT * FROM user_roles;

-- Step 2: Show what we backed up
SELECT 'Backup created with ' || COUNT(*) || ' existing roles' as backup_info
FROM user_roles;

-- Step 3: Show current state
SELECT 'Current admin users BEFORE changes:' as info;
SELECT u.email, ur.role, ur.assigned_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin';

-- Step 4: SAFE admin role addition (with full conflict handling)
INSERT INTO user_roles (user_id, role, assigned_at) 
SELECT id, 'admin'::app_role, now()
FROM auth.users 
WHERE email = 'your-email@example.com'  -- CHANGE THIS TO YOUR EMAIL
ON CONFLICT (user_id, role) 
DO UPDATE SET assigned_at = now();

-- Step 5: Verify the change
SELECT 'Admin users AFTER changes:' as info;
SELECT u.email, ur.role, ur.assigned_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin';

-- Step 6: Show rollback command (if needed)
SELECT 'If you want to rollback, run this command:' as rollback_info;
SELECT 'DELETE FROM user_roles WHERE user_id = ''' || id || ''' AND role = ''admin'';' as rollback_command
FROM auth.users 
WHERE email = 'your-email@example.com';  -- CHANGE THIS TO YOUR EMAIL

-- ROLLBACK INSTRUCTIONS:
-- If something goes wrong, you can restore from backup:
-- 1. DELETE FROM user_roles;
-- 2. INSERT INTO user_roles SELECT * FROM user_roles_backup_[timestamp];
-- 3. DROP TABLE user_roles_backup_[timestamp];