-- Fix the primary key constraint name
ALTER TABLE public.vessels RENAME CONSTRAINT vessels_new_pkey TO vessels_pkey;

-- Verify the fix
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'vessels'
AND constraint_type = 'PRIMARY KEY';