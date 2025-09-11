-- Check current table structure and max ID
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'vessels'
AND constraint_type = 'PRIMARY KEY';

-- Get max ID and reset sequence properly
DO $$
DECLARE
    max_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM vessels;
    PERFORM setval('vessels_id_seq', max_id + 1, false);
    RAISE NOTICE 'Max ID found: %, Sequence set to: %', max_id, max_id + 1;
END $$;

-- Test the sequence
SELECT nextval('vessels_id_seq') as next_id_will_be;