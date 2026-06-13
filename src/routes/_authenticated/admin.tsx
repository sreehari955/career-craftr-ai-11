import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ShieldCheck, KeyRound, Users, IndianRupee, FileText, Briefcase, Settings as SettingsIcon } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  checkAdminAccess,
  adminStats,
  adminListUsers,
  adminListPayments,
  adminGetSettings,
  adminUpdateSetting,
  adminGrantSelf,
} from "@/lib/api/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,nofollow" },
      { title: "Admin · JobTrack-AI" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [authed, setAuthed] = useState(false);
  const check = useServerFn(checkAdminAccess);
  const grant = useServerFn(adminGrantSelf);

  const verify = useMutation({
    mutationFn: () => check({ data: { passcode } }),
    onSuccess: () => { setAuthed(true); toast.success("Admin access granted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const grantMut = useMutation({
    mutationFn: () => grant({ data: { passcode } }),
    onSuccess: () => { toast.success("Admin role granted. Now click Unlock."); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!authed) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-md py-10">
          <Card className="relative overflow-hidden border-slate-800 bg-slate-950 p-8 text-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_60%)]" />
            <div className="relative">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-800 text-blue-400">
                <Shield className="h-6 w-6" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold">Admin access</h1>
              <p className="mt-1 text-sm text-slate-400">Enter the admin passcode to manage the platform. This area is not indexed.</p>
              <div className="mt-6 space-y-3">
                <Label htmlFor="pc" className="text-slate-300">Passcode</Label>
                <Input
                  id="pc"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                  placeholder="••••••••"
                  onKeyDown={(e) => { if (e.key === "Enter") verify.mutate(); }}
                  maxLength={200}
                />
                <Button onClick={() => verify.mutate()} disabled={!passcode || verify.isPending} className="w-full bg-blue-600 hover:bg-blue-500">
                  <KeyRound className="mr-1 h-4 w-4" /> {verify.isPending ? "Verifying…" : "Unlock"}
                </Button>
                <button
                  onClick={() => grantMut.mutate()}
                  disabled={!passcode || grantMut.isPending}
                  className="w-full text-xs text-slate-400 underline-offset-2 hover:text-blue-400 hover:underline"
                >
                  First time? Use passcode to bootstrap yourself as admin
                </button>
              </div>
            </div>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <AdminConsole passcode={passcode} />
    </DashboardShell>
  );
}

function inr(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

function AdminConsole({ passcode }: { passcode: string }) {
  const statsFn = useServerFn(adminStats);
  const usersFn = useServerFn(adminListUsers);
  const paymentsFn = useServerFn(adminListPayments);
  const settingsFn = useServerFn(adminGetSettings);
  const updateSetting = useServerFn(adminUpdateSetting);

  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn({ data: { passcode } }) });
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: () => usersFn({ data: { passcode } }) });
  const { data: payments = [] } = useQuery({ queryKey: ["admin-payments"], queryFn: () => paymentsFn({ data: { passcode } }) });
  const { data: settings = [], refetch: refetchSettings } = useQuery({ queryKey: ["admin-settings"], queryFn: () => settingsFn({ data: { passcode } }) });

  const brand = (settings.find((s) => s.key === "brand")?.value ?? {}) as { name?: string; tagline?: string };
  const pricing = (settings.find((s) => s.key === "pricing")?.value ?? {}) as { premium_paise?: number; label?: string };

  const [brandName, setBrandName] = useState(brand.name ?? "");
  const [brandTagline, setBrandTagline] = useState(brand.tagline ?? "");
  const [premiumPaise, setPremiumPaise] = useState(pricing.premium_paise ?? 19900);
  const [planLabel, setPlanLabel] = useState(pricing.label ?? "");

  const save = useMutation({
    mutationFn: async () => {
      await updateSetting({ data: { passcode, key: "brand", value: { name: brandName, tagline: brandTagline } } });
      await updateSetting({ data: { passcode, key: "pricing", value: { premium_paise: Number(premiumPaise), currency: "INR", label: planLabel } } });
    },
    onSuccess: () => { toast.success("Settings saved"); refetchSettings(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl border border-blue-900/40 bg-slate-950 px-5 py-4 text-slate-100">
        <ShieldCheck className="h-6 w-6 text-blue-400" />
        <div>
          <h1 className="font-display text-xl font-bold">Admin Console</h1>
          <p className="text-xs text-slate-400">You are signed in as admin. All actions are audited.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Users" value={stats?.users ?? 0} />
        <StatCard icon={ShieldCheck} label="Premium" value={stats?.premiumUsers ?? 0} />
        <StatCard icon={FileText} label="Resumes" value={stats?.resumes ?? 0} />
        <StatCard icon={IndianRupee} label="Revenue" value={`₹${stats?.revenueInr ?? 0}`} />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="mr-1 h-4 w-4" /> Users</TabsTrigger>
          <TabsTrigger value="payments"><IndianRupee className="mr-1 h-4 w-4" /> Payments</TabsTrigger>
          <TabsTrigger value="settings"><SettingsIcon className="mr-1 h-4 w-4" /> Site Settings</TabsTrigger>
          <TabsTrigger value="jobs"><Briefcase className="mr-1 h-4 w-4" /> Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Headline</th><th className="px-4 py-2">Plan</th><th className="px-4 py-2">Joined</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="px-4 py-2 font-medium">{u.full_name || "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{u.headline || "—"}</td>
                      <td className="px-4 py-2">{u.is_premium ? <Badge className="bg-blue-600">Premium</Badge> : <Badge variant="outline">Free</Badge>}</td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No users yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-4 py-2">Order</th><th className="px-4 py-2">Plan</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Date</th></tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{p.razorpay_order_id}</td>
                      <td className="px-4 py-2">{p.plan}</td>
                      <td className="px-4 py-2">{inr(p.amount_paise)}</td>
                      <td className="px-4 py-2"><Badge variant={p.status === "paid" ? "default" : "outline"}>{p.status}</Badge></td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No payments yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold">Brand</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div><Label>Brand name</Label><Input className="mt-1" value={brandName} onChange={(e) => setBrandName(e.target.value)} maxLength={80} /></div>
              <div><Label>Tagline</Label><Input className="mt-1" value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} maxLength={160} /></div>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold">Premium pricing</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <Label>Price (in paise — 19900 = ₹199)</Label>
                <Input className="mt-1" type="number" min={100} max={10000000} value={premiumPaise} onChange={(e) => setPremiumPaise(Number(e.target.value))} />
              </div>
              <div><Label>Plan label</Label><Input className="mt-1" value={planLabel} onChange={(e) => setPlanLabel(e.target.value)} maxLength={80} /></div>
            </div>
          </Card>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-gradient-hero">
            {save.isPending ? "Saving…" : "Save settings"}
          </Button>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <Card className="p-6 text-sm text-muted-foreground">
            Job posting management lives in the dashboard <code>/jobs</code> view. Bulk admin moderation tools will land here next.
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600/10 text-blue-600">
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
