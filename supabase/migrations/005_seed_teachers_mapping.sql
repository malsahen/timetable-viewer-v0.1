-- Migration: Seed Teacher Mapping
-- Description: Inserts defined teachers and maps them to split PDF pages (p-001 to p-035).

DO $$
DECLARE
  v_id int;
BEGIN
  -- 1. Ensure a current 'teacher' version exists
  INSERT INTO public.versions (label, kind, is_current)
  VALUES ('v1-teacher-mapped', 'teacher', true)
  ON CONFLICT DO NOTHING;

  -- Get the current teacher version ID
  SELECT id INTO v_id FROM public.versions WHERE kind = 'teacher' AND is_current = true LIMIT 1;
  
  -- If checks fail (rare race condition), just pick the latest
  IF v_id IS NULL THEN
     SELECT id INTO v_id FROM public.versions WHERE kind = 'teacher' ORDER BY created_at DESC LIMIT 1;
  END IF;

  -- 2. Upsert Teachers
  -- Note: We use the slug as the unique key. Email is NULL for now if unknown.
  
  -- Helper temp table for clean data entry
  CREATE TEMP TABLE temp_teachers (
    name text,
    slug text,
    pdf_file text
  ) ON COMMIT DROP;

  INSERT INTO temp_teachers (name, slug, pdf_file) VALUES
  ('Sarah Louise George', 'sarah-louise-george', 'p-001.pdf'),
  ('Richard Phipps-Brown', 'richard-phipps-brown', 'p-002.pdf'),
  ('Sadhana Shreevaani', 'sadhana-shreevaani', 'p-003.pdf'),
  ('Thamaraii Gopalakrishnan', 'thamaraii-gopalakrishnan', 'p-004.pdf'),
  ('Stefanos Anastasiou', 'stefanos-anastasiou', 'p-005.pdf'),
  ('Nur Shafa Ashykin', 'nur-shafa-ashykin', 'p-006.pdf'),
  ('Nina Cher', 'nina-cher', 'p-007.pdf'),
  ('Jiah Zhung Lee', 'jiah-zhung-lee', 'p-008.pdf'),
  ('Cheryl Ng Pei Ling', 'cheryl-ng-pei-ling', 'p-009.pdf'),
  ('Intan Azuwani', 'intan-azuwani', 'p-010.pdf'),
  ('Kyle Marriot', 'kyle-marriot', 'p-011.pdf'),
  ('Medhat Elbannan', 'medhat-elbannan', 'p-012.pdf'),
  ('Chrys Chin', 'chrys-chin', 'p-013.pdf'),
  ('Vallaipan Noel Karunajanan', 'vallaipan-noel-karunajanan', 'p-014.pdf'),
  ('Mohammed Bilal Fazal', 'mohammed-bilal-fazal', 'p-015.pdf'),
  ('Sumna Rasheed', 'sumna-rasheed', 'p-016.pdf'),
  ('Paul Devonshire', 'paul-devonshire', 'p-017.pdf'),
  ('Kai Cheong Foo', 'kai-cheong-foo', 'p-018.pdf'),
  ('Foo Yi Ting', 'foo-yi-ting', 'p-019.pdf'),
  ('Vladimir Vasilyev', 'vladimir-vasilyev', 'p-020.pdf'),
  ('Danelle George', 'danelle-george', 'p-021.pdf'),
  ('Rashid Mundeth', 'rashid-mundeth', 'p-022.pdf'),
  ('Khier Sahen', 'khier-sahen', 'p-023.pdf'),
  ('Dil Jahia', 'dil-jahia', 'p-024.pdf'),
  ('Amanda Lomas', 'amanda-lomas', 'p-025.pdf'),
  ('Nicola Robinson', 'nicola-robinson', 'p-026.pdf'),
  ('Amalia Rahwani', 'amalia-rahwani', 'p-027.pdf'),
  ('Eunice Pang', 'eunice-pang', 'p-028.pdf'),
  ('Kristy Choy', 'kristy-choy', 'p-029.pdf'),
  ('Syasya Nabilah', 'syasya-nabilah', 'p-030.pdf'),
  ('Javier Maestre Toscano', 'javier-maestre-toscano', 'p-031.pdf'),
  ('Afifah Sulaiman', 'afifah-sulaiman', 'p-032.pdf'),
  ('Dianne Manisha', 'dianne-manisha', 'p-033.pdf'),
  ('Lourdes Joshua', 'lourdes-joshua', 'p-034.pdf'),
  ('Hafilda Ummi', 'hafilda-ummi', 'p-035.pdf');

  -- Insert/Update teachers from temp table
  INSERT INTO public.teachers (full_name, slug)
  SELECT name, slug FROM temp_teachers
  ON CONFLICT (slug) DO UPDATE
  SET full_name = EXCLUDED.full_name;

  -- 3. Insert Mappings
  -- Removes old mappings for this version/kind to avoid Unique violation if re-run on same version
  DELETE FROM public.page_mappings 
  WHERE version_id = v_id AND kind = 'teacher' AND owner_slug IN (SELECT slug FROM temp_teachers);

  INSERT INTO public.page_mappings (version_id, kind, owner_slug, storage_path, page_no, match_score)
  SELECT 
    v_id, 
    'teacher', 
    slug, 
    'teacher/' || pdf_file, 
    CAST(substring(pdf_file from 3 for 3) AS int), 
    100
  FROM temp_teachers;

END$$;
