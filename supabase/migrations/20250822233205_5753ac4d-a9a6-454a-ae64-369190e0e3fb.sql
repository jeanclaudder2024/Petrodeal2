-- First, let's see what tables currently exist and their ID types
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('ports', 'companies', 'vessels')
AND column_name = 'id'
ORDER BY table_name;