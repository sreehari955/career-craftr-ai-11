import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listCoverLetters, saveCoverLetter, deleteCoverLetter } from "@/lib/api/cover-letters.functions";
import { generateCoverLetter } from "@/lib/api/ai.functions";
import { listResumes } from "@/lib/api/resumes.functions";
import { listJobs } from "@/lib/api/jobs.functions";
import { Mail, Sparkles, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cover-letters")({
  component: CoverLetters,
});

function CoverLetters() {
  const qc = useQueryClient();
  const list = useServerFn(listCoverLetters);
  const save = useServerFn(saveCoverLetter);
  const remove = useServerFn(deleteCoverLetter);
  const generate = useServerFn(generateCoverLetter);
  const fetchResumes = useServerFn(listResumes);
  const fetchJobs = useServerFn(listJobs);

  const { data: letters = [] } = useQuery({ queryKey: ["cover_letters"], queryFn: () => list() });
  const { data: resumes = [] } = useQuery({ queryKey: ["resumes"], queryFn: () => fetchResumes() });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => fetchJobs() });

  const [open, setOpen] = useState(false);
  const [resumeId, setResumeId] = useState("");
  const [jobId, setJobId] = useState("");
  const [tone, setTone] = useState<"enthusiastic" | "professional" | "concise">("enthusiastic");
  const [draft, setDraft] = useState<{ title: string; content: string } | null>(null);

  const gen = useMutation({
    mutationFn: async () => {
      if (!resumeId) throw new Error("Pick a resume");
      if (!jobId) throw new Error("Pick a role");
      return generate({ data: { resume_id: resumeId, job_id: jobId, tone } });
    },
    onSuccess: (data) => { setDraft({ title: `${data.role} — ${data.company}`, content: data.content }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveDraft = useMutation({
    mutationFn: async () => save({ data: { title: draft!.title, content: draft!.content, job_id: jobId || undefined } }),
    onSuccess: () => { toast.success("Saved"); setOpen(false); setDraft(null); qc.invalidateQueries({ queryKey: ["cover_letters"] }); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cover_letters"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Cover letters</h1>
          <p className="mt-1 text-muted-foreground">Authentic, role-tailored letters in seconds.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDraft(null); }}>
          <DialogTrigger asChild><Button className="bg-gradient-hero"><Sparkles className="mr-1 h-4 w-4" /> Generate</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{draft ? "Review your draft" : "Generate a cover letter"}</DialogTitle></DialogHeader>
            {!draft ? (
              <div className="space-y-3">
                <div><Label>Resume</Label>
                  <Select value={resumeId} onValueChange={setResumeId}>
                    <SelectTrigger><SelectValue placeholder="Pick a resume" /></SelectTrigger>
                    <SelectContent>{resumes.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Target role</Label>
                  <Select value={jobId} onValueChange={setJobId}>
                    <SelectTrigger><SelectValue placeholder="Pick a job" /></SelectTrigger>
                    <SelectContent>{jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title} — {j.company}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Tone</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => gen.mutate()} disabled={gen.isPending} className="w-full bg-gradient-hero">
                  {gen.isPending ? "Writing…" : "Generate"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={200} /></div>
                <div><Label>Letter</Label><Textarea rows={14} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} maxLength={10000} /></div>
                <div className="flex gap-2">
                  <Button onClick={() => { navigator.clipboard.writeText(draft.content); toast.success("Copied"); }} variant="outline" className="flex-1"><Copy className="mr-1 h-4 w-4" /> Copy</Button>
                  <Button onClick={() => saveDraft.mutate()} disabled={saveDraft.isPending} className="flex-1 bg-gradient-hero">Save</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {letters.map((l) => (
          <Card key={l.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{l.title}</h3>
                <p className="text-xs text-muted-foreground">{new Date(l.updated_at).toLocaleDateString()}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => del.mutate(l.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm text-muted-foreground">{l.content}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => { navigator.clipboard.writeText(l.content); toast.success("Copied"); }}><Copy className="mr-1 h-4 w-4" /> Copy</Button>
          </Card>
        ))}
        {letters.length === 0 && (
          <Card className="col-span-full p-8 text-center">
            <Mail className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 font-semibold">No cover letters yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Generate one tailored to any role in seconds.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
