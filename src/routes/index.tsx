import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Briefcase, FileCheck2, KanbanSquare, Mail, Sparkles, Target, Zap } from "lucide-react";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JobTrack-AI — Smart job search and AI resumes for students" },
      { name: "description", content: "Find internships and jobs, build ATS-friendly resumes tailored to each role, and track every application — all in one place." },
      { property: "og:title", content: "JobTrack-AI — AI resumes for students and freshers" },
      { property: "og:description", content: "Discover roles, tailor your resume to each job, and track every application." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <SiteHeader />

      {/* Hero */}
      <section className="container mx-auto grid gap-10 px-4 pb-16 pt-12 md:grid-cols-2 md:gap-8 md:pb-24 md:pt-20">
        <div className="flex flex-col justify-center">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Built for students & early-career
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Smart job search and{" "}
            <span className="text-gradient">AI resumes</span> for students and freshers.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            JobTrack-AI helps you discover the right roles, build ATS-friendly resumes customized for each job description, and track every application from one calm dashboard.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-hero shadow-glow">
              <Link to="/auth">Get started free <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/features">Explore features</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-primary" /> ATS-optimized templates</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Free to get started</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-hero opacity-20 blur-3xl" />
          <img src={hero} alt="Illustration of resume and job tools" width={1408} height={1024} className="w-full rounded-3xl border bg-background shadow-glow" />
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">Three simple steps from blank page to first interview.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Tell us about you", d: "Add your education, projects, and what you're looking for. We'll guide you step-by-step." },
              { n: "02", t: "Discover matched roles", d: "Browse internships, part-time and full-time roles personalised to your skills and goals." },
              { n: "03", t: "Tailor & track", d: "Generate an ATS-friendly resume for any role in a minute and track every application in one board." },
            ].map((s) => (
              <Card key={s.n} className="p-7">
                <div className="font-display text-3xl font-bold text-primary">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Everything you need in one place</h2>
          <p className="mt-3 text-muted-foreground">No more spreadsheets, half-finished resumes, or missed follow-ups.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { i: FileCheck2, t: "AI Resume Builder", d: "Master resume + role-tailored versions, ATS-scored automatically." },
            { i: Briefcase, t: "Job Matcher", d: "Curated internships, part-time and full-time roles, filterable by stack and location." },
            { i: KanbanSquare, t: "Application Tracker", d: "Kanban board for Saved · Applied · Interview · Offer · Rejected." },
            { i: Mail, t: "Cover Letter Helper", d: "Generate authentic, personalised cover letters in seconds." },
          ].map((f) => (
            <Card key={f.t} className="p-6 transition hover:shadow-glow">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-hero text-primary-foreground shadow-soft">
                <f.i className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <div className="overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center text-primary-foreground shadow-glow md:p-16">
          <Target className="mx-auto h-10 w-10 opacity-90" />
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">You're closer than you think.</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">Join thousands of students landing internships and first jobs with smarter applications.</p>
          <div className="mt-6">
            <Button asChild size="lg" variant="secondary" className="font-semibold">
              <Link to="/auth">Get started free <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
