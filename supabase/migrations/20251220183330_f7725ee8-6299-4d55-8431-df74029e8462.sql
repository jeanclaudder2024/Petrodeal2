-- Delete empty/skeleton vessels (vessels with no name or essential data)
-- These are placeholder records that should be removed
DELETE FROM public.vessels 
WHERE (name IS NULL OR name = '' OR name = 'Unknown')
  AND (imo IS NULL OR imo = '')
  AND (mmsi IS NULL OR mmsi = '');