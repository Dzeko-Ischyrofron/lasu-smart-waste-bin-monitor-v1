CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION app_private.is_bin_owner(_user_id uuid, _bin_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bin_assignments
    WHERE user_id = _user_id
      AND bin_id = _bin_id
  )
$$;

REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA app_private TO authenticated;
REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.is_bin_owner(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_bin_owner(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "roles_select_own" ON public.user_roles;
CREATE POLICY "roles_select_own" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "roles_admin_all" ON public.user_roles;
CREATE POLICY "roles_admin_all" ON public.user_roles
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "assignments_admin_all" ON public.bin_assignments;
CREATE POLICY "assignments_admin_all" ON public.bin_assignments
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "bins_admin_all" ON public.bins;
CREATE POLICY "bins_admin_all" ON public.bins
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "bins_owner_update" ON public.bins;
CREATE POLICY "bins_owner_update" ON public.bins
FOR UPDATE TO authenticated
USING (
  app_private.has_role(auth.uid(), 'personnel'::public.app_role)
  AND app_private.is_bin_owner(auth.uid(), id)
)
WITH CHECK (
  app_private.has_role(auth.uid(), 'personnel'::public.app_role)
  AND app_private.is_bin_owner(auth.uid(), id)
);

DROP POLICY IF EXISTS "alerts_admin_update" ON public.alerts;
CREATE POLICY "alerts_admin_update" ON public.alerts
FOR UPDATE TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "controls_admin_or_owner_insert" ON public.control_commands;
CREATE POLICY "controls_admin_or_owner_insert" ON public.control_commands
FOR INSERT TO authenticated
WITH CHECK (
  app_private.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    app_private.has_role(auth.uid(), 'personnel'::public.app_role)
    AND app_private.is_bin_owner(auth.uid(), bin_id)
  )
);

DROP POLICY IF EXISTS "schedule_admin_all" ON public.schedule;
CREATE POLICY "schedule_admin_all" ON public.schedule
FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "schedule_owner_update" ON public.schedule;
CREATE POLICY "schedule_owner_update" ON public.schedule
FOR UPDATE TO authenticated
USING (
  app_private.has_role(auth.uid(), 'personnel'::public.app_role)
  AND app_private.is_bin_owner(auth.uid(), bin_id)
)
WITH CHECK (
  app_private.has_role(auth.uid(), 'personnel'::public.app_role)
  AND app_private.is_bin_owner(auth.uid(), bin_id)
);

DROP POLICY IF EXISTS "schedule_personnel_insert" ON public.schedule;
CREATE POLICY "schedule_personnel_insert" ON public.schedule
FOR INSERT TO authenticated
WITH CHECK (
  app_private.has_role(auth.uid(), 'personnel'::public.app_role)
  AND app_private.is_bin_owner(auth.uid(), bin_id)
);

DROP POLICY IF EXISTS "activities_admin_or_owner_insert" ON public.activities;
CREATE POLICY "activities_admin_or_owner_insert" ON public.activities
FOR INSERT TO authenticated
WITH CHECK (
  app_private.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    bin_id IS NOT NULL
    AND app_private.has_role(auth.uid(), 'personnel'::public.app_role)
    AND app_private.is_bin_owner(auth.uid(), bin_id)
  )
);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_bin_owner(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;