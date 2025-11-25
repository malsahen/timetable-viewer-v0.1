-- ===============================
-- Phase 1.1 – Schema refinements
-- ===============================

-- 1) PARENTS & LINKS (future-proof)
CREATE TABLE IF NOT EXISTS public.parents (
  id serial PRIMARY KEY,
  user_id uuid UNIQUE,
  full_name text,
  email text UNIQUE
);

CREATE TABLE IF NOT EXISTS public.parent_students (
  parent_id int REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id int REFERENCES public.students(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

-- RLS: enable and basic read self policies (we’ll flesh out later in Phase 5+ if needed)
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- Allow admin full access (future convenience)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parents' AND policyname='parents_admin'
  ) THEN
    CREATE POLICY "parents_admin" ON public.parents
      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.role='admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.role='admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parent_students' AND policyname='parent_students_admin'
  ) THEN
    CREATE POLICY "parent_students_admin" ON public.parent_students
      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.role='admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.role='admin'));
  END IF;
END$$;

-- OPTIONAL (later): parents can select their own links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parent_students' AND policyname='parent_students_parent_read'
  ) THEN
    CREATE POLICY "parent_students_parent_read" ON public.parent_students
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.parents pr
          JOIN public.profiles pf ON (pf.user_id = auth.uid() AND pf.email = pr.email)
          WHERE pr.id = parent_students.parent_id
        )
      );
  END IF;
END$$;

-- We will hook parents into files visibility later (Phase 5), not needed now.


-- 2) DATA INTEGRITY & SPEED

-- (a) "Only one current version" using a partial unique index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='versions_only_one_current_true'
  ) THEN
    CREATE UNIQUE INDEX versions_only_one_current_true
      ON public.versions ((is_current))
      WHERE is_current IS TRUE;
  END IF;
END$$;

-- (b) Prevent duplicate file rows for the same version/scope/type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='files_unique_per_version_scope_type'
  ) THEN
    CREATE UNIQUE INDEX files_unique_per_version_scope_type
      ON public.files (version_id, file_type, file_scope);
  END IF;
END$$;

-- (c) Helpful lookup indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email   ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_email   ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_email   ON public.teachers(email);
CREATE INDEX IF NOT EXISTS idx_classes_slug     ON public.classes(slug);
CREATE INDEX IF NOT EXISTS idx_files_type_scope ON public.files(file_type, file_scope);
CREATE INDEX IF NOT EXISTS idx_files_version    ON public.files(version_id);

-- (d) Add FKs for teacher FT/CT slugs (propagate slug updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='teachers' AND constraint_name='teachers_ft_class_slug_fkey'
  ) THEN
    ALTER TABLE public.teachers
      ADD CONSTRAINT teachers_ft_class_slug_fkey
      FOREIGN KEY (ft_class_slug) REFERENCES public.classes(slug)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='teachers' AND constraint_name='teachers_ct_class_slug_fkey'
  ) THEN
    ALTER TABLE public.teachers
      ADD CONSTRAINT teachers_ct_class_slug_fkey
      FOREIGN KEY (ct_class_slug) REFERENCES public.classes(slug)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END$$;

-- Students.class_slug already references classes(slug) in your Phase 1;
-- If it didn’t, uncomment this block:
-- ALTER TABLE public.students
--   ADD CONSTRAINT students_class_slug_fkey
--   FOREIGN KEY (class_slug) REFERENCES public.classes(slug)
--   ON UPDATE CASCADE ON DELETE SET NULL;


-- 3) EXPLICIT RLS FOR VERSIONS (admin-only)
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='versions' AND policyname='versions_admin'
  ) THEN
    CREATE POLICY "versions_admin" ON public.versions
      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.role='admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.role='admin'));
  END IF;
END$$;
