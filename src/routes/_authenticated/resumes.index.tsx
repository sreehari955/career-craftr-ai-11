import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listResumes, upsertResume, deleteResume, getResume } from "@/lib/api/resumes.functions";
import { listJobs } from "@/lib/api/jobs.functions";
import { tailorResume } from "@/lib/api/ai.functions";
import { FilePlus, Sparkles, Trash2, Star, Wand2, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadResumePdf } from "@/lib/resume-pdf";
import type { ResumeContentT } from "@/lib/api/resumes.functions";

export const Route = createFileRoute("/_authenticated/resumes/")({
  component: ResumesPage,
});

function ResumesPage() {
  const qc = useQueryClient();
  const fetchResumes = useServerFn(listResumes);
  const fetchJobs = useServerFn(listJobs);
  const saveResume = useServerFn(upsertResume);
  const removeResume = useServerFn(deleteResume);
  const tailor = useServerFn(tailorResume);
  const fetchOne = useServerFn(getResume);

  const downloadPdf = async (r: { id: string; name: string }) => {
    const full = await fetchOne({ data: { id: r.id } });
    if (!full) { toast.error("Resume not found"); return; }
    await downloadResumePdf(r.name, full.content as ResumeContentT);
  };


  const { data: resumes = [] } = useQuery({ queryKey: ["resumes"], queryFn: () => fetchResumes() });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => fetchJobs() });

  const master = resumes.find((r) => r.is_master);

  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);
  const [tailorJob, setTailorJob] = useState<string>("");
  const [tailorName, setTailorName] = useState("");
  const [tailorOpen, setTailorOpen] = useState(false);

  const createBlank = useMutation({
    mutationFn: async (name: string) => saveResume({ data: { name, is_master: !master, content: {
      summary: "", education: [], experience: [], projects: [], skills: [], certifications: [], achievements: [],
    } } }),
    onSuccess: ({ id }) => { setOpen(false); setNewName(""); qc.invalidateQueries({ queryKey: ["resumes"] }); window.location.href = `/resumes/${id}`; },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => removeResume({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["resumes"] }); },
  });

  const tailorMut = useMutation({
    mutationFn: async () => {
      if (!master) throw new Error("Set a master resume first");
      if (!tailorJob) throw new Error("Pick a job");
      return tailor({ data: { master_resume_id: master.id, job_id: tailorJob, new_name: tailorName || "Tailored resume" } });
    },
    onSuccess: ({ id }) => {
      toast.success("Tailored resume created");
      setTailorOpen(false); setTailorJob(""); setTailorName("");
      qc.invalidateQueries({ queryKey: ["resumes"] });
      window.location.href = `/resumes/${id}`;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Resumes</h1>
          <p className="mt-1 text-muted-foreground">Build one master resume, then tailor it for each role.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={tailorOpen} onOpenChange={setTailorOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!master}><Wand2 className="mr-1 h-4 w-4" /> AI tailor for a role</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Tailor your master resume</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm">Target role</label>
                  <Select value={tailorJob} onValueChange={setTailorJob}>
                    <SelectTrigger><SelectValue placeholder="Pick a job" /></SelectTrigger>
                    <SelectContent>
                      {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title} — {j.company}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm">Name for this version</label>
                  <Input value={tailorName} onChange={(e) => setTailorName(e.target.value)} placeholder="e.g. Razorpay - Frontend Intern" maxLength={160} />
                </div>
                <Button onClick={() => tailorMut.mutate()} disabled={tailorMut.isPending} className="w-full bg-gradient-hero">
                  {tailorMut.isPending ? "AI is tailoring…" : "Generate"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-hero"><FilePlus className="mr-1 h-4 w-4" /> New resume</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create resume</DialogTitle></DialogHeader>
              <Input placeholder="Resume name (e.g. Master Resume)" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={120} />
              <Button onClick={() => newName.trim() && createBlank.mutate(newName.trim())} disabled={createBlank.isPending || !newName.trim()} className="bg-gradient-hero">
                {createBlank.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!master && resumes.length === 0 && (
        <Card className="p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-3 font-display text-xl font-semibold">Start with your master resume</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">It collects everything about you — projects, internships, skills. From there, generate tailored versions for any role in one click.</p>
          <Button onClick={() => setOpen(true)} className="mt-4 bg-gradient-hero"><FilePlus className="mr-1 h-4 w-4" /> Create master resume</Button>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resumes.map((r) => (
          <Card key={r.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{r.name}</h3>
                <p className="text-xs text-muted-foreground">Updated {new Date(r.updated_at).toLocaleDateString()}</p>
              </div>
              {r.is_master && <Badge className="bg-primary"><Star className="mr-1 h-3 w-3" /> Master</Badge>}
            </div>
            {r.ats_score != null && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">ATS score</span>
                  <span className="font-semibold">{r.ats_score}/100</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-hero" style={{ width: `${r.ats_score}%` }} />
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/resumes/$id" params={{ id: r.id }}>Open</Link></Button>
              <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
