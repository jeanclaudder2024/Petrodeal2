-- Fix the ports_id_seq sequence to be in sync with existing data
-- Set the sequence to start from the next available ID after the highest existing ID
SELECT setval('public.ports_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.ports), false);