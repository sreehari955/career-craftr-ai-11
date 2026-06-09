import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listAlerts, upsertAlert, deleteAlert, listMatches, markMatchesSeen, runUserAlerts } from "@/lib/api/alerts.functions";
import { Bell, Plus, Trash2, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/alerts")({
  component: AlertsPage,
});

function TagInput({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [v, setV] = useState("");
  const add = () => { const t = v.trim(); if (!t) return; if (!items.includes(t)) onChange([...items, t]); setV(""); };
  return (
    <div>
      <div className="flex gap-2">
        <Input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} maxLength={60} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <Button type="button" variant="outline" onClick={add}>Add</Button>
      </div>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">{t}<button onClick={() => onChange(items.filter((x) => x !== t))}><X className="h-3 w-3" /></button></Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertsPage() {
  const qc = useQueryClient();
  const fetchAlerts = useServerFn(listAlerts);
  const fetchMatches = useServerFn(listMatches);
  const save = useServerFn(upsertAlert);
  const remove = useServerFn(deleteAlert);
  const markSeen = useServerFn(markMatchesSeen);
  const runNow = useServerFn(runUserAlerts);

  const { data: alerts = [] } = useQuery({ queryKey: ["job-alerts"], queryFn: () => fetchAlerts() });
  const { data: matches = [] } = useQuery({ queryKey: ["alert-matches"], queryFn: () => fetchMatches() });

  useEffect(() => {
    markSeen({}).then(() => qc.invalidateQueries({ queryKey: ["unseen-matches"] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);

  const resetForm = () => { setName(""); setKeywords([]); setLocations([]); setJobTypes([]); setModes([]); };

  const saveMut = useMutation({
    mutationFn: async () => save({ data: { name, keywords, locations, job_types: jobTypes, modes, active: true } }),
    onSuccess: async () => {
      toast.success("Alert created");
      setOpen(false); resetForm();
      qc.invalidateQueries({ queryKey: ["job-alerts"] });
      await runNow({});
      qc.invalidateQueries({ queryKey: ["alert-matches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["job-alerts"] }); },
  });

  const toggleType = (t: string, list: string[], set: (v: string[]) => void) => set(list.includes(t) ? list.filter((x) => x !== t) : [...list, t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Job alerts</h1>
          <p className="mt-1 text-muted-foreground">Get notified when new roles match your preferences.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-hero"><Plus className="mr-1 h-4 w-4" /> New alert</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create job alert</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Frontend internships in Bangalore" maxLength={120} /></div>
              <div><Label>Keywords (skills / role)</Label><TagInput items={keywords} onChange={setKeywords} placeholder="react, frontend…" /></div>
              <div><Label>Locations</Label><TagInput items={locations} onChange={setLocations} placeholder="Bangalore, Kochi, Remote…" /></div>
              <div>
                <Label>Job types</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {["Internship", "Part-time", "Full-time"].map((t) => (
                    <Badge key={t} variant={jobTypes.includes(t) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleType(t, jobTypes, setJobTypes)}>{t}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Mode</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {["Remote", "Hybrid", "On-site"].map((t) => (
                    <Badge key={t} variant={modes.includes(t) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleType(t, modes, setModes)}>{t}</Badge>
                  ))}
                </div>
              </div>
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !name.trim()} className="w-full bg-gradient-hero">
                {saveMut.isPending ? "Saving…" : "Save alert"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {alerts.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-muted-foreground">No alerts yet. Create one to get notified when matching roles appear.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {alerts.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{a.name}</h3>
                  <p className="text-xs text-muted-foreground">{a.active ? "Active" : "Paused"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={a.active} onCheckedChange={async (v) => { await save({ data: { id: a.id, name: a.name, keywords: a.keywords ?? [], locations: a.locations ?? [], job_types: a.job_types ?? [], modes: a.modes ?? [], active: v } }); qc.invalidateQueries({ queryKey: ["job-alerts"] }); }} />
                  <Button size="icon" variant="ghost" onClick={() => delMut.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(a.keywords ?? []).map((k) => <Badge key={k} variant="outline">{k}</Badge>)}
                {(a.locations ?? []).map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}
                {(a.job_types ?? []).map((k) => <Badge key={k}>{k}</Badge>)}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h2 className="font-display text-xl font-bold">Recent matches</h2>
        {matches.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No matches yet — we'll check hourly.</p> : (
          <div className="mt-3 space-y-2">
            {matches.map((m) => {
              const j = m.jobs as { id: string; title: string; company: string; location: string; apply_url: string | null } | null;
              if (!j) return null;
              return (
                <Card key={m.id} className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="font-medium">{j.title} <span className="text-muted-foreground">— {j.company}</span></p>
                    <p className="text-xs text-muted-foreground">{j.location} · matched {new Date(m.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline"><Link to="/jobs">View</Link></Button>
                    {j.apply_url && <Button asChild size="sm"><a href={j.apply_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Apply</a></Button>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
