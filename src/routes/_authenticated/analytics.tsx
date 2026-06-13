import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { listApplications } from "@/lib/api/applications.functions";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

const STATUS_COLORS: Record<string, string> = {
  saved: "hsl(220 14% 60%)",
  applied: "hsl(217 91% 60%)",
  interview: "hsl(43 96% 56%)",
  offer: "hsl(142 71% 45%)",
  rejected: "hsl(0 84% 60%)",
};

function AnalyticsPage() {
  const fetchApps = useServerFn(listApplications);
  const { data: apps = [] } = useQuery({ queryKey: ["applications"], queryFn: () => fetchApps() });

  const { byStatus, byWeek, successRate, total } = useMemo(() => {
    const counts: Record<string, number> = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
    for (const a of apps) counts[a.status] = (counts[a.status] || 0) + 1;
    const byStatus = Object.entries(counts).map(([status, count]) => ({ status, count, fill: STATUS_COLORS[status] }));

    const weeks: Record<string, number> = {};
    for (const a of apps) {
      const d = new Date(a.created_at);
      const key = `${d.getFullYear()}-W${Math.ceil((d.getDate() + 6 - d.getDay()) / 7)}-${d.getMonth() + 1}`;
      const label = `${d.toLocaleString("en", { month: "short" })} ${d.getDate()}`;
      weeks[label] = (weeks[label] || 0) + 1;
    }
    const byWeek = Object.entries(weeks).map(([date, count]) => ({ date, count })).slice(-12);

    const applied = apps.filter((a) => a.status !== "saved").length;
    const successRate = applied > 0 ? Math.round((counts.offer / applied) * 100) : 0;
    return { byStatus, byWeek, successRate, total: apps.length };
  }, [apps]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Visualise your job hunt progress and success rate.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-xs uppercase tracking-wide text-muted-foreground">Total applications</p><p className="mt-2 font-display text-3xl font-bold">{total}</p></Card>
        <Card className="p-5"><p className="text-xs uppercase tracking-wide text-muted-foreground">Success rate</p><p className="mt-2 font-display text-3xl font-bold">{successRate}%</p></Card>
        <Card className="p-5"><p className="text-xs uppercase tracking-wide text-muted-foreground">Active pipeline</p><p className="mt-2 font-display text-3xl font-bold">{byStatus.find(s=>s.status==="applied")!.count + byStatus.find(s=>s.status==="interview")!.count}</p></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Applications by status</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="status" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold">Status breakdown</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                  {byStatus.map((d) => <Cell key={d.status} fill={d.fill} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold">Activity over time</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byWeek}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="count" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
