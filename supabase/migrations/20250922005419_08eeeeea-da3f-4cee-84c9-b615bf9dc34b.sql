-- Fix the word-templates bucket to be public for downloads
UPDATE storage.buckets 
SET public = true 
WHERE id = 'word-templates';