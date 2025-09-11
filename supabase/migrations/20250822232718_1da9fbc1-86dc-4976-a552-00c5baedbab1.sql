-- Check current table structure and constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.vessels'::regclass;

-- Check current sequence value and max ID
SELECT 
    'Current sequence value:' as info,
    currval('vessels_id_seq') as current_value
UNION ALL
SELECT 
    'Max ID in table:' as info,
    COALESCE(MAX(id), 0) as current_value
FROM vessels;

-- Check what the next sequence value will be
SELECT nextval('vessels_id_seq') as next_value;