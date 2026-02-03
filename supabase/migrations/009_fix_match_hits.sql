-- Migration: Seed Teacher Mapping (Fixing match_hits type)

-- 1. Ensure a current 'teacher' version exists
INSERT INTO public.versions (label, kind, is_current)
VALUES ('v1-teacher-mapped', 'teacher', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Upsert Teachers
INSERT INTO public.teachers (full_name, slug) VALUES
('Sarah Louise George', 'sarah-louise-george'),
('Richard Phipps-Brown', 'richard-phipps-brown'),
('Sadhana Shreevaani', 'sadhana-shreevaani'),
('Thamaraii Gopalakrishnan', 'thamaraii-gopalakrishnan'),
('Stefanos Anastasiou', 'stefanos-anastasiou'),
('Nur Shafa Ashykin', 'nur-shafa-ashykin'),
('Nina Cher', 'nina-cher'),
('Jiah Zhung Lee', 'jiah-zhung-lee'),
('Cheryl Ng Pei Ling', 'cheryl-ng-pei-ling'),
('Intan Azuwani', 'intan-azuwani'),
('Kyle Marriot', 'kyle-marriot'),
('Medhat Elbannan', 'medhat-elbannan'),
('Chrys Chin', 'chrys-chin'),
('Vallaipan Noel Karunajanan', 'vallaipan-noel-karunajanan'),
('Mohammed Bilal Fazal', 'mohammed-bilal-fazal'),
('Sumna Rasheed', 'sumna-rasheed'),
('Paul Devonshire', 'paul-devonshire'),
('Kai Cheong Foo', 'kai-cheong-foo'),
('Foo Yi Ting', 'foo-yi-ting'),
('Vladimir Vasilyev', 'vladimir-vasilyev'),
('Danelle George', 'danelle-george'),
('Rashid Mundeth', 'rashid-mundeth'),
('Khier Sahen', 'khier-sahen'),
('Dil Jahia', 'dil-jahia'),
('Amanda Lomas', 'amanda-lomas'),
('Nicola Robinson', 'nicola-robinson'),
('Amalia Rahwani', 'amalia-rahwani'),
('Eunice Pang', 'eunice-pang'),
('Kristy Choy', 'kristy-choy'),
('Syasya Nabilah', 'syasya-nabilah'),
('Javier Maestre Toscano', 'javier-maestre-toscano'),
('Afifah Sulaiman', 'afifah-sulaiman'),
('Dianne Manisha', 'dianne-manisha'),
('Lourdes Joshua', 'lourdes-joshua'),
('Hafilda Ummi', 'hafilda-ummi')
ON CONFLICT (slug) DO UPDATE
SET full_name = EXCLUDED.full_name;

-- 3. Delete old mappings for these teachers in the current version
DELETE FROM public.page_mappings 
WHERE kind = 'teacher' 
AND version_id IN (SELECT id FROM public.versions WHERE kind = 'teacher' AND is_current = true)
AND owner_slug IN (
    'sarah-louise-george', 'richard-phipps-brown', 'sadhana-shreevaani', 'thamaraii-gopalakrishnan',
    'stefanos-anastasiou', 'nur-shafa-ashykin', 'nina-cher', 'jiah-zhung-lee', 'cheryl-ng-pei-ling',
    'intan-azuwani', 'kyle-marriot', 'medhat-elbannan', 'chrys-chin', 'vallaipan-noel-karunajanan',
    'mohammed-bilal-fazal', 'sumna-rasheed', 'paul-devonshire', 'kai-cheong-foo', 'foo-yi-ting',
    'vladimir-vasilyev', 'danelle-george', 'rashid-mundeth', 'khier-sahen', 'dil-jahia', 'amanda-lomas',
    'nicola-robinson', 'amalia-rahwani', 'eunice-pang', 'kristy-choy', 'syasya-nabilah',
    'javier-maestre-toscano', 'afifah-sulaiman', 'dianne-manisha', 'lourdes-joshua', 'hafilda-ummi'
);

-- 4. Insert new mappings with match_hits as text-array
INSERT INTO public.page_mappings (version_id, kind, owner_slug, storage_path, page_no, match_score, match_hits)
SELECT 
    (SELECT id FROM public.versions WHERE kind = 'teacher' AND is_current = true ORDER BY created_at DESC LIMIT 1),
    'teacher',
    m.slug,
    m.path,
    m.page,
    100,
    ARRAY[m.slug] -- Inserting the slug as the 'hit' cause
FROM (VALUES 
  ('sarah-louise-george', 'teacher/p-001.pdf', 1),
  ('richard-phipps-brown', 'teacher/p-002.pdf', 2),
  ('sadhana-shreevaani', 'teacher/p-003.pdf', 3),
  ('thamaraii-gopalakrishnan', 'teacher/p-004.pdf', 4),
  ('stefanos-anastasiou', 'teacher/p-005.pdf', 5),
  ('nur-shafa-ashykin', 'teacher/p-006.pdf', 6),
  ('nina-cher', 'teacher/p-007.pdf', 7),
  ('jiah-zhung-lee', 'teacher/p-008.pdf', 8),
  ('cheryl-ng-pei-ling', 'teacher/p-009.pdf', 9),
  ('intan-azuwani', 'teacher/p-010.pdf', 10),
  ('kyle-marriot', 'teacher/p-011.pdf', 11),
  ('medhat-elbannan', 'teacher/p-012.pdf', 12),
  ('chrys-chin', 'teacher/p-013.pdf', 13),
  ('vallaipan-noel-karunajanan', 'teacher/p-014.pdf', 14),
  ('mohammed-bilal-fazal', 'teacher/p-015.pdf', 15),
  ('sumna-rasheed', 'teacher/p-016.pdf', 16),
  ('paul-devonshire', 'teacher/p-017.pdf', 17),
  ('kai-cheong-foo', 'teacher/p-018.pdf', 18),
  ('foo-yi-ting', 'teacher/p-019.pdf', 19),
  ('vladimir-vasilyev', 'teacher/p-020.pdf', 20),
  ('danelle-george', 'teacher/p-021.pdf', 21),
  ('rashid-mundeth', 'teacher/p-022.pdf', 22),
  ('khier-sahen', 'teacher/p-023.pdf', 23),
  ('dil-jahia', 'teacher/p-024.pdf', 24),
  ('amanda-lomas', 'teacher/p-025.pdf', 25),
  ('nicola-robinson', 'teacher/p-026.pdf', 26),
  ('amalia-rahwani', 'teacher/p-027.pdf', 27),
  ('eunice-pang', 'teacher/p-028.pdf', 28),
  ('kristy-choy', 'teacher/p-029.pdf', 29),
  ('syasya-nabilah', 'teacher/p-030.pdf', 30),
  ('javier-maestre-toscano', 'teacher/p-031.pdf', 31),
  ('afifah-sulaiman', 'teacher/p-032.pdf', 32),
  ('dianne-manisha', 'teacher/p-033.pdf', 33),
  ('lourdes-joshua', 'teacher/p-034.pdf', 34),
  ('hafilda-ummi', 'teacher/p-035.pdf', 35)
) AS m(slug, path, page);
