
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS posted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS jobs_posted_by_idx ON public.jobs(posted_by);

GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;

DROP TRIGGER IF EXISTS jobs_touch_updated_at ON public.jobs;
CREATE TRIGGER jobs_touch_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS "Anyone can read jobs" ON public.jobs;
DROP POLICY IF EXISTS "Jobs are publicly readable" ON public.jobs;
DROP POLICY IF EXISTS "Admins manage all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters delete own jobs" ON public.jobs;

CREATE POLICY "Jobs are publicly readable" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Admins manage all jobs" ON public.jobs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Recruiters insert own jobs" ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'recruiter'::public.app_role) AND posted_by = auth.uid());
CREATE POLICY "Recruiters update own jobs" ON public.jobs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'recruiter'::public.app_role) AND posted_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'recruiter'::public.app_role) AND posted_by = auth.uid());
CREATE POLICY "Recruiters delete own jobs" ON public.jobs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'recruiter'::public.app_role) AND posted_by = auth.uid());

CREATE OR REPLACE FUNCTION public.my_roles()
RETURNS SETOF public.app_role
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = auth.uid() $$;

GRANT EXECUTE ON FUNCTION public.my_roles() TO authenticated;
