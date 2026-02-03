-- Fix: Relink Khier's user_id and email to the teacher record
-- Reason: The merge script treated the active record as a placeholder and deleted it.
-- We need to update the remaining record (ID 166) with the correct login-info.

UPDATE public.teachers
SET 
  user_id = '55690ef3-88f0-46d0-97d3-4622ed8db7c1', -- The UUID from your previous diagnostic
  email = 'mohammadkhier@ucsiinternationalschool.edu.my' -- The correct email you use
WHERE slug = 'khier-sahen';
