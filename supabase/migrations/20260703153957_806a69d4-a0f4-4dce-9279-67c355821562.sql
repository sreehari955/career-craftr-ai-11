
-- Let recruiters read and update applications for jobs they own
CREATE POLICY "Recruiters view applicants for their jobs"
  ON public.applications FOR SELECT
  USING (
    job_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = applications.job_id
        AND j.posted_by = auth.uid()
    )
  );

CREATE POLICY "Recruiters update applicants for their jobs"
  ON public.applications FOR UPDATE
  USING (
    job_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = applications.job_id
        AND j.posted_by = auth.uid()
    )
  );
