
-- Applicants can upload/read/update/delete their own files under {uid}/...
CREATE POLICY "applicant_resumes_owner_all"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'applicant-resumes' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'applicant-resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Recruiters can read resumes attached to applications on their own jobs
CREATE POLICY "applicant_resumes_recruiter_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'applicant-resumes'
  AND private.has_role(auth.uid(), 'recruiter'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE j.posted_by = auth.uid()
      AND a.link = storage.objects.name
  )
);
