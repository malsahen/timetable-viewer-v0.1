-- Fix: Switch Login for Danelle and Yi Ting
-- They are likely trying to use their primary @ucsiinternationalschool.edu.my email
-- instead of the @sj... alias that was previously linked.

BEGIN;

-- 1. Danelle George
-- Update to use 'danellegeorge@ucsi...' (Auth ID: b2ab8f75...)
UPDATE public.teachers
SET 
  user_id = 'b2ab8f75-63be-47a7-a15e-a9e2f015ebd0',
  email = 'danellegeorge@ucsiinternationalschool.edu.my'
WHERE slug = 'danelle-george';

-- 2. Foo Yi Ting
-- Update to use 'fooyt@ucsi...' (Auth ID: ac7d991f...)
UPDATE public.teachers
SET 
  user_id = 'ac7d991f-58f2-46de-89c4-f7840e77b9ce',
  email = 'fooyt@ucsiinternationalschool.edu.my'
WHERE slug = 'foo-yi-ting';

COMMIT;
