-- Migration: Update to Timetable Version 37
-- Points teacher and class mappings to the new version/37/ path

BEGIN;

-- Update teachers
UPDATE public.page_mappings
SET 
    storage_path = 'version/37/teacher/' || (SPLIT_PART(storage_path, '/', 4)),
    updated_at = NOW()
WHERE kind = 'teacher' AND storage_path LIKE 'version/%';

-- Update classes
UPDATE public.page_mappings
SET 
    storage_path = 'version/37/class/' || (SPLIT_PART(storage_path, '/', 4)),
    updated_at = NOW()
WHERE kind = 'class' AND storage_path LIKE 'version/%';

-- Verification of updates
SELECT kind, COUNT(*), storage_path 
FROM public.page_mappings 
WHERE storage_path LIKE 'version/37/%'
GROUP BY kind, storage_path;

COMMIT;
