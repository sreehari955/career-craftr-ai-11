import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Bell,
  BookmarkCheck,
  Briefcase,
  CheckCircle2,
  Download,
  KanbanSquare,
  PlayCircle,
  Shield,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JobTrack AI — Track jobs, internships & applications with AI" },
      {
        name: "description",
        content:
          "Find jobs and internships faster with JobTrack AI. Track applications, save opportunities, organize follow-ups and stay ahead with AI-powered job search tools.",
      },
      { property: "og:title", content: "JobTrack AI — Your AI job & internship tracker" },
      {
        property: "og:description",
        content:
          "Track applications, save job links, organize follow-ups and find your next role with AI — all in one calm dashboard.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Briefcase,
    title: "Track jobs & internships",
    desc: "One place for every application — from first save to signed offer.",
  },
  {
    icon: BookmarkCheck,
    title: "Save job links & companies",
    desc: "Drop in any role from LinkedIn, Naukri, or company sites. We keep the details neat.",
  },
  {
    icon: KanbanSquare,
    title: "Organize application status",
    desc: "Visual board: Saved · Applied · Interview · Offer · Rejected. Drag, drop, done.",
  },
  {
    icon: Bell,
    title: "Follow-up reminders",
    desc: "Never ghost a recruiter again. Smart nudges before each follow-up window closes.",
  },
  {
    icon: Sparkles,
    title: "AI to simplify your search",
    desc: "Tailored resumes, recruiter emails and interview prep — generated in seconds.",
  },
  {
    icon: Download,
    title: "Export & own your data",
    desc: "Download your tracker as CSV or your resumes as ATS-friendly PDFs anytime.",
  },
];

const steps = [
  {
    n: "01",
    t: "Add your first role",
    d: "Paste a job link or pick one from our feed. We'll auto-fill the company, role and deadline.",
  },
  {
    n: "02",
    t: "Let AI tailor your resume",
    d: "Generate an ATS-friendly resume matched to the job description in under a minute.",
  },
  {
    n: "03",
    t: "Track, follow up, land it",
    d: "Move applications across your board and get reminders so nothing slips through.",
  },
];

const testimonials = [
  {
    name: "Aarav S.",
    role: "CS student, Kerala",
    quote:
      "I used to lose track of where I applied. JobTrack AI gave me one clean board and the resume builder got me 3 interview calls in a week.",
  },
  {
    name: "Meera P.",
    role: "Marketing intern",
    quote:
      "The follow-up reminders alone are worth it. I landed my internship after a nudge to email the recruiter back.",
  },
  {
    name: "Rohit K.",
    role: "Final-year engineering",
    quote:
      "Tailoring my resume per role used to take an hour. Now it's one click — and the ATS score actually went up.",
  },
];

const faqs = [
  {
    q: "Is JobTrack AI for internships, part-time or full-time jobs?",
    a: "All three. Whether you're hunting your first internship or a full-time role after graduation, you can track every kind of opportunity in one place.",
  },
  {
    q: "How does the AI actually help me?",
    a: "It reads the job description and rewrites your resume bullets to match it, drafts short recruiter emails, generates mock interview questions and scores your resume for ATS-friendliness — so you spend less time editing and more time applying.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Your resumes and applications are private to your account. We never sell your data, and you can export or delete everything from your dashboard at any time.",
  },
  {
    q: "Do I need to pay to get started?",
    a: "No. Core tracking, resume building and AI suggestions are free. Premium features like advanced templates and bulk exports are optional.",
  },
  {
    q: "Can I use it without uploading a resume?",
    a: "Absolutely. You can build one from scratch using our guided editor, or paste your existing one — whichever feels easier.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <SiteHeader />

      {/* Hero */}
      <section className="container mx-auto grid gap-12 px-4 pb-16 pt-10 md:grid-cols-2 md:gap-10 md:pb-24 md:pt-20">
        <div className="flex flex-col justify-center">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Your AI career sidekick
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Find jobs and internships faster with{" "}
            <span className="text-gradient">JobTrack AI</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Track applications, save opportunities, organize follow-ups, and stay
            ahead with AI-powered job search tools — all in one calm dashboard.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-hero shadow-glow">
              <Link to="/auth">
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">
                <PlayCircle className="mr-1 h-4 w-4" /> See Demo
              </a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Free to start
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> No credit card
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Jobs + internships
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-hero opacity-20 blur-3xl" />
          <img
            src={hero}
            alt="JobTrack AI dashboard preview"
            width={1408}
            height={1024}
            className="w-full rounded-3xl border bg-background shadow-glow"
          />
        </div>
      </section>

      {/* Why JobTrack AI */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="relative overflow-hidden border-0 bg-gradient-hero p-8 text-primary-foreground shadow-glow md:p-12">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0">
              <Badge variant="secondary" className="mb-3 w-fit">
                Why JobTrack AI?
              </Badge>
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                Stop losing track of applications.
              </h2>
              <p className="mt-3 max-w-xl text-primary-foreground/85">
                Keep everything organized in one place and focus on landing
                interviews — not on chasing tabs, spreadsheets and forgotten
                follow-ups.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="font-semibold shrink-0">
              <Link to="/auth">
                Try it free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">Features</Badge>
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Everything you need to land your next role
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for students and early-career job seekers — simple, fast, and friendly.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-6 transition hover:-translate-y-0.5 hover:shadow-glow">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-soft">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">How it works</Badge>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Three simple steps. No more chaos.
            </h2>
            <p className="mt-3 text-muted-foreground">
              From scattered tabs to a calm, organized job hunt — in minutes.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <Card key={s.n} className="p-7">
                <div className="font-display text-3xl font-bold text-primary">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="order-2 md:order-1">
            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-hero opacity-15 blur-3xl" />
              <img
                src={hero}
                alt="Application tracker board preview"
                className="w-full rounded-2xl border bg-background shadow-soft"
              />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <Badge variant="secondary" className="mb-3">Your dashboard</Badge>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              One calm board for every application
            </h2>
            <p className="mt-3 text-muted-foreground">
              See exactly where you stand — what's saved, what's pending a reply, and what needs a follow-up — without opening five tabs.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Drag-and-drop Kanban: Saved · Applied · Interview · Offer",
                "Each card holds the JD, your tailored resume and notes",
                "AI suggests the next best action for every stalled role",
                "Export your tracker or any resume to PDF in one click",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <Button asChild size="lg" className="bg-gradient-hero shadow-glow">
                <Link to="/auth">
                  Open my dashboard <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / trust */}
      <section className="border-y bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">Loved by early-career job seekers</Badge>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Real students. Real interviews.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="flex h-full flex-col p-6">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                  "{t.quote}"
                </p>
                <div className="mt-4 border-t pt-4">
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Your data stays private
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Transparent AI — you stay in control
            </span>
            <span className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" /> Export anytime
            </span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">FAQ</Badge>
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Questions, answered
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you might wonder before signing up.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 pb-24">
        <div className="overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center text-primary-foreground shadow-glow md:p-16">
          <Target className="mx-auto h-10 w-10 opacity-90" />
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Ready to take control of your job search?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            Join thousands of students landing internships and first jobs with smarter, calmer applications.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="font-semibold">
              <Link to="/auth">
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
