import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraduationCap, Building2, ArrowLeft } from "lucide-react";
import { JTLogo } from "@/components/jt-logo";
import { toast } from "sonner";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { updateProfile } from "@/lib/api/profile.functions";

const searchSchema = z.object({
  as: z.enum(["seeker", "company"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — JobTrack-AI" },
      { name: "description", content: "Sign in or create your free JobTrack-AI account." },
    ],
  }),
  component: AuthPage,
});

type Role = "seeker" | "company";

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [role, setRole] = useState<Role | null>(search.as ?? null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const updateProfileFn = useServerFn(updateProfile);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const persistRole = async (chosen: Role) => {
    try {
      await updateProfileFn({
        data: { account_type: chosen === "company" ? "company" : "job_seeker" },
      });
    } catch {
      // profile may not be created yet if email confirmation is pending; ignore
    }
  };

  const afterAuth = async (chosen: Role) => {
    await persistRole(chosen);
    navigate({ to: chosen === "company" ? "/recruiter" : "/dashboard", replace: true });
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    await afterAuth(role);
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/dashboard" : undefined,
        data: { full_name: name, account_type: role === "company" ? "company" : "job_seeker" },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created!");
    if (typeof window !== "undefined") {
      try { sessionStorage.setItem("pending_account_type", role); } catch { /* noop */ }
    }
    await afterAuth(role);
  };

  const google = async () => {
    if (!role) return;
    if (typeof window !== "undefined") {
      try { sessionStorage.setItem("pending_account_type", role); } catch { /* noop */ }
    }
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) { toast.error(result.error.message || "Google sign-in failed"); setLoading(false); return; }
    if (result.redirected) return;
    await afterAuth(role);
  };

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-soft px-4 py-10">
        <div className="w-full max-w-2xl">
          <Link to="/" className="mb-7 flex items-center justify-center">
            <JTLogo size="lg" />
          </Link>
          <h1 className="mb-2 text-center font-display text-2xl font-bold">Who are you signing in as?</h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">Choose the account type to continue.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setRole("seeker")}
              className="group rounded-2xl border bg-card p-6 text-left shadow-soft transition hover:border-primary hover:shadow-glow"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h2 className="mb-1 font-semibold">Job / Internship Seeker</h2>
              <p className="text-sm text-muted-foreground">Find roles, build ATS resumes and practice interviews.</p>
            </button>
            <button
              onClick={() => setRole("company")}
              className="group rounded-2xl border bg-card p-6 text-left shadow-soft transition hover:border-primary hover:shadow-glow"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="mb-1 font-semibold">Company / Recruiter</h2>
              <p className="text-sm text-muted-foreground">Post vacancies and manage applicants.</p>
            </button>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="underline hover:text-foreground">Back to home</Link>
          </p>
        </div>
      </div>
    );
  }

  const roleLabel = role === "company" ? "Company / Recruiter" : "Job Seeker";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-soft px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-7 flex items-center justify-center">
          <JTLogo size="lg" />
        </Link>
        <Card className="p-7 shadow-glow">
          <button
            onClick={() => setRole(null)}
            className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Change account type
          </button>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {role === "company" ? <Building2 className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
            {roleLabel}
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} maxLength={128} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-hero">{loading ? "Signing in…" : `Sign in as ${roleLabel}`}</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">{role === "company" ? "Contact name" : "Your name"}</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} maxLength={128} />
                  <p className="text-xs text-muted-foreground">At least 6 characters.</p>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-hero">{loading ? "Creating…" : `Create ${roleLabel} account`}</Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button onClick={google} disabled={loading} variant="outline" className="w-full">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </Button>
        </Card>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          By continuing you agree to our friendly terms. <Link to="/" className="underline hover:text-foreground">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
