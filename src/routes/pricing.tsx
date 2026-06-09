import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — JobTrack-AI" },
      { name: "description", content: "Free for students to get started. Upgrade to Premium for unlimited tailored resumes and advanced ATS analysis." },
      { property: "og:title", content: "JobTrack-AI Pricing" },
      { property: "og:description", content: "Free for students. Premium unlocks unlimited AI tailoring." },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Free",
    price: "₹0",
    blurb: "Everything you need to start applying.",
    features: ["1 master resume", "3 AI-tailored resumes / month", "5 cover letters / month", "Unlimited job tracking", "Basic ATS score"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Premium",
    price: "₹299",
    suffix: "/ month",
    blurb: "For job hunts that are getting serious.",
    features: ["Unlimited tailored resumes", "Unlimited cover letters", "Advanced ATS analysis & keyword coach", "Priority AI throughput", "Email & interview prep helpers"],
    cta: "Start free trial",
    highlight: true,
  },
];

function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <SiteHeader />
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">Simple, student-friendly pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">Free to get started. Upgrade only when you're ready.</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {plans.map((p) => (
            <Card key={p.name} className={p.highlight ? "relative border-primary p-8 shadow-glow" : "p-8"}>
              {p.highlight && <span className="absolute -top-3 left-6 rounded-full bg-gradient-hero px-3 py-1 text-xs font-medium text-primary-foreground">Most popular</span>}
              <h3 className="font-display text-2xl font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">{p.price}</span>
                {p.suffix && <span className="text-sm text-muted-foreground">{p.suffix}</span>}
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /> {f}</li>
                ))}
              </ul>
              <Button asChild className={"mt-7 w-full " + (p.highlight ? "bg-gradient-hero" : "")} variant={p.highlight ? "default" : "outline"}>
                <Link to="/auth">{p.cta}</Link>
              </Button>
            </Card>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">Student discounts available with a .edu / college email — coming soon.</p>
      </section>
      <SiteFooter />
    </div>
  );
}
