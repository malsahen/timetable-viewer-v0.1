-- Check for 'Zombie' Teachers: Mapped but missing Login Info
-- These are teachers who have a timetable but cannot log in to see it.

SELECT 
  t.id, 
  t.full_name, 
  t.slug, 
  t.email,
  pm.storage_path
FROM public.teachers t
JOIN public.page_mappings pm 
  ON t.slug = pm.owner_slug 
  AND pm.kind = 'teacher' 
  AND pm.version_id = (SELECT id FROM public.versions WHERE kind='teacher' AND is_current=true LIMIT 1)
WHERE t.email IS NULL;
