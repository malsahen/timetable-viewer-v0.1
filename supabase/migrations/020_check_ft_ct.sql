-- Check FT/CT Assignments
-- Shows which teachers are linked to which classes as Form Tutor or Co-Tutor.

SELECT 
  t.full_name,
  t.slug,
  t.ft_class_slug,
  t.ct_class_slug,
  -- Check if the class actually exists
  c1.name as ft_class_name,
  c2.name as ct_class_name
FROM public.teachers t
LEFT JOIN public.classes c1 ON t.ft_class_slug = c1.slug
LEFT JOIN public.classes c2 ON t.ct_class_slug = c2.slug
WHERE t.ft_class_slug IS NOT NULL OR t.ct_class_slug IS NOT NULL
ORDER BY t.full_name;
