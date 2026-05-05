-- 1. Rename collector role to personnel
ALTER TYPE public.app_role RENAME VALUE 'collector' TO 'personnel';

-- 2. Rename existing bin
UPDATE public.bins SET name = 'LASU EPE-ECE 1' WHERE id = 'BIN-001';

-- 3. Bin assignments table (many-to-many: bin <-> personnel)
CREATE TABLE public.bin_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id text NOT NULL REFERENCES public.bins(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bin_id, user_id)
);

ALTER TABLE public.bin_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_select_auth" ON public.bin_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "assignments_admin_all" ON public.bin_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Helper function: is this user assigned to this bin?
CREATE OR REPLACE FUNCTION public.is_bin_owner(_user_id uuid, _bin_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bin_assignments
    WHERE user_id = _user_id AND bin_id = _bin_id
  )
$$;

-- 5. Update RLS: bins UPDATE allowed for admin OR assigned personnel
DROP POLICY IF EXISTS "bins_admin_write" ON public.bins;

CREATE POLICY "bins_admin_all" ON public.bins
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "bins_owner_update" ON public.bins
  FOR UPDATE TO authenticated
  USING (public.is_bin_owner(auth.uid(), id))
  WITH CHECK (public.is_bin_owner(auth.uid(), id));

-- 6. control_commands: admin OR assigned personnel can issue
DROP POLICY IF EXISTS "controls_admin_insert" ON public.control_commands;

CREATE POLICY "controls_admin_or_owner_insert" ON public.control_commands
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.is_bin_owner(auth.uid(), bin_id)
  );

-- 7. schedule: admin OR assigned personnel can update / mark complete
DROP POLICY IF EXISTS "schedule_collector_complete" ON public.schedule;

CREATE POLICY "schedule_owner_update" ON public.schedule
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'personnel')
    AND public.is_bin_owner(auth.uid(), bin_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'personnel')
    AND public.is_bin_owner(auth.uid(), bin_id)
  );

-- 8. Update handle_new_user: default role = 'viewer' for any non-first user
-- (no change needed — it already does this; first signup = admin)
