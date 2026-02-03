-- Compare Auth Users vs Teacher Records
-- This will show if the email they login with is different from what we have in the teacher record.

SELECT 
    au.id AS auth_id, 
    au.email AS auth_email, 
    t.id AS teacher_id, 
    t.full_name, 
    t.email AS teacher_email, 
    t.user_id AS teacher_user_id,
    CASE WHEN au.id = t.user_id THEN '✅ MATCH' ELSE '❌ MISMATCH' END AS id_check,
    CASE WHEN LOWER(au.email) = LOWER(t.email) THEN '✅ MATCH' ELSE '❌ MISMATCH' END AS email_check
FROM auth.users au
FULL OUTER JOIN public.teachers t ON LOWER(au.email) = LOWER(t.email)
WHERE 
   (au.email ILIKE '%foo%' OR t.full_name ILIKE '%Foo%')
   OR
   (au.email ILIKE '%danelle%' OR t.full_name ILIKE '%Danelle%');
