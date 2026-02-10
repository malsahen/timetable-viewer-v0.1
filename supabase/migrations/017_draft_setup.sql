-- Migration: Add Draft View Permission and Setup Version 37 as Draft

BEGIN;

-- 1. Add can_view_drafts column to profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pf_get_column_info('public', 'profiles', 'can_view_drafts')) THEN
        ALTER TABLE public.profiles ADD COLUMN can_view_drafts boolean DEFAULT false;
    END IF;
END $$;
-- Note: Re-implementing correctly since pf_get_column_info might not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_view_drafts boolean DEFAULT false;

-- 2. Grant permission to Khier
UPDATE public.profiles 
SET can_view_drafts = true 
WHERE email = 'mohammadkhier@ucsiinternationalschool.edu.my';

-- 3. Ensure Version 36 is CURRENT and Version 37 is DRAFT
-- Mark 36 as current
UPDATE public.versions SET is_current = true WHERE id = 36;
-- Mark 37 as NOT current and label it clearly
UPDATE public.versions SET is_current = false, label = 'Term 1 (Draft)' WHERE id = 37;

-- 4. Revert mappings for Version 36 to point to version/36/ folder
-- (In case they were changed in the previous step)
UPDATE public.page_mappings
SET storage_path = REPLACE(storage_path, 'version/37/', 'version/36/')
WHERE version_id = 36 AND storage_path LIKE 'version/37/%';

-- 5. Create/Update mappings for Version 37 to point to version/37/ folder
-- We can sync them from version 36 if they don't exist, or just update if they do.
-- First, ensure all version 36 mappings have an equivalent in version 37.
INSERT INTO public.page_mappings (version_id, kind, owner_slug, storage_path, page_no, match_score, match_hits)
SELECT 37, kind, owner_slug, REPLACE(storage_path, 'version/36/', 'version/37/'), page_no, match_score, match_hits
FROM public.page_mappings
WHERE version_id = 36
ON CONFLICT (version_id, kind, owner_slug) DO UPDATE
SET storage_path = EXCLUDED.storage_path;

COMMIT;
