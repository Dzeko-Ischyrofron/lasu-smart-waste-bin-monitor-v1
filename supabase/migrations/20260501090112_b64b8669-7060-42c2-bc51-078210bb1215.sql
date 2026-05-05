CREATE POLICY "schedule_personnel_insert"
ON public.schedule
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'personnel'::app_role)
  AND public.is_bin_owner(auth.uid(), bin_id)
);