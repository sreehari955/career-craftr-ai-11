import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type JobFormValue = {
  id?: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  mode: string;
  description: string;
  requirements: string[];
  skills: string[];
  stipend?: string | null;
  apply_url?: string | null;
};

export function emptyJob(): JobFormValue {
  return {
    title: "",
    company: "",
    location: "",
    job_type: "Full-time",
    mode: "Remote",
    description: "",
    requirements: [],
    skills: [],
    stipend: "",
    apply_url: "",
  };
}

export function JobForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save job",
  lockCompany = false,
}: {
  initial: JobFormValue;
  onSubmit: (v: JobFormValue) => void;
  onCancel?: () => void;
  submitting?: boolean;
  submitLabel?: string;
  lockCompany?: boolean;
}) {
  const [v, setV] = useState<JobFormValue>(initial);
  const upd = <K extends keyof JobFormValue>(k: K, val: JobFormValue[K]) => setV((p) => ({ ...p, [k]: val }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...v,
          requirements: (v.requirements ?? []).map((s) => s.trim()).filter(Boolean),
          skills: (v.skills ?? []).map((s) => s.trim()).filter(Boolean),
          stipend: v.stipend?.trim() || null,
          apply_url: v.apply_url?.trim() || null,
        });
      }}
      className="space-y-4"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Job title *</Label>
          <Input className="mt-1" required maxLength={150} value={v.title} onChange={(e) => upd("title", e.target.value)} />
        </div>
        <div>
          <Label>Company *</Label>
          <Input className="mt-1" required maxLength={150} value={v.company} onChange={(e) => upd("company", e.target.value)} disabled={lockCompany} />
        </div>
        <div>
          <Label>Location *</Label>
          <Input className="mt-1" required maxLength={150} value={v.location} onChange={(e) => upd("location", e.target.value)} />
        </div>
        <div>
          <Label>Stipend / Salary</Label>
          <Input className="mt-1" maxLength={60} value={v.stipend ?? ""} onChange={(e) => upd("stipend", e.target.value)} placeholder="₹40,000/mo or $80k" />
        </div>
        <div>
          <Label>Type *</Label>
          <Select value={v.job_type} onValueChange={(x) => upd("job_type", x)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Full-time", "Part-time", "Internship", "Contract"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Mode *</Label>
          <Select value={v.mode} onValueChange={(x) => upd("mode", x)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Remote", "Hybrid", "On-site"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Application URL</Label>
          <Input className="mt-1" type="url" maxLength={500} value={v.apply_url ?? ""} onChange={(e) => upd("apply_url", e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <div>
        <Label>Description *</Label>
        <Textarea className="mt-1" required rows={6} maxLength={8000} value={v.description} onChange={(e) => upd("description", e.target.value)} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>Required skills (comma separated)</Label>
          <Input
            className="mt-1"
            value={v.skills.join(", ")}
            onChange={(e) => upd("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30))}
            placeholder="React, TypeScript, SQL"
          />
        </div>
        <div>
          <Label>Requirements (one per line)</Label>
          <Textarea
            className="mt-1"
            rows={3}
            value={v.requirements.join("\n")}
            onChange={(e) => upd("requirements", e.target.value.split("\n").slice(0, 30))}
            placeholder="2+ years experience&#10;Strong communication"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}
