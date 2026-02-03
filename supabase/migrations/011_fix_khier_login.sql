-- Fix: Merge "mr-khier" (User Login) with "khier-sahen" (PDF Mapping)

BEGIN;

-- 1. Delete the "placeholder" teacher record `khier-sahen` that we inserted earlier.
--    (It doesn't have the user_id/email linked, so we don't need it if we keep the other one)
DELETE FROM public.teachers 
WHERE slug = 'khier-sahen';

-- 2. Update the existing "mr-khier" record (which has your login) 
--    to use the correct slug `khier-sahen` and name "Khier Sahen".
--    This effectively "links" your login to the PDF mapping we created.
UPDATE public.teachers
SET 
  slug = 'khier-sahen', 
  full_name = 'Khier Sahen'
WHERE slug = 'mr-khier';

COMMIT;
