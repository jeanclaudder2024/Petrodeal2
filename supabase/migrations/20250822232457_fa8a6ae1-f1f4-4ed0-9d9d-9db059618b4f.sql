-- Check what sequences exist and get table info
SELECT 
    schemaname,
    sequencename 
FROM pg_sequences 
WHERE schemaname = 'public';

-- Also check the table structure
SELECT column_name, column_default, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vessels' 
AND column_name = 'id';