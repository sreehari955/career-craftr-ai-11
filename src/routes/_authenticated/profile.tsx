import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getProfile, updateProfile } from "@/lib/api/profile.functions";
import { toast } from "sonner";
import { X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type Profile = NonNullable<Awaited<ReturnType<typeof getProfile>>>;

function ProfilePage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const saveProfile = useServerFn(updateProfile);
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const [form, setForm] = useState<Partial<Profile>>({});

  useEffect(() => { if (data) setForm(data); }, [data]);

  const mut = useMutation({
    mutationFn: async (vals: Partial<Profile>) => saveProfile({ data: { ...vals, onboarded: true } as Parameters<typeof saveProfile>[0]["data"] }),
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p>Loading…</p>;

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Your profile</h1>
        <p className="mt-1 text-muted-foreground">The more we know, the better we can match jobs and tailor resumes.</p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Basics</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name"><Input value={form.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} maxLength={120} /></Field>
          <Field label="Headline (e.g. CS undergrad · React + Python)"><Input value={form.headline ?? ""} onChange={(e) => set("headline", e.target.value)} maxLength={200} /></Field>
          <Field label="Location"><Input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} maxLength={120} /></Field>
          <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} maxLength={40} /></Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Education</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="College / University"><Input value={form.college ?? ""} onChange={(e) => set("college", e.target.value)} maxLength={200} /></Field>
          <Field label="Degree (e.g. B.Tech CSE)"><Input value={form.degree ?? ""} onChange={(e) => set("degree", e.target.value)} maxLength={120} /></Field>
          <Field label="Graduation year"><Input type="number" min={1950} max={2100} value={form.graduation_year ?? ""} onChange={(e) => set("graduation_year", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="CGPA (optional)"><Input type="number" step="0.01" min={0} max={10} value={form.cgpa ?? ""} onChange={(e) => set("cgpa", e.target.value ? Number(e.target.value) : null)} /></Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Skills & preferences</h2>
        <div className="space-y-4">
          <TagInput label="Skills" placeholder="React, Python, SQL…" value={form.skills ?? []} onChange={(v) => set("skills", v)} />
          <TagInput label="Preferred roles" placeholder="Frontend Intern, Data Analyst…" value={form.preferred_roles ?? []} onChange={(v) => set("preferred_roles", v)} />
          <TagInput label="Preferred locations" placeholder="Remote, Bengaluru, Kochi…" value={form.preferred_locations ?? []} onChange={(v) => set("preferred_locations", v)} />
          <div>
            <Label className="mb-2 block text-sm">What are you mainly looking for?</Label>
            <div className="flex flex-wrap gap-2">
              {["Internship", "Part-time", "Full-time / Graduate role", "Remote only"].map((g) => {
                const active = (form.goals ?? []).includes(g);
                return (
                  <button
                    key={g} type="button"
                    onClick={() => set("goals", active ? (form.goals ?? []).filter((x) => x !== g) : [...(form.goals ?? []), g])}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
                  >{g}</button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Links</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="GitHub"><Input value={form.github_url ?? ""} onChange={(e) => set("github_url", e.target.value)} placeholder="https://github.com/…" /></Field>
          <Field label="LinkedIn"><Input value={form.linkedin_url ?? ""} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/…" /></Field>
          <Field label="Portfolio"><Input value={form.portfolio_url ?? ""} onChange={(e) => set("portfolio_url", e.target.value)} placeholder="https://…" /></Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => mut.mutate(form)} disabled={mut.isPending} className="bg-gradient-hero">
          {mut.isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div>;
}

function TagInput({ label, placeholder, value, onChange }: { label: string; placeholder?: string; value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setInput("");
  };
  return (
    <div>
      <Label className="mb-2 block text-sm">{label}</Label>
      <div className="flex gap-2">
        <Input value={input} placeholder={placeholder} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} maxLength={60} />
        <Button type="button" variant="outline" onClick={add}>Add</Button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">
              {t}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
