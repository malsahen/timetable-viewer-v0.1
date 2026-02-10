-- Diagnostic for Stefanos
SELECT 
    au.id AS auth_id, 
    au.email AS auth_email, 
    t.id AS teacher_id, 
    t.full_name, 
    t.email AS teacher_email, 
    t.user_id AS teacher_user_id,
    CASE WHEN au.id = t.user_id THEN '✅ ID MATCH' ELSE '❌ ID MISMATCH' END AS id_check,
    CASE WHEN LOWER(au.email) = LOWER(t.email) THEN '✅ EMAIL MATCH' ELSE '❌ EMAIL MISMATCH' END AS email_check
FROM auth.users au
FULL OUTER JOIN public.teachers t ON LOWER(au.email) = LOWER(t.email)
WHERE 
   au.email ILIKE '%stefanos%' OR t.full_name ILIKE '%Stefanos%';
