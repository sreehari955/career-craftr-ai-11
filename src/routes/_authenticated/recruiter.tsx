import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, Pencil, Trash2, MapPin, ShieldAlert, Users, Calendar, Building2, User } from "lucide-react";
import { JobForm, emptyJob, type JobFormValue } from "@/components/job-form";
import { getMyRoles, listMyJobs, upsertJob, deleteJob } from "@/lib/api/jobs.functions";
import { listMyApplicants, setApplicantStatus, companyStats } from "@/lib/api/company.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recruiter")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }, { title: "Company · JobTrack-AI" }] }),
  component: RecruiterPage,
});

const STATUSES = ["saved", "applied", "interview", "offer", "rejected"] as const;
type AppStatus = (typeof STATUSES)[number];
const statusColors: Record<AppStatus, string> = {
  saved: "bg-slate-500",
  applied: "bg-blue-500",
  interview: "bg-amber-500",
  offer: "bg-emerald-500",
  rejected: "bg-rose-500",
};

function RecruiterPage() {
  const rolesFn = useServerFn(getMyRoles);
  const myJobsFn = useServerFn(listMyJobs);
  const applicantsFn = useServerFn(listMyApplicants);
  const statsFn = useServerFn(companyStats);
  const upsert = useServerFn(upsertJob);
  const del = useServerFn(deleteJob);
  const setStatus = useServerFn(setApplicantStatus);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<JobFormValue | null>(null);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const allowed = roles.includes("recruiter") || roles.includes("admin");

  const { data: jobs = [] } = useQuery({ queryKey: ["recruiter-jobs"], queryFn: () => myJobsFn(), enabled: allowed });
  const { data: applicants = [] } = useQuery({ queryKey: ["recruiter-applicants"], queryFn: () => applicantsFn(), enabled: allowed });
  const { data: stats } = useQuery({ queryKey: ["company-stats"], queryFn: () => statsFn(), enabled: allowed });

  const saveMut = useMutation({
    mutationFn: (v: JobFormValue) => upsert({ data: v }),
    onSuccess: () => {
      toast.success("Job saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      qc.invalidateQueries({ queryKey: ["company-stats"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Job deleted");
      qc.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      qc.invalidateQueries({ queryKey: ["company-stats"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: AppStatus }) => setStatus({ data: v }),
    onSuccess: () => {
      toast.success("Candidate status updated");
      qc.invalidateQueries({ queryKey: ["recruiter-applicants"] });
      qc.invalidateQueries({ queryKey: ["company-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (rolesLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!allowed) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-500/10 text-amber-600"><ShieldAlert className="h-6 w-6" /></div>
        <h1 className="mt-3 font-display text-xl font-bold">Company access required</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account isn't approved to post jobs yet. Ask an admin to grant you the recruiter role.
        </p>
      </Card>
    );
  }

  const interviews = applicants.filter((a) => a.status === "interview");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Building2 className="h-7 w-7 text-primary" /> Company dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Post jobs, review applicants, and manage your hiring pipeline.</p>
        </div>
        <Button onClick={() => setEditing(emptyJob())} className="bg-gradient-hero">
          <Plus className="mr-1 h-4 w-4" /> Post a job
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Briefcase} label="Active jobs" value={stats?.jobs ?? 0} />
        <StatCard icon={Users} label="Total applicants" value={stats?.applicants ?? 0} />
        <StatCard icon={Calendar} label="In interview" value={stats?.interviews ?? 0} />
      </div>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs"><Briefcase className="mr-1 h-4 w-4" /> Jobs</TabsTrigger>
          <TabsTrigger value="applicants"><Users className="mr-1 h-4 w-4" /> Applicants</TabsTrigger>
          <TabsTrigger value="interviews"><Calendar className="mr-1 h-4 w-4" /> Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4 space-y-3">
          {jobs.length === 0 ? (
            <Card className="p-10 text-center">
              <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium">No jobs posted yet</p>
              <p className="text-sm text-muted-foreground">Click <strong>Post a job</strong> to create your first listing.</p>
            </Card>
          ) : (
            jobs.map((j) => (
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
            ))
          )}
        </TabsContent>

        <TabsContent value="applicants" className="mt-4 space-y-3">
          <ApplicantList applicants={applicants} onStatus={(id, status) => statusMut.mutate({ id, status })} />
        </TabsContent>

        <TabsContent value="interviews" className="mt-4 space-y-3">
          <ApplicantList applicants={interviews} onStatus={(id, status) => statusMut.mutate({ id, status })} emptyLabel="No candidates in interview stage yet." />
        </TabsContent>
      </Tabs>

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

type ApplicantRow = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof listMyApplicants>>>>[number];

function ApplicantList({ applicants, onStatus, emptyLabel }: { applicants: ApplicantRow[]; onStatus: (id: string, status: AppStatus) => void; emptyLabel?: string }) {
  if (applicants.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">No applicants yet</p>
        <p className="text-sm text-muted-foreground">{emptyLabel ?? "Applicants will appear here once candidates apply to your jobs."}</p>
      </Card>
    );
  }
  return (
    <div className="grid gap-3">
      {applicants.map((a) => (
        <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 min-w-0">
            {a.candidate?.avatar_url ? (
              <img src={a.candidate.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-muted"><User className="h-5 w-5 text-muted-foreground" /></div>
            )}
            <div className="min-w-0">
              <p className="font-semibold truncate">{a.candidate?.full_name || "Anonymous candidate"}</p>
              <p className="text-xs text-muted-foreground truncate">{a.candidate?.headline || "—"} · applied for <strong>{a.job?.title ?? a.role}</strong></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${statusColors[a.status as AppStatus] ?? "bg-slate-500"} text-white capitalize`}>{a.status}</Badge>
            <Select value={a.status} onValueChange={(v) => onStatus(a.id, v as AppStatus)}>
              <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}
