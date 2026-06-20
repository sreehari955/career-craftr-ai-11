import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api/payments.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — JobTrack-AI" },
      { name: "description", content: "Free for students. Premium unlocks unlimited AI tailoring, ATS analysis, and resume downloads. Pay with UPI, cards, or netbanking." },
      { property: "og:title", content: "JobTrack-AI Pricing" },
      { property: "og:description", content: "Pay securely with Razorpay — UPI, cards, netbanking." },
    ],
  }),
  component: Pricing,
});

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function Pricing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const createOrder = useServerFn(createRazorpayOrder);
  const verify = useServerFn(verifyRazorpayPayment);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const startCheckout = async () => {
    if (!signedIn) { navigate({ to: "/auth" }); return; }
    setBusy(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("Could not load Razorpay checkout");
      const order = await createOrder({ data: { plan: "premium-lifetime", amount_paise: 19900, currency: "INR" } });
      if (!order.keyId) throw new Error("Razorpay key not configured");
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "JobTrack-AI",
        description: "Premium — lifetime access",
        prefill: { email: email ?? "" },
        theme: { color: "#2563eb" },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verify({ data: resp });
            toast.success("Payment successful! Premium unlocked.");
            navigate({ to: "/dashboard" });
          } catch (e) {
            toast.error((e as Error).message);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <SiteHeader />
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">Simple, student-friendly pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">Free to get started. Upgrade only when you're ready.</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          <Card className="p-8">
            <h3 className="font-display text-2xl font-bold">Free</h3>
            <p className="mt-1 text-sm text-muted-foreground">Everything you need to start applying.</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">₹0</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {["1 master resume", "3 AI-tailored resumes / month", "5 cover letters / month", "Unlimited job tracking", "Basic ATS score"].map((f) => (
                <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /> {f}</li>
              ))}
            </ul>
            <Button asChild className="mt-7 w-full" variant="outline">
              <Link to="/auth">Get started</Link>
            </Button>
          </Card>

          <Card className="relative border-primary p-8 shadow-glow">
            <span className="absolute -top-3 left-6 rounded-full bg-gradient-hero px-3 py-1 text-xs font-medium text-primary-foreground">Most popular</span>
            <h3 className="font-display text-2xl font-bold">Premium</h3>
            <p className="mt-1 text-sm text-muted-foreground">One payment. Lifetime access.</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">₹199</span>
              <span className="text-sm text-muted-foreground">/ lifetime</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {["Unlimited AI-tailored resumes", "Unlimited cover letters", "Advanced ATS analysis", "Priority AI throughput", "Premium PDF templates", "Email & interview prep helpers"].map((f) => (
                <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /> {f}</li>
              ))}
            </ul>
            <Button onClick={startCheckout} disabled={busy} className="mt-7 w-full bg-gradient-hero">
              <Sparkles className="mr-1 h-4 w-4" /> {busy ? "Opening checkout…" : "Upgrade now"}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" /> Secured by Razorpay · UPI, cards, netbanking
            </p>
          </Card>
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">Student discounts available with a .edu / college email — coming soon.</p>
      </section>
      <SiteFooter />
    </div>
  );
}
