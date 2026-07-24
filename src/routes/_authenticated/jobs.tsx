import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { listJobs, saveJobApplication } from "@/lib/api/jobs.functions";
import { listResumes } from "@/lib/api/resumes.functions";
import { draftRecruiterEmail } from "@/lib/api/ai.functions";
import { applyToJob } from "@/lib/api/applications.functions";
import { getProfile } from "@/lib/api/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Briefcase, Search, BookmarkPlus, ExternalLink, Mail, Copy, Send, Upload, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/jobs")({
  component: JobsPage,
});

type Job = {
  id: string; title: string; company: string; location: string; job_type: string; mode: string;
  description: string; requirements: string[] | null; skills: string[] | null;
  stipend: string | null; apply_url: string | null; posted_at?: string | null;
};

function JobsPage() {
  const qc = useQueryClient();
  const fetchJobs = useServerFn(listJobs);
  const fetchResumes = useServerFn(listResumes);
  const fetchProfile = useServerFn(getProfile);
  const save = useServerFn(saveJobApplication);
  const draft = useServerFn(draftRecruiterEmail);
  const apply = useServerFn(applyToJob);
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: () => fetchJobs() });
  const { data: resumes = [] } = useQuery({ queryKey: ["resumes"], queryFn: () => fetchResumes() });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [mode, setMode] = useState<string>("all");

  const [detailsJob, setDetailsJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [emailJob, setEmailJob] = useState<{ id: string; title: string; company: string } | null>(null);
  const [emailResumeId, setEmailResumeId] = useState<string>("");
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);

  const draftMut = useMutation({
    mutationFn: async () => {
      if (!emailJob) throw new Error("No job");
      if (!emailResumeId) throw new Error("Pick a resume");
      return draft({ data: { resume_id: emailResumeId, job_id: emailJob.id } });
    },
    onSuccess: (d) => setEmailDraft(d),
    onError: (e: Error) => toast.error(e.message),
  });

  const openEmail = (j: { id: string; title: string; company: string }) => {
    setEmailJob(j);
    setEmailDraft(null);
    const master = resumes.find((r) => r.is_master) ?? resumes[0];
    setEmailResumeId(master?.id ?? "");
  };

  const filtered = useMemo(() => jobs.filter((j) => {
    if (type !== "all" && j.job_type !== type) return false;
    if (mode !== "all" && j.mode !== mode) return false;
    if (q && ![j.title, j.company, j.location, (j.skills ?? []).join(" ")].join(" ").toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [jobs, q, type, mode]);

  const saveMut = useMutation({
    mutationFn: async (jobId: string) => save({ data: { job_id: jobId } }),
    onSuccess: () => { toast.success("Saved to your tracker"); qc.invalidateQueries({ queryKey: ["applications"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Find your next role</h1>
        <p className="mt-1 text-muted-foreground">Internships, part-time and full-time roles for students and freshers.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search role, company, skill…" value={q} onChange={(e) => setQ(e.target.value)} maxLength={120} />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modes</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="On-site">On-site</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? <p className="text-muted-foreground">Loading roles…</p> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((j) => (
            <Card
              key={j.id}
              onClick={() => setDetailsJob(j as Job)}
              className="cursor-pointer p-5 transition hover:-translate-y-0.5 hover:shadow-soft focus-within:ring-2 focus-within:ring-primary/40"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetailsJob(j as Job); } }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">{j.title}</h3>
                  <p className="text-sm text-muted-foreground">{j.company}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="secondary">{j.job_type}</Badge>
                  <Badge variant="outline">{j.mode}</Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {j.location}</span>
                {j.stipend && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {j.stipend}</span>}
              </div>
              <p className="mt-3 line-clamp-2 text-sm">{j.description}</p>
              {j.skills && j.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {j.skills.slice(0, 6).map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" className="bg-gradient-hero" onClick={() => setApplyJob(j as Job)}>
                  <Send className="mr-1 h-4 w-4" /> Apply now
                </Button>
                <Button size="sm" variant="outline" onClick={() => saveMut.mutate(j.id)} disabled={saveMut.isPending}>
                  <BookmarkPlus className="mr-1 h-4 w-4" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEmail({ id: j.id, title: j.title, company: j.company })}>
                  <Mail className="mr-1 h-4 w-4" /> Email recruiter
                </Button>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground">No roles match your filters.</p>}
        </div>
      )}

      {/* Job details dialog */}
      <Dialog open={!!detailsJob} onOpenChange={(o) => { if (!o) setDetailsJob(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailsJob && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{detailsJob.title}</DialogTitle>
                <DialogDescription className="text-base">{detailsJob.company}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{detailsJob.job_type}</Badge>
                <Badge variant="outline">{detailsJob.mode}</Badge>
                <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" />{detailsJob.location}</Badge>
                {detailsJob.stipend && <Badge variant="outline" className="gap-1"><Briefcase className="h-3 w-3" />{detailsJob.stipend}</Badge>}
              </div>
              <div>
                <h4 className="mb-1 text-sm font-semibold">About the role</h4>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{detailsJob.description}</p>
              </div>
              {detailsJob.requirements && detailsJob.requirements.length > 0 && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold">Requirements</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {detailsJob.requirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {detailsJob.skills && detailsJob.skills.length > 0 && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {detailsJob.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                  </div>
                </div>
              )}
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => { const j = detailsJob; setDetailsJob(null); openEmail({ id: j.id, title: j.title, company: j.company }); }}>
                  <Mail className="mr-1 h-4 w-4" /> Email recruiter
                </Button>
                <Button className="bg-gradient-hero" onClick={() => { setApplyJob(detailsJob); setDetailsJob(null); }}>
                  <Send className="mr-1 h-4 w-4" /> Apply now
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Application form */}
      <ApplyDialog
        job={applyJob}
        onClose={() => setApplyJob(null)}
        resumes={resumes}
        defaults={{ full_name: profile?.full_name ?? "", email: (profile as { email?: string } | null)?.email ?? "" }}
        onSubmit={async (payload) => {
          await apply({ data: payload });
          toast.success("Application submitted");
          qc.invalidateQueries({ queryKey: ["applications"] });
          setApplyJob(null);
        }}
      />

      {/* Email recruiter dialog */}
      <Dialog open={!!emailJob} onOpenChange={(o) => { if (!o) setEmailJob(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Email a recruiter at {emailJob?.company}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Use resume</label>
              <Select value={emailResumeId} onValueChange={setEmailResumeId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pick a resume" /></SelectTrigger>
                <SelectContent>
                  {resumes.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}{r.is_master ? " (Master)" : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => draftMut.mutate()} disabled={draftMut.isPending || !emailResumeId} className="bg-gradient-hero">
              {draftMut.isPending ? "Drafting…" : emailDraft ? "Regenerate" : "Draft with AI"}
            </Button>
            {emailDraft && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">Subject</label>
                  <Input value={emailDraft.subject} onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Body</label>
                  <Textarea rows={12} value={emailDraft.body} onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`); toast.success("Copied"); }}><Copy className="mr-1 h-4 w-4" /> Copy</Button>
                  <Button size="sm" asChild><a href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`} target="_blank" rel="noreferrer"><Mail className="mr-1 h-4 w-4" /> Open in Gmail</a></Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ApplyPayload = {
  job_id: string; full_name: string; email: string; phone?: string; skills?: string;
  cover_note?: string; resume_id?: string | null; resume_path?: string | null;
};

function ApplyDialog({
  job, onClose, resumes, defaults, onSubmit,
}: {
  job: Job | null;
  onClose: () => void;
  resumes: Array<{ id: string; name: string; is_master?: boolean | null }>;
  defaults: { full_name: string; email: string };
  onSubmit: (p: ApplyPayload) => Promise<void>;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState("");
  const [note, setNote] = useState("");
  const [resumeId, setResumeId] = useState<string>("none");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset when opening for a new job
  useMemo(() => {
    if (job) {
      setFullName(defaults.full_name || "");
      setEmail(defaults.email || "");
      setPhone(""); setSkills((job.skills ?? []).slice(0, 5).join(", "));
      setNote(""); setFile(null);
      const master = resumes.find((r) => r.is_master) ?? resumes[0];
      setResumeId(master?.id ?? "none");
    }
  }, [job]);

  const submit = async () => {
    if (!job) return;
    if (!fullName.trim() || !email.trim()) { toast.error("Name and email are required"); return; }
    if (file && file.size > 5 * 1024 * 1024) { toast.error("Resume file must be under 5MB"); return; }
    setSubmitting(true);
    try {
      let resume_path: string | null = null;
      if (file) {
        const { data: session } = await supabase.auth.getSession();
        const uid = session.session?.user.id;
        if (!uid) throw new Error("Sign in required");
        const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
        const path = `${uid}/${job.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("applicant-resumes").upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw new Error(upErr.message);
        resume_path = path;
      }
      await onSubmit({
        job_id: job.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        skills: skills.trim() || undefined,
        cover_note: note.trim() || undefined,
        resume_id: resumeId && resumeId !== "none" ? resumeId : null,
        resume_path,
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!job} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {job && (
          <>
            <DialogHeader>
              <DialogTitle>Apply for {job.title}</DialogTitle>
              <DialogDescription>at {job.company}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Field label="Full name *"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} /></Field>
              <Field label="Email *"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} /></Field>
              <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} placeholder="Optional" /></Field>
              <Field label="Key skills"><Input value={skills} onChange={(e) => setSkills(e.target.value)} maxLength={600} placeholder="e.g. React, Node.js, SQL" /></Field>
              <Field label="Cover note"><Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="Why you're a great fit (optional)" /></Field>

              {resumes.length > 0 && (
                <Field label="Attach a resume from your library">
                  <Select value={resumeId} onValueChange={setResumeId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No resume from library</SelectItem>
                      {resumes.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}{r.is_master ? " (Master)" : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field label="Or upload a resume file (PDF/DOC, max 5MB)">
                {file ? (
                  <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <span className="truncate">{file.name}</span>
                    <Button type="button" size="icon" variant="ghost" onClick={() => setFile(null)} aria-label="Remove file">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground hover:bg-muted/40">
                    <Upload className="h-4 w-4" />
                    <span>Click to upload</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button onClick={submit} disabled={submitting} className="bg-gradient-hero">
                {submitting ? "Submitting…" : "Submit application"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
