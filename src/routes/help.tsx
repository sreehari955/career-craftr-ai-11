import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { submitFeedback } from "@/lib/api/feedback.functions";
import { LifeBuoy, Mail, Bug, MessageSquare, HelpCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Centre — JobTrack-AI" },
      { name: "description", content: "Contact us, send feedback, report bugs, or open a support request. Browse the FAQ for quick answers about JobTrack-AI." },
      { property: "og:title", content: "Help Centre — JobTrack-AI" },
      { property: "og:description", content: "Contact, feedback, bug reports, FAQ, and support for JobTrack-AI users." },
    ],
  }),
  component: HelpCentre,
});

type Category = "contact" | "feedback" | "bug" | "support";

const CATS: { id: Category; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: "contact", label: "Contact Admin", icon: Mail, desc: "Send a message directly to the JobTrack-AI team." },
  { id: "feedback", label: "Send Feedback", icon: MessageSquare, desc: "Share what's working or what you'd like to see next." },
  { id: "bug", label: "Report a Bug", icon: Bug, desc: "Tell us what broke so we can fix it fast." },
  { id: "support", label: "Support Request", icon: LifeBuoy, desc: "Need help with your account, resume, or a job post?" },
];

const FAQS = [
  { q: "Is JobTrack-AI free to use?", a: "Yes — resume building, job tracking, and basic AI features are free. Premium unlocks unlimited AI generations and advanced templates." },
  { q: "Does it work for internships as well as full-time roles?", a: "Yes. You can filter and track internships, part-time, and full-time roles from one dashboard." },
  { q: "How does the AI resume builder work?", a: "Paste a job description and JobTrack-AI tailors your resume to match keywords and score better on ATS scanners." },
  { q: "Can companies post jobs here?", a: "Yes. Sign up as a Company to access the recruiter dashboard where you can post and manage vacancies." },
  { q: "Is my data private?", a: "Your profile, resumes, and applications are private to your account. We never sell your data." },
  { q: "How do I delete my account?", a: "Send a support request from this page and we'll process it within 48 hours." },
];

function HelpCentre() {
  const send = useServerFn(submitFeedback);
  const [category, setCategory] = useState<Category>("contact");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  const mut = useMutation({
    mutationFn: async () => send({ data: { category, subject, message, email, page_url: typeof window !== "undefined" ? window.location.href : undefined } }),
    onSuccess: () => {
      toast.success("Thanks! We'll get back to you shortly.");
      setSubject(""); setMessage(""); setEmail("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <HelpCircle className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold">Help Centre</h1>
          <p className="mt-2 text-muted-foreground">We're here to help. Pick a category, and someone from the team will follow up.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-4">
          {CATS.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => setCategory(id)}
              className={`rounded-xl border p-4 text-left transition ${category === id ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/50 hover:bg-muted/40"}`}
            >
              <Icon className={`h-5 w-5 ${category === id ? "text-primary" : "text-muted-foreground"}`} />
              <p className="mt-2 text-sm font-semibold">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>

        <Card className="mx-auto mt-6 max-w-3xl p-6">
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATS.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Your email (optional)</Label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} />
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Input placeholder="Short summary" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea placeholder="Tell us the details…" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} required />
            </div>
            <Button type="submit" disabled={mut.isPending || subject.length < 1 || message.length < 5} className="bg-gradient-hero">
              {mut.isPending ? "Sending…" : "Submit"}
            </Button>
          </form>
        </Card>

        <div className="mx-auto mt-14 max-w-3xl">
          <h2 className="font-display text-2xl font-bold">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-4">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Looking for something else? <Link to="/faq" className="text-primary underline-offset-4 hover:underline">Browse the full FAQ</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
