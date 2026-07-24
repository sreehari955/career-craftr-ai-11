DROP POLICY IF EXISTS "Recruiters view applicants for their jobs" ON public.applications;
DROP POLICY IF EXISTS "Recruiters update applicants for their jobs" ON public.applications;

CREATE POLICY "Recruiters view applicants for their jobs"
ON public.applications
FOR SELECT
TO authenticated
USING (
  private.has_role(auth.uid(), 'recruiter'::app_role)
  AND job_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = applications.job_id AND j.posted_by = auth.uid()
  )
);

CREATE POLICY "Recruiters update applicants for their jobs"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  private.has_role(auth.uid(), 'recruiter'::app_role)
  AND job_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = applications.job_id AND j.posted_by = auth.uid()
  )
)
WITH CHECK (
  private.has_role(auth.uid(), 'recruiter'::app_role)
  AND job_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = applications.job_id AND j.posted_by = auth.uid()
  )
);