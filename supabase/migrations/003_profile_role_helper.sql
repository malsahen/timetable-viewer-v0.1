CREATE OR REPLACE FUNCTION public.set_profile_role_if_not_admin(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET role = p_role
  WHERE user_id = p_user_id
    AND COALESCE(role,'student') <> 'admin'
    AND (role IS NULL OR role NOT IN ('admin', p_role));
END;
$$;
