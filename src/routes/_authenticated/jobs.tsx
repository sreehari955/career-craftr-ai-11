import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listJobs, saveJobApplication } from "@/lib/api/jobs.functions";
import { MapPin, Briefcase, Search, BookmarkPlus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/jobs")({
  component: JobsPage,
});

function JobsPage() {
  const qc = useQueryClient();
  const fetchJobs = useServerFn(listJobs);
  const save = useServerFn(saveJobApplication);
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: () => fetchJobs() });
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [mode, setMode] = useState<string>("all");

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
            <Card key={j.id} className="p-5">
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
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => saveMut.mutate(j.id)} disabled={saveMut.isPending}>
                  <BookmarkPlus className="mr-1 h-4 w-4" /> Save
                </Button>
                {j.apply_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={j.apply_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" /> Apply</a>
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground">No roles match your filters.</p>}
        </div>
      )}
    </div>
  );
}
