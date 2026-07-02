import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfile, updateProfile } from "@/lib/api/profile.functions";
import { GraduationCap, Building2, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

type AccountType = "job_seeker" | "company";

const EXPERIENCE_LEVELS = ["Student", "Fresher (0-1 yrs)", "Junior (1-3 yrs)", "Mid (3-5 yrs)", "Senior (5+ yrs)"];
const INTERVIEW_PREFS = ["HR", "Technical", "Basic/Fresher", "Role-specific"];
const INDUSTRIES = ["Software / IT", "Finance", "Healthcare", "Education", "E-commerce", "Manufacturing", "Consulting", "Other"];

function OnboardingPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const fetchProfile = useServerFn(getProfile);
  const saveProfile = useServerFn(updateProfile);
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [step, setStep] = useState<"role" | "form">("role");

  // Job-seeker form
  const [seeker, setSeeker] = useState({
    full_name: "", college: "", degree: "", graduation_year: "",
    skills: "", target_role: "", experience_level: "", location: "",
    interview_prefs: [] as string[],
  });

  // Company form
  const [company, setCompany] = useState({
    full_name: "", company_name: "", company_website: "", industry: "",
    hiring_contact: "", headline: "",
  });

  useEffect(() => {
    if (data?.onboarded) router.navigate({ to: "/dashboard" });
    if (data?.full_name) {
      setSeeker((s) => ({ ...s, full_name: data.full_name ?? "" }));
      setCompany((c) => ({ ...c, full_name: data.full_name ?? "" }));
    }
  }, [data, router]);

  const mut = useMutation({
    mutationFn: async () => {
      const payload = accountType === "company"
        ? {
            account_type: "company" as const,
            full_name: company.full_name,
            company_name: company.company_name,
            company_website: company.company_website,
            industry: company.industry,
            hiring_contact: company.hiring_contact,
            headline: company.headline,
            onboarded: true,
          }
        : {
            account_type: "job_seeker" as const,
            full_name: seeker.full_name,
            college: seeker.college,
            degree: seeker.degree,
            graduation_year: seeker.graduation_year ? Number(seeker.graduation_year) : null,
            skills: seeker.skills.split(",").map((s) => s.trim()).filter(Boolean),
            target_role: seeker.target_role,
            experience_level: seeker.experience_level,
            location: seeker.location,
            interview_prefs: seeker.interview_prefs,
            onboarded: true,
          };
      return saveProfile({ data: payload as never });
    },
    onSuccess: () => {
      toast.success("Welcome to JobTrack-AI!");
      qc.invalidateQueries({ queryKey: ["profile"] });
      router.navigate({ to: accountType === "company" ? "/recruiter" : "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl py-6">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold">Welcome to JobTrack-AI</h1>
        <p className="mt-1 text-muted-foreground">
          {step === "role" ? "First, tell us how you'll use JobTrack-AI." : "Just a few details and you're in."}
        </p>
      </div>

      {step === "role" && (
        <div className="grid gap-4 md:grid-cols-2">
          <RoleCard
            active={accountType === "job_seeker"}
            onClick={() => setAccountType("job_seeker")}
            icon={<GraduationCap className="h-8 w-8" />}
            title="Job / Internship Seeker"
            desc="Find roles, build ATS resumes, and practice interviews."
          />
          <RoleCard
            active={accountType === "company"}
            onClick={() => setAccountType("company")}
            icon={<Building2 className="h-8 w-8" />}
            title="Company / Recruiter"
            desc="Post jobs and manage applicants in one place."
          />
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={() => setStep("form")} disabled={!accountType} className="bg-gradient-hero">Continue</Button>
          </div>
        </div>
      )}

      {step === "form" && accountType === "job_seeker" && (
        <Card className="p-6 space-y-4">
          <Field label="Full name"><Input value={seeker.full_name} onChange={(e) => setSeeker({ ...seeker, full_name: e.target.value })} /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="College / University"><Input value={seeker.college} onChange={(e) => setSeeker({ ...seeker, college: e.target.value })} /></Field>
            <Field label="Degree"><Input placeholder="e.g. B.Tech CSE" value={seeker.degree} onChange={(e) => setSeeker({ ...seeker, degree: e.target.value })} /></Field>
            <Field label="Graduation year"><Input type="number" placeholder="2027" value={seeker.graduation_year} onChange={(e) => setSeeker({ ...seeker, graduation_year: e.target.value })} /></Field>
            <Field label="Location"><Input placeholder="Kochi, Kerala" value={seeker.location} onChange={(e) => setSeeker({ ...seeker, location: e.target.value })} /></Field>
          </div>
          <Field label="Skills (comma-separated)">
            <Input placeholder="React, Python, SQL" value={seeker.skills} onChange={(e) => setSeeker({ ...seeker, skills: e.target.value })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Target role"><Input placeholder="Frontend Intern" value={seeker.target_role} onChange={(e) => setSeeker({ ...seeker, target_role: e.target.value })} /></Field>
            <Field label="Experience level">
              <Select value={seeker.experience_level} onValueChange={(v) => setSeeker({ ...seeker, experience_level: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{EXPERIENCE_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div>
            <Label>Interview practice preferences</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERVIEW_PREFS.map((p) => {
                const on = seeker.interview_prefs.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSeeker({ ...seeker, interview_prefs: on ? seeker.interview_prefs.filter((x) => x !== p) : [...seeker.interview_prefs, p] })}
                    className={`rounded-full border px-3 py-1 text-xs transition ${on ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/50"}`}
                  >{on && <Check className="mr-1 inline h-3 w-3" />}{p}</button>
                );
              })}
            </div>
          </div>
          <FormFooter onBack={() => setStep("role")} onSubmit={() => mut.mutate()} pending={mut.isPending} />
        </Card>
      )}

      {step === "form" && accountType === "company" && (
        <Card className="p-6 space-y-4">
          <Field label="Your name"><Input value={company.full_name} onChange={(e) => setCompany({ ...company, full_name: e.target.value })} /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company name"><Input value={company.company_name} onChange={(e) => setCompany({ ...company, company_name: e.target.value })} /></Field>
            <Field label="Company website"><Input placeholder="https://" value={company.company_website} onChange={(e) => setCompany({ ...company, company_website: e.target.value })} /></Field>
            <Field label="Industry">
              <Select value={company.industry} onValueChange={(v) => setCompany({ ...company, industry: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Hiring contact"><Input placeholder="hiring@company.com" value={company.hiring_contact} onChange={(e) => setCompany({ ...company, hiring_contact: e.target.value })} /></Field>
          </div>
          <Field label="About the company"><Textarea rows={4} placeholder="What you do and who you're hiring" value={company.headline} onChange={(e) => setCompany({ ...company, headline: e.target.value })} /></Field>
          <p className="text-xs text-muted-foreground">You'll be able to post jobs and manage applicants from the Recruiter dashboard after finishing. An admin approval may be required to activate posting on the live site.</p>
          <FormFooter onBack={() => setStep("role")} onSubmit={() => mut.mutate()} pending={mut.isPending} />
        </Card>
      )}
    </div>
  );
}

function RoleCard({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border-2 p-6 text-left transition ${active ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"}`}
    >
      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{icon}</div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label><div className="mt-1">{children}</div></div>;
}

function FormFooter({ onBack, onSubmit, pending }: { onBack: () => void; onSubmit: () => void; pending: boolean }) {
  return (
    <div className="flex justify-between pt-2">
      <Button variant="ghost" onClick={onBack}>Back</Button>
      <Button onClick={onSubmit} disabled={pending} className="bg-gradient-hero">{pending ? "Saving…" : "Finish setup"}</Button>
    </div>
  );
}
