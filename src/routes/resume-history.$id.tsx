import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { diffWords } from "diff";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listResumeVersions } from "@/lib/api/resume-versions.functions";
import { ArrowLeft, GitBranch } from "lucide-react";
import type { ResumeContentT } from "@/lib/api/resumes.functions";

export const Route = createFileRoute("/resume-history/$id")({
  component: HistoryPage,
});

function contentToText(c: ResumeContentT): string {
  const lines: string[] = [];
  if (c.summary) lines.push("SUMMARY", c.summary, "");
  if (c.experience?.length) {
    lines.push("EXPERIENCE");
    for (const e of c.experience) {
      lines.push(`${e.role} — ${e.company} (${e.period})`);
      e.bullets.forEach((b) => lines.push("• " + b));
      lines.push("");
    }
  }
  if (c.projects?.length) {
    lines.push("PROJECTS");
    for (const p of c.projects) {
      lines.push(`${p.name} (${p.tech})`);
      p.bullets.forEach((b) => lines.push("• " + b));
      lines.push("");
    }
  }
  if (c.education?.length) {
    lines.push("EDUCATION");
    for (const e of c.education) lines.push(`${e.school} — ${e.degree} (${e.year}) ${e.details}`);
    lines.push("");
  }
  if (c.skills?.length) lines.push("SKILLS", c.skills.join(", "), "");
  if (c.certifications?.length) lines.push("CERTIFICATIONS", ...c.certifications.map((x) => "• " + x), "");
  if (c.achievements?.length) lines.push("ACHIEVEMENTS", ...c.achievements.map((x) => "• " + x));
  return lines.join("\n");
}

function HistoryPage() {
  const { id } = Route.useParams();
  const fetch = useServerFn(listResumeVersions);
  const { data, isLoading } = useQuery({ queryKey: ["resume-versions", id], queryFn: () => fetch({ data: { id } }) });

  const versions = data?.versions ?? [];
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");

  // Default: compare master (or oldest) vs newest
  const defaults = useMemo(() => {
    if (versions.length < 2) return { a: "", b: "" };
    const sorted = [...versions].sort((x, y) => (x.version ?? 1) - (y.version ?? 1));
    return { a: sorted[0].id, b: sorted[sorted.length - 1].id };
  }, [versions]);

  const a = versions.find((v) => v.id === (aId || defaults.a));
  const b = versions.find((v) => v.id === (bId || defaults.b));

  const diff = useMemo(() => {
    if (!a || !b) return null;
    const ta = contentToText(a.content as ResumeContentT);
    const tb = contentToText(b.content as ResumeContentT);
    return diffWords(ta, tb);
  }, [a, b]);

  if (isLoading || !data) return <p className="p-6">Loading…</p>;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/resumes/$id" params={{ id }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to resume</Link></Button>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><GitBranch className="h-5 w-5 text-primary" /> Version history</h1>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold">All versions ({versions.length})</h2>
        <div className="mt-3 space-y-1.5">
          {[...versions].sort((x, y) => (x.version ?? 1) - (y.version ?? 1)).map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={v.is_master ? "default" : "outline"}>v{v.version}</Badge>
                <span className="font-medium">{v.name}</span>
                {v.is_master && <Badge variant="secondary">Master</Badge>}
                {v.ats_score != null && <span className="text-xs text-muted-foreground">ATS {v.ats_score}</span>}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(v.updated_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </Card>

      {versions.length < 2 ? (
        <Card className="p-6 text-center text-muted-foreground">Only one version so far. Use "AI tailor for a role" on the Resumes page to generate a tailored version.</Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Left (original)</label>
                <Select value={aId || defaults.a} onValueChange={setAId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => <SelectItem key={v.id} value={v.id}>v{v.version} · {v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Right (compare)</label>
                <Select value={bId || defaults.b} onValueChange={setBId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => <SelectItem key={v.id} value={v.id}>v{v.version} · {v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-2 font-semibold">{a?.name} · v{a?.version}</h3>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed">{a && contentToText(a.content as ResumeContentT)}</pre>
            </Card>
            <Card className="p-4">
              <h3 className="mb-2 font-semibold">{b?.name} · v{b?.version}</h3>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed">{b && contentToText(b.content as ResumeContentT)}</pre>
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="mb-2 font-semibold">Changes</h3>
            <pre className="whitespace-pre-wrap text-xs leading-relaxed">
              {diff?.map((p, i) => (
                <span key={i} className={p.added ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" : p.removed ? "bg-red-100 text-red-900 line-through dark:bg-red-950 dark:text-red-200" : ""}>
                  {p.value}
                </span>
              ))}
            </pre>
          </Card>
        </>
      )}
    </div>
  );
}
