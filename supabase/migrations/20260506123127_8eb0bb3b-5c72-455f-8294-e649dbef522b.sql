DROP POLICY IF EXISTS assignments_select_auth ON public.bin_assignments;
CREATE POLICY assignments_select_admin_or_self ON public.bin_assignments
  FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid());

DROP POLICY IF EXISTS controls_select_auth ON public.control_commands;
CREATE POLICY controls_select_admin_or_owner ON public.control_commands
  FOR SELECT TO authenticated
  USING (
    app_private.has_role(auth.uid(), 'admin'::app_role)
    OR (app_private.has_role(auth.uid(), 'personnel'::app_role)
        AND app_private.is_bin_owner(auth.uid(), bin_id))
  );

REVOKE SELECT (device_api_key) ON public.bins FROM authenticated, anon, PUBLIC;

CREATE OR REPLACE FUNCTION public.get_bin_device_key(_bin_id text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE k text;
BEGIN
  IF NOT app_private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT device_api_key INTO k FROM public.bins WHERE id = _bin_id;
  RETURN k;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_bin_device_key(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_bin_device_key(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;