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
import { listApplications, createApplication, updateApplicationStatus, deleteApplication } from "@/lib/api/applications.functions";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tracker")({
  component: Tracker,
});

const columns = [
  { id: "saved", label: "Saved" },
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
] as const;

type Status = (typeof columns)[number]["id"];

function Tracker() {
  const qc = useQueryClient();
  const fetchApps = useServerFn(listApplications);
  const createApp = useServerFn(createApplication);
  const updateStatus = useServerFn(updateApplicationStatus);
  const removeApp = useServerFn(deleteApplication);

  const { data: apps = [] } = useQuery({ queryKey: ["applications"], queryFn: () => fetchApps() });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company: "", role: "", link: "", notes: "", status: "saved" as Status });

  const create = useMutation({
    mutationFn: async () => createApp({ data: { ...form, link: form.link || undefined } }),
    onSuccess: () => { toast.success("Added"); setOpen(false); setForm({ company: "", role: "", link: "", notes: "", status: "saved" }); qc.invalidateQueries({ queryKey: ["applications"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => updateStatus({ data: { id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => removeApp({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Application tracker</h1>
          <p className="mt-1 text-muted-foreground">All your applications, organised in one calm board.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-hero"><Plus className="mr-1 h-4 w-4" /> Add application</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add application</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} maxLength={160} /></div>
              <div><Label>Role</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} maxLength={160} /></div>
              <div><Label>Job link</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://…" maxLength={500} /></div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{columns.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={2000} /></div>
              <Button onClick={() => create.mutate()} disabled={create.isPending || !form.company || !form.role} className="w-full bg-gradient-hero">
                {create.isPending ? "Adding…" : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {columns.map((col) => {
          const items = apps.filter((a) => a.status === col.id);
          return (
            <div key={col.id} className="rounded-xl bg-muted/50 p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((a) => (
                  <Card key={a.id} className="p-3">
                    <p className="text-sm font-semibold">{a.role}</p>
                    <p className="text-xs text-muted-foreground">{a.company}</p>
                    {a.notes && <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{a.notes}</p>}
                    <div className="mt-2 flex items-center gap-1">
                      <Select value={a.status} onValueChange={(v) => move.mutate({ id: a.id, status: v as Status })}>
                        <SelectTrigger className="h-7 flex-1 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{columns.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                      {a.link && <Button asChild size="icon" variant="ghost" className="h-7 w-7"><a href={a.link} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a></Button>}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => del.mutate(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Card>
                ))}
                {items.length === 0 && <p className="px-1 py-3 text-xs text-muted-foreground">Nothing here yet.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
