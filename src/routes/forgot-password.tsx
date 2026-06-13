import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — JobTrack-AI" }, { name: "description", content: "Reset your JobTrack-AI password." }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Check your email for a reset link.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-soft px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="p-7 shadow-glow">
          <h1 className="font-display text-2xl font-bold">Forgot your password?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
          {sent ? (
            <p className="mt-6 rounded-lg bg-muted p-4 text-sm">If an account exists for {email}, a reset link is on its way.</p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-hero">{loading ? "Sending…" : "Send reset link"}</Button>
            </form>
          )}
          <p className="mt-5 text-center text-xs text-muted-foreground">
            <Link to="/auth" className="underline hover:text-foreground">Back to sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
