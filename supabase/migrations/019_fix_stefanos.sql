-- Fix: Switch Login for Stefanos Anastasiou
-- Link teacher record to the 'stefanosanastasiou@ucsi...' account he is using.

UPDATE public.teachers
SET 
  user_id = '90c29239-3efa-432e-abb2-88758f59e89f',
  email = 'stefanosanastasiou@ucsiinternationalschool.edu.my'
WHERE slug = 'stefanos-anastasiou';
