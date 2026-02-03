-- Fix: Update storage paths to match actual location (version/36/teacher/...)

-- Update all mappings for the current teacher version (ID 36)
UPDATE public.page_mappings
SET storage_path = 'version/36/teacher/p-' || to_char(page_no, 'FM000') || '.pdf'
WHERE kind = 'teacher' 
AND version_id = 36;
