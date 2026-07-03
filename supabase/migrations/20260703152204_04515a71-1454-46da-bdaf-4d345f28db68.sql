
-- 1) Storage: add UPDATE policy for interview-audio
CREATE POLICY "Users update own interview audio"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'interview-audio' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'interview-audio' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2) user_roles: explicit restrictive deny of writes for anon/authenticated
CREATE POLICY "No self insert of roles"
  ON public.user_roles AS RESTRICTIVE
  FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "No self update of roles"
  ON public.user_roles AS RESTRICTIVE
  FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "No self delete of roles"
  ON public.user_roles AS RESTRICTIVE
  FOR DELETE TO anon, authenticated
  USING (false);

-- 3) Move has_role out of the API-exposed public schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated, public;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM public, anon, authenticated;

-- Repoint existing policies to private.has_role
DROP POLICY IF EXISTS "Admins write site settings" ON public.site_settings;
CREATE POLICY "Admins write site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins read all payments" ON public.payments;
CREATE POLICY "Admins read all payments" ON public.payments
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage all jobs" ON public.jobs;
CREATE POLICY "Admins manage all jobs" ON public.jobs
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Recruiters insert own jobs" ON public.jobs;
CREATE POLICY "Recruiters insert own jobs" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'recruiter'::app_role) AND posted_by = auth.uid());

DROP POLICY IF EXISTS "Recruiters update own jobs" ON public.jobs;
CREATE POLICY "Recruiters update own jobs" ON public.jobs
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'recruiter'::app_role) AND posted_by = auth.uid())
  WITH CHECK (private.has_role(auth.uid(), 'recruiter'::app_role) AND posted_by = auth.uid());

DROP POLICY IF EXISTS "Recruiters delete own jobs" ON public.jobs;
CREATE POLICY "Recruiters delete own jobs" ON public.jobs
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'recruiter'::app_role) AND posted_by = auth.uid());

DROP POLICY IF EXISTS "admins manage all feedback" ON public.feedback;
CREATE POLICY "admins manage all feedback" ON public.feedback
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- Drop the exposed public.has_role now that nothing references it
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
