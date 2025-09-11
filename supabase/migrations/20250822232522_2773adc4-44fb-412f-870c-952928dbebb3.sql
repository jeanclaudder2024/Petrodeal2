-- Fix the sequence with the correct name and rename it properly
-- First, fix the current sequence value
SELECT setval('vessels_new_id_seq', COALESCE((SELECT MAX(id) FROM vessels), 0) + 1, false);

-- Rename the sequence to match the table name
ALTER SEQUENCE vessels_new_id_seq RENAME TO vessels_id_seq;

-- Update the column default to use the new sequence name
ALTER TABLE vessels ALTER COLUMN id SET DEFAULT nextval('vessels_id_seq'::regclass);