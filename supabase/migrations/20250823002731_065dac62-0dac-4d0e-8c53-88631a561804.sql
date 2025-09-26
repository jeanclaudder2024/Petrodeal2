-- Make the existing user an admin
INSERT INTO user_roles (user_id, role, assigned_at) 
VALUES (
  'bd32469f-84b5-47f2-aac2-53522016581e', 
  'admin', 
  now()
) 
ON CONFLICT (user_id, role) 
DO UPDATE SET 
  assigned_at = now();

-- Verify the role assignment
SELECT u.email, ur.role, ur.assigned_at 
FROM auth.users u 
JOIN user_roles ur ON u.id = ur.user_id 
WHERE u.email = 'jeanclaudedergham@gmail.com';