-- Fix the sequence for the vessels table
-- Get the current maximum ID and set the sequence to start from the next value
SELECT setval('vessels_id_seq', COALESCE((SELECT MAX(id) FROM vessels), 0) + 1, false);