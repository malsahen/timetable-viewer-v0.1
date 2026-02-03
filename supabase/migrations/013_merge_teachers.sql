-- Migration: Merge Teacher Records (Login Slug -> Mapped Slug)
-- This script merges the 'old' teacher records (with emails/logins) into the 'new' mapped records.
-- It works by:
-- 1. Finding the PAIR (old_slug, mapped_slug).
-- 2. Deleting the 'mapped_slug' placeholder row (which has no email).
-- 3. Updating the 'old_slug' row to become 'mapped_slug' & 'Mapped Name'.

BEGIN;

-- Helper temporary table to define the merges
CREATE TEMP TABLE merge_ops (
    login_slug text,       -- The slug currently used by their login/email (e.g. 'dilclint')
    target_slug text,      -- The slug that has the PDF map (e.g. 'dil-jahia')
    target_name text       -- The official full name from the PDF list
) ON COMMIT DROP;

INSERT INTO merge_ops (login_slug, target_slug, target_name) VALUES
-- Sarah Louise George
('sarah-jane', 'sarah-louise-george', 'Sarah Louise George'),
-- Richard Phipps-Brown
('richard-brown', 'richard-phipps-brown', 'Richard Phipps-Brown'),
-- Sadhana Shreevaani
('sadhana', 'sadhana-shreevaani', 'Sadhana Shreevaani'),
-- Thamaraii Gopalakrishnan
('thamaraii', 'thamaraii-gopalakrishnan', 'Thamaraii Gopalakrishnan'),
-- Stefanos Anastasiou
('stefanos', 'stefanos-anastasiou', 'Stefanos Anastasiou'),
('mr-stefanos', 'stefanos-anastasiou', 'Stefanos Anastasiou'), -- Handle potential alternative
-- Nur Shafa Ashykin
('nur-shafa', 'nur-shafa-ashykin', 'Nur Shafa Ashykin'),
-- Nina Cher
('cher-nina', 'nina-cher', 'Nina Cher'),
-- Jiah Zhung Lee
('jiah-zhung', 'jiah-zhung-lee', 'Jiah Zhung Lee'),
-- Cheryl Ng Pei Ling
('cheryl', 'cheryl-ng-pei-ling', 'Cheryl Ng Pei Ling'),
-- Intan Azuwani
('intan', 'intan-azuwani', 'Intan Azuwani'),
-- Kyle Marriot
('kyle', 'kyle-marriot', 'Kyle Marriot'),
('mr-kyle', 'kyle-marriot', 'Kyle Marriot'),
-- Medhat Elbannan
('medhat', 'medhat-elbannan', 'Medhat Elbannan'),
-- Chrys Chin
('chrys', 'chrys-chin', 'Chrys Chin'),
-- Vallaipan Noel Karunajanan
('noel', 'vallaipan-noel-karunajanan', 'Vallaipan Noel Karunajanan'),
-- Mohammed Bilal Fazal
('muhammed-bilal', 'mohammed-bilal-fazal', 'Mohammed Bilal Fazal'),
('mr-bilal', 'mohammed-bilal-fazal', 'Mohammed Bilal Fazal'),
-- Sumna Rasheed
('sumna', 'sumna-rasheed', 'Sumna Rasheed'),
-- Paul Devonshire
('paul', 'paul-devonshire', 'Paul Devonshire'),
-- Kai Cheong Foo
('mr-kai-cheong', 'kai-cheong-foo', 'Kai Cheong Foo'),
-- Foo Yi Ting
('yi-ting', 'foo-yi-ting', 'Foo Yi Ting'),
('ms-yi-ting', 'foo-yi-ting', 'Foo Yi Ting'),
-- Vladimir Vasilyev
('vladimir', 'vladimir-vasilyev', 'Vladimir Vasilyev'),
-- Danelle George
('danelle', 'danelle-george', 'Danelle George'),
('ms-danelle', 'danelle-george', 'Danelle George'),
-- Rashid Mundeth
('rashid', 'rashid-mundeth', 'Rashid Mundeth'),
-- Khier Sahen (Already fixed, but harmless to include if matched)
('mohammed-khier', 'khier-sahen', 'Khier Sahen'),
-- Dil Jahia
('dilclint', 'dil-jahia', 'Dil Jahia'),
-- Amanda Lomas
('amanda', 'amanda-lomas', 'Amanda Lomas'),
-- Nicola Robinson
('nicole', 'nicola-robinson', 'Nicola Robinson'),
-- Amalia Rahwani
('nur-amalia-rahwani', 'amalia-rahwani', 'Amalia Rahwani'),
-- Eunice Pang (appears correct in your table, but we ensure consistency)
('eunice-pang', 'eunice-pang', 'Eunice Pang'), 
-- Kristy Choy
('kristy', 'kristy-choy', 'Kristy Choy'),
-- Syasya Nabilah
('syasya', 'syasya-nabilah', 'Syasya Nabilah'),
-- Javier Maestre Toscano
('javier', 'javier-maestre-toscano', 'Javier Maestre Toscano'),
-- Afifah Sulaiman
('nor-afifah', 'afifah-sulaiman', 'Afifah Sulaiman'),
-- Dianne Manisha
('diannemanisha', 'dianne-manisha', 'Dianne Manisha'),
-- Lourdes Joshua
('joshua', 'lourdes-joshua', 'Lourdes Joshua'),
-- Hafilda Ummi (No obvious duplicate in your provided list, but assuming safe default)
-- Added purely so we don't miss any if hidden
('hafilda', 'hafilda-ummi', 'Hafilda Ummi');


-- PROCEDURE:
-- For each pair in merge_ops:
-- 1. Check if 'login_slug' exists AND 'target_slug' exists.
-- 2. If both exist, DELETE 'target_slug' (the placeholder).
-- 3. UPDATE 'login_slug' -> 'target_slug' & 'target_name'.

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT * FROM merge_ops LOOP
        -- Only proceed if BOTH records actually exist in the DB right now
        IF EXISTS (SELECT 1 FROM public.teachers WHERE slug = r.login_slug) 
           AND EXISTS (SELECT 1 FROM public.teachers WHERE slug = r.target_slug) 
           AND r.login_slug <> r.target_slug -- prevent self-delete
        THEN
            -- Delete the new placeholder (it has the map but NO login)
            DELETE FROM public.teachers WHERE slug = r.target_slug;
            
            -- Rename the old login record to match the map
            UPDATE public.teachers 
            SET slug = r.target_slug, full_name = r.target_name
            WHERE slug = r.login_slug;
            
        ELSIF EXISTS (SELECT 1 FROM public.teachers WHERE slug = r.login_slug) 
              AND NOT EXISTS (SELECT 1 FROM public.teachers WHERE slug = r.target_slug)
        THEN
            -- Only old one exists? Just rename it to match standard
            UPDATE public.teachers 
            SET slug = r.target_slug, full_name = r.target_name
            WHERE slug = r.login_slug;
        END IF;
    END LOOP;
END$$;

COMMIT;
