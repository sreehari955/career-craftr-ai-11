import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, Plus, Pencil, Trash2, MapPin, ShieldAlert } from "lucide-react";
import { JobForm, emptyJob, type JobFormValue } from "@/components/job-form";
import { getMyRoles, listMyJobs, upsertJob, deleteJob } from "@/lib/api/jobs.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recruiter")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }, { title: "Recruiter · JobTrack-AI" }] }),
  component: RecruiterPage,
});

function RecruiterPage() {
  const rolesFn = useServerFn(getMyRoles);
  const myJobsFn = useServerFn(listMyJobs);
  const upsert = useServerFn(upsertJob);
  const del = useServerFn(deleteJob);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<JobFormValue | null>(null);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const allowed = roles.includes("recruiter") || roles.includes("admin");

  const { data: jobs = [] } = useQuery({
    queryKey: ["recruiter-jobs"],
    queryFn: () => myJobsFn(),
    enabled: allowed,
  });

  const saveMut = useMutation({
    mutationFn: (v: JobFormValue) => upsert({ data: v }),
    onSuccess: () => {
      toast.success("Job saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Job deleted");
      qc.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (rolesLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!allowed) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-500/10 text-amber-600"><ShieldAlert className="h-6 w-6" /></div>
        <h1 className="mt-3 font-display text-xl font-bold">Recruiter access required</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account isn't approved to post jobs yet. Ask an admin to grant you the recruiter role.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Briefcase className="h-7 w-7 text-primary" /> Recruiter dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Post and manage your company's job openings.</p>
        </div>
        <Button onClick={() => setEditing(emptyJob())} className="bg-gradient-hero">
          <Plus className="mr-1 h-4 w-4" /> Post a job
        </Button>
      </div>

      <div className="grid gap-3">
        {jobs.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground">No jobs yet — click <strong>Post a job</strong> to create your first listing.</Card>
        )}
        {jobs.map((j) => (
          <Card key={j.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{j.title}</h3>
                <Badge variant="secondary">{j.job_type}</Badge>
                <Badge variant="outline">{j.mode}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{j.company} · <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span></p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing({
                id: j.id, title: j.title, company: j.company, location: j.location, job_type: j.job_type, mode: j.mode,
                description: j.description, requirements: j.requirements ?? [], skills: j.skills ?? [], stipend: j.stipend, apply_url: j.apply_url,
              })}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Delete "${j.title}"?`)) deleteMut.mutate(j.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit job" : "Post a job"}</DialogTitle></DialogHeader>
          {editing && (
            <JobForm
              initial={editing}
              submitting={saveMut.isPending}
              onCancel={() => setEditing(null)}
              onSubmit={(v) => saveMut.mutate(v)}
              submitLabel={editing.id ? "Update job" : "Publish job"}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
