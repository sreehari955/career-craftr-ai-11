
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  headline TEXT,
  location TEXT,
  college TEXT,
  degree TEXT,
  graduation_year INT,
  cgpa NUMERIC(3,2),
  skills TEXT[] DEFAULT '{}',
  preferred_roles TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  phone TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Jobs (shared feed)
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL,
  mode TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  stipend TEXT,
  apply_url TEXT,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO authenticated, anon;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read jobs" ON public.jobs FOR SELECT USING (true);

-- Resumes (master + tailored versions)
CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_master BOOLEAN NOT NULL DEFAULT false,
  job_id UUID REFERENCES public.jobs ON DELETE SET NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  ats_score INT,
  ats_feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT ALL ON public.resumes TO service_role;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Applications (Kanban tracker)
CREATE TYPE public.application_status AS ENUM ('saved','applied','interview','offer','rejected');
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs ON DELETE SET NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  link TEXT,
  status public.application_status NOT NULL DEFAULT 'saved',
  resume_id UUID REFERENCES public.resumes ON DELETE SET NULL,
  contact TEXT,
  notes TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own applications" ON public.applications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cover letters
CREATE TABLE public.cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cover_letters TO authenticated;
GRANT ALL ON public.cover_letters TO service_role;
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cover letters" ON public.cover_letters FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER resumes_touch BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER applications_touch BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER cover_letters_touch BEFORE UPDATE ON public.cover_letters FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed jobs
INSERT INTO public.jobs (title, company, location, job_type, mode, description, requirements, skills, stipend) VALUES
('Frontend Developer Intern','Razorpay','Bengaluru, India','Internship','Hybrid','Build delightful payment experiences with our web platform team.', ARRAY['B.Tech in CS or related','Strong fundamentals in JS','Portfolio of projects'], ARRAY['React','TypeScript','Tailwind CSS','Git'], '₹40,000/month'),
('Data Analyst Intern','Zoho','Chennai, India','Internship','On-site','Analyze product usage data and surface insights for product teams.', ARRAY['Final year student','SQL proficiency','Excel/Sheets'], ARRAY['SQL','Python','Pandas','Tableau'], '₹25,000/month'),
('Backend Engineer (Fresher)','Freshworks','Remote, India','Full-time','Remote','Join the platform team building APIs that power Freshworks products.', ARRAY['0-1 years experience','CS fundamentals','REST APIs'], ARRAY['Node.js','PostgreSQL','REST','Docker'], '₹12 LPA'),
('Product Design Intern','CRED','Bengaluru, India','Internship','Hybrid','Design beautiful, opinionated experiences across CRED apps.', ARRAY['Design portfolio','Figma proficiency','Eye for craft'], ARRAY['Figma','UI Design','Prototyping'], '₹50,000/month'),
('Full-Stack Developer Intern','Postman','Remote','Internship','Remote','Work across the stack on developer tooling used by millions.', ARRAY['JavaScript fundamentals','Git workflows','Curiosity'], ARRAY['React','Node.js','MongoDB','TypeScript'], '$1,200/month'),
('Marketing Analyst (Part-Time)','Unacademy','Remote, India','Part-time','Remote','Run campaigns and report on growth metrics for our edtech platform.', ARRAY['Strong writing','Analytical mindset','SEO basics'], ARRAY['Google Analytics','SEO','Content','Excel'], '₹15,000/month'),
('Machine Learning Intern','Swiggy','Bengaluru, India','Internship','On-site','Build recommendation models for the food discovery experience.', ARRAY['Python','Stats basics','One ML project'], ARRAY['Python','PyTorch','SQL','ML'], '₹60,000/month'),
('Software Engineer Trainee','TCS','Kochi, India','Full-time','On-site','TCS Ignite program for fresh graduates across product engineering.', ARRAY['Any engineering degree','Good communication'], ARRAY['Java','SQL','OOP'], '₹3.5 LPA');
