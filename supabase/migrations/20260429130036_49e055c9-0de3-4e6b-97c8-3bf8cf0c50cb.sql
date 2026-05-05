
-- Lock down SECURITY DEFINER functions: only the system needs them.
-- has_role is called from RLS policies (server-side, runs as the policy owner regardless of grants).
-- handle_new_user is called from a trigger only.
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
