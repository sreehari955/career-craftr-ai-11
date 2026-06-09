import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — JobTrack-AI" },
      { name: "description", content: "Answers to common questions about ATS, AI resumes, security, and how JobTrack-AI works for students." },
      { property: "og:title", content: "JobTrack-AI FAQ" },
      { property: "og:description", content: "ATS, AI resumes, security — answered." },
    ],
  }),
  component: FAQ,
});

const faqs = [
  { q: "What is ATS?", a: "ATS stands for Applicant Tracking System — software companies use to scan resumes for keywords and structure before a human ever sees them. A resume is 'ATS-friendly' when it uses clean text, standard sections, and the right keywords from the job description so it doesn't get auto-filtered out." },
  { q: "I have no work experience. Can JobTrack-AI still help?", a: "Absolutely. The builder is designed around what students DO have — projects, hackathons, certifications, leadership in clubs, and academic work. Our AI knows how to turn those into impact-focused bullet points recruiters actually want to read." },
  { q: "How is the AI tailoring different from just rewriting?", a: "We never invent experience. The AI reorders sections to put the most relevant projects/skills first, rewrites bullets to use the language from the job description, and flags any required skills you're missing — all while keeping the underlying facts true." },
  { q: "How secure is my data?", a: "Your resumes, profile and applications are stored privately and tied to your account. Only you can read or edit your data. We never sell student data and never share it with employers without your action." },
  { q: "Is JobTrack-AI free?", a: "Yes — the Free plan covers a master resume, several tailored versions, cover letters, and unlimited application tracking. Premium unlocks unlimited AI tailoring and advanced ATS analysis." },
  { q: "Which jobs are listed?", a: "We curate a feed of internships, part-time and full-time roles for students and freshers across India and remote, with filters for stack, location and mode." },
];

function FAQ() {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <SiteHeader />
      <section className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
        <h1 className="font-display text-4xl font-bold md:text-5xl">Frequently asked questions</h1>
        <p className="mt-4 text-muted-foreground">Quick answers, plain English. Still stuck? Ping us inside the app.</p>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <SiteFooter />
    </div>
  );
}
