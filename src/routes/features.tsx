import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Briefcase, FileCheck2, KanbanSquare, Mail, Sparkles, Target, Wand2 } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — JobTrack-AI" },
      { name: "description", content: "AI resume builder, ATS scoring, role tailoring, job feed, application tracker, and cover letter generator — designed for students." },
      { property: "og:title", content: "JobTrack-AI Features" },
      { property: "og:description", content: "AI resume tailoring, ATS score, job tracker and more for students and freshers." },
    ],
  }),
  component: Features,
});

const groups = [
  {
    title: "AI Resume Builder",
    icon: FileCheck2,
    items: [
      "Build one master resume with sections optimised for students: Education, Projects, Internships, Skills, Achievements.",
      "Live preview with ATS-safe formatting (no images, tables, or weird columns).",
      "Generate a role-specific version from any job in one click.",
      "Approximate ATS compatibility score with concrete suggestions: missing keywords, action verbs, quantifiable wins.",
      "Export-ready, recruiter-friendly structure.",
    ],
  },
  {
    title: "Job Discovery",
    icon: Briefcase,
    items: [
      "Personalised feed of internships, part-time and full-time roles.",
      "Filter by job type, mode (remote / hybrid / on-site), stack, location and stipend.",
      "Save any role to your tracker in one click.",
    ],
  },
  {
    title: "Application Tracker",
    icon: KanbanSquare,
    items: [
      "Kanban board: Saved · Applied · Interview · Offer · Rejected.",
      "Store the resume version used, contact person, notes and interview prep per application.",
      "Never lose track of a deadline or follow-up again.",
    ],
  },
  {
    title: "Cover Letter & Email Helper",
    icon: Mail,
    items: [
      "Generate personalised cover letters from your resume + the job description.",
      "Pick a tone — enthusiastic, professional, or concise.",
      "Edit and save as many versions as you like.",
    ],
  },
  {
    title: "Student-Specific Tools",
    icon: Sparkles,
    items: [
      "Project bullet helper — turn academic & side projects into impact-focused lines.",
      "Skill gap suggestions based on the roles you're targeting.",
      "Portfolio links — GitHub, LinkedIn, LeetCode, personal site — front and centre.",
    ],
  },
];

function Features() {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <SiteHeader />
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"><Wand2 className="h-3.5 w-3.5 text-primary" /> Built for students</span>
          <h1 className="mt-5 font-display text-4xl font-bold md:text-5xl">Everything you need to land your next role</h1>
          <p className="mt-4 text-lg text-muted-foreground">Five modules, one calm dashboard. Free to get started.</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6">
          {groups.map((g) => (
            <Card key={g.title} className="p-7">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-soft">
                  <g.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold">{g.title}</h2>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {g.items.map((i) => (
                      <li key={i} className="flex gap-2"><Award className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {i}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button asChild size="lg" className="bg-gradient-hero shadow-glow"><Link to="/auth">Start for free <Target className="ml-1 h-4 w-4" /></Link></Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
