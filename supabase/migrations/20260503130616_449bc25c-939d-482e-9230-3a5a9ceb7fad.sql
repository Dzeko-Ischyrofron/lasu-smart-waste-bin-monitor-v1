GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_bin_owner(uuid, text) TO authenticated;

CREATE POLICY "activities_admin_or_owner_insert"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (bin_id IS NOT NULL AND public.is_bin_owner(auth.uid(), bin_id))
);