-- ===============================
-- Phase 4 – Browser Role Support
-- ===============================
-- Adds a "browser" role that can view and download all class and teacher timetables

-- 1) Update profiles role constraint to include 'browser'
DO $$
BEGIN
  -- Drop the existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='profiles' AND constraint_name='profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  -- Add the updated constraint with 'browser' included
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin','teacher','student','parent','browser'));
END$$;


-- 2) Create page_mappings table if it doesn't exist (should exist from previous migrations)
-- This is just for reference - the table should already exist
CREATE TABLE IF NOT EXISTS public.page_mappings (
  id serial PRIMARY KEY,
  version_id int REFERENCES public.versions(id) ON DELETE CASCADE,
  kind text CHECK (kind IN ('class','teacher')),
  owner_slug text NOT NULL,
  storage_path text NOT NULL,
  page_no int,
  match_score int,
  created_at timestamptz DEFAULT now(),
  UNIQUE(version_id, kind, owner_slug)
);

-- Enable RLS on page_mappings if not already enabled
ALTER TABLE public.page_mappings ENABLE ROW LEVEL SECURITY;


-- 3) Add RLS policy for browser role on page_mappings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='page_mappings' AND policyname='browser_view_all_mappings'
  ) THEN
    CREATE POLICY "browser_view_all_mappings" ON public.page_mappings
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('browser', 'admin'))
      );
  END IF;
END$$;


-- 4) Add RLS policy for browser role on files table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='files' AND policyname='browser_view_all_files'
  ) THEN
    CREATE POLICY "browser_view_all_files" ON public.files
      FOR SELECT USING (
        published = true AND EXISTS (
          SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('browser', 'admin')
        )
      );
  END IF;
END$$;


-- 5) Add RLS policy for browser role on classes table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='classes' AND policyname='browser_view_all_classes'
  ) THEN
    CREATE POLICY "browser_view_all_classes" ON public.classes
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('browser', 'admin'))
      );
  END IF;
END$$;


-- 6) Add RLS policy for browser role on teachers table
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='teachers' AND policyname='browser_view_all_teachers'
  ) THEN
    CREATE POLICY "browser_view_all_teachers" ON public.teachers
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('browser', 'admin'))
      );
  END IF;
END$$;


-- 7) Add RLS policy for browser role on versions table (read current versions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='versions' AND policyname='browser_view_current_versions'
  ) THEN
    CREATE POLICY "browser_view_current_versions" ON public.versions
      FOR SELECT USING (
        is_current = true AND EXISTS (
          SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('browser', 'admin')
        )
      );
  END IF;
END$$;
