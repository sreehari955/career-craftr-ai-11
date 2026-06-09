import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — JobTrack-AI" },
      { name: "description", content: "JobTrack-AI helps students and early-career job seekers break into industry with less stress." },
      { property: "og:title", content: "About JobTrack-AI" },
      { property: "og:description", content: "Helping students and freshers land internships and first jobs." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <SiteHeader />
      <section className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
        <h1 className="font-display text-4xl font-bold md:text-5xl">Our mission</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          We're building JobTrack-AI for the millions of students and early-career professionals who deserve a better way to find work — without the spreadsheet sprawl, the "what is ATS?" confusion, or the late-night cover-letter dread.
        </p>
        <div className="mt-10 space-y-5 text-base leading-relaxed text-foreground/90">
          <p>It started with a simple observation: most students don't lack ability — they lack a system. They send the same resume to twenty different roles, miss follow-ups, and never get told <em>why</em> their applications don't get a response.</p>
          <p>JobTrack-AI gives every student the same advantage that career coaches and senior mentors give to their lucky few: a tailored resume for each job, a calm tracker for every application, and an AI that explains in plain English what's working and what's not.</p>
          <p>We're rooted in India — proudly built with Kerala students in mind — but the playbook works anywhere.</p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
