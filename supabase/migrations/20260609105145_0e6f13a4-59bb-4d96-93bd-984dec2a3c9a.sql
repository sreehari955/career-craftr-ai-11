
-- Resume versioning
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS parent_resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS resumes_parent_idx ON public.resumes(parent_resume_id);

-- Interview sessions
CREATE TABLE public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  feedback jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT ALL ON public.interview_sessions TO service_role;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own interview sessions" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER interview_sessions_touch BEFORE UPDATE ON public.interview_sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Job alerts
CREATE TABLE public.job_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  locations text[] NOT NULL DEFAULT '{}',
  job_types text[] NOT NULL DEFAULT '{}',
  modes text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_alerts TO authenticated;
GRANT ALL ON public.job_alerts TO service_role;
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON public.job_alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER job_alerts_touch BEFORE UPDATE ON public.job_alerts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Alert matches
CREATE TABLE public.alert_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.job_alerts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  seen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (alert_id, job_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_matches TO authenticated;
GRANT ALL ON public.alert_matches TO service_role;
ALTER TABLE public.alert_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own alert matches" ON public.alert_matches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX alert_matches_user_seen ON public.alert_matches(user_id, seen);
