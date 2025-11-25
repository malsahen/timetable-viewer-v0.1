-- ==========  CORE TABLES  ==========
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  email text UNIQUE,
  role text CHECK (role IN ('admin','teacher','student','parent')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE classes (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,        -- e.g. "Year9A"
  year smallint NOT NULL,
  slug text NOT NULL UNIQUE         -- e.g. "year9a"
);

CREATE TABLE teachers (
  id serial PRIMARY KEY,
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  email text UNIQUE,
  slug text NOT NULL UNIQUE,        -- "jane-doe"
  ft_class_slug text,               -- Form tutor class
  ct_class_slug text                -- Co-tutor class
);

CREATE TABLE students (
  id serial PRIMARY KEY,
  user_id uuid UNIQUE,
  full_name text,
  email text UNIQUE,
  class_slug text REFERENCES classes(slug)
);

CREATE TABLE versions (
  id serial PRIMARY KEY,
  label text,
  created_at timestamptz DEFAULT now(),
  is_current boolean DEFAULT false
);

CREATE TABLE files (
  id serial PRIMARY KEY,
  version_id int REFERENCES versions(id) ON DELETE CASCADE,
  file_type text CHECK (file_type IN ('class','teacher','master')),
  file_scope text,                  -- class slug or teacher slug
  storage_path text NOT NULL,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ==========  RLS  ==========
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin full" ON files
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role='admin')
  ) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role='admin'));

CREATE POLICY "teacher see own" ON files
  FOR SELECT USING (
    (file_type='teacher' AND file_scope IN (
      SELECT slug FROM teachers WHERE user_id=auth.uid()
    ))
    OR
    (file_type='class' AND file_scope IN (
      SELECT ft_class_slug FROM teachers WHERE user_id=auth.uid()
      UNION
      SELECT ct_class_slug FROM teachers WHERE user_id=auth.uid()
    ))
  );

CREATE POLICY "student see class" ON files
  FOR SELECT USING (
    file_type='class' AND file_scope IN (
      SELECT class_slug FROM students WHERE user_id=auth.uid()
    )
  );
