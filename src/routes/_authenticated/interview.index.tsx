import { createFileRoute, Link } from "@tanstack/react-router";
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
import { listSessions, createInterviewSession, deleteSession } from "@/lib/api/interview.functions";
import { listJobs } from "@/lib/api/jobs.functions";
import { MessagesSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/interview/")({
  component: InterviewIndex,
});

function InterviewIndex() {
  const qc = useQueryClient();
  const fetchSessions = useServerFn(listSessions);
  const fetchJobs = useServerFn(listJobs);
  const create = useServerFn(createInterviewSession);
  const remove = useServerFn(deleteSession);

  const { data: sessions = [] } = useQuery({ queryKey: ["interview-sessions"], queryFn: () => fetchSessions() });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => fetchJobs() });

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"job" | "custom">("job");
  const [jobId, setJobId] = useState<string>("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [count, setCount] = useState(6);

  const createMut = useMutation({
    mutationFn: async () => create({ data: mode === "job"
      ? { job_id: jobId, count }
      : { role, company, job_description: jd, count } }),
    onSuccess: ({ id }) => {
      toast.success("Questions ready");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["interview-sessions"] });
      window.location.href = `/interview/${id}`;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["interview-sessions"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Interview practice</h1>
          <p className="mt-1 text-muted-foreground">AI-generated mock questions. Record an answer, then get feedback.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-hero"><Plus className="mr-1 h-4 w-4" /> New session</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate mock questions</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button size="sm" variant={mode === "job" ? "default" : "outline"} onClick={() => setMode("job")}>Pick a job</Button>
                <Button size="sm" variant={mode === "custom" ? "default" : "outline"} onClick={() => setMode("custom")}>Custom role</Button>
              </div>
              {mode === "job" ? (
                <div>
                  <Label className="text-sm">Job</Label>
                  <Select value={jobId} onValueChange={setJobId}>
                    <SelectTrigger><SelectValue placeholder="Pick a job" /></SelectTrigger>
                    <SelectContent>
                      {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title} — {j.company}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <Input placeholder="Role (e.g. Frontend Intern)" value={role} onChange={(e) => setRole(e.target.value)} maxLength={160} />
                  <Input placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={160} />
                  <Textarea placeholder="Paste the job description (optional)" rows={5} value={jd} onChange={(e) => setJd(e.target.value)} maxLength={8000} />
                </>
              )}
              <div>
                <Label className="text-sm">Number of questions: {count}</Label>
                <input type="range" min={3} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-1 w-full" />
              </div>
              <Button onClick={() => createMut.mutate()} disabled={createMut.isPending || (mode === "job" ? !jobId : !role)} className="w-full bg-gradient-hero">
                {createMut.isPending ? "Generating…" : "Generate questions"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length === 0 && (
        <Card className="p-8 text-center">
          <MessagesSquare className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-muted-foreground">No practice sessions yet. Start your first one.</p>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((s) => {
          const qs = (s.questions as unknown[]) ?? [];
          return (
            <Card key={s.id} className="p-4">
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{qs.length} questions · {new Date(s.updated_at).toLocaleDateString()}</p>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/interview/$id" params={{ id: s.id }}>Open</Link></Button>
                <Button size="sm" variant="ghost" onClick={() => delMut.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
