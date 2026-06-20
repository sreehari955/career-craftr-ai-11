import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getResume, upsertResume } from "@/lib/api/resumes.functions";
import { scoreResumeATS, analyzeJobDescription, enhanceBullet } from "@/lib/api/ai.functions";
import { listJobs } from "@/lib/api/jobs.functions";
import { ArrowLeft, Plus, Save, Sparkles, Trash2, X, Wand2, Download, GitBranch, Eye } from "lucide-react";
import { toast } from "sonner";
import { downloadResumePdf } from "@/lib/resume-pdf";
import { ResumePreview, TEMPLATES, type TemplateId } from "@/components/resume-preview";
import { buildContactLine } from "@/lib/api/resumes.functions";

export const Route = createFileRoute("/_authenticated/resumes/$id")({
  component: ResumeEditor,
});

type ContactT = { email: string; phone: string; location: string; linkedin: string; website: string; github: string };
type Content = {
  contact: ContactT;
  summary: string;
  education: { school: string; degree: string; year: string; details: string }[];
  experience: { role: string; company: string; period: string; bullets: string[] }[];
  projects: { name: string; tech: string; bullets: string[] }[];
  skills: string[];
  certifications: string[];
  achievements: string[];
  languages: string[];
};

const blankContact: ContactT = { email: "", phone: "", location: "", linkedin: "", website: "", github: "" };
const blank: Content = { contact: blankContact, summary: "", education: [], experience: [], projects: [], skills: [], certifications: [], achievements: [], languages: [] };

function ResumeEditor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchResume = useServerFn(getResume);
  const save = useServerFn(upsertResume);
  const score = useServerFn(scoreResumeATS);
  const fetchJobs = useServerFn(listJobs);
  const analyzeJD = useServerFn(analyzeJobDescription);
  const enhance = useServerFn(enhanceBullet);

  const { data: resume, isLoading } = useQuery({ queryKey: ["resume", id], queryFn: () => fetchResume({ data: { id } }) });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => fetchJobs() });

  const [name, setName] = useState("");
  const [isMaster, setIsMaster] = useState(false);
  const [jobId, setJobId] = useState<string>("none");
  const [content, setContent] = useState<Content>(blank);
  const [feedback, setFeedback] = useState<Awaited<ReturnType<typeof score>> | null>(null);
  const [template, setTemplate] = useState<TemplateId>("modern");
  const [showPreview, setShowPreview] = useState(true);
  const [jdText, setJdText] = useState("");
  const [jdAnalysis, setJdAnalysis] = useState<Awaited<ReturnType<typeof analyzeJD>> | null>(null);

  useEffect(() => {
    if (resume) {
      setName(resume.name);
      setIsMaster(resume.is_master);
      setJobId(resume.job_id ?? "none");
      const c = (resume.content ?? {}) as Partial<Content>;
      setContent({ ...blank, ...c, contact: { ...blankContact, ...(c.contact ?? {}) } });
      setFeedback(resume.ats_feedback as Awaited<ReturnType<typeof score>> | null);
    }
  }, [resume]);

  const contactLine = buildContactLine(content.contact);

  const saveMut = useMutation({
    mutationFn: async () => save({ data: { id, name, is_master: isMaster, job_id: jobId === "none" ? null : jobId, content } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["resume", id] }); qc.invalidateQueries({ queryKey: ["resumes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const scoreMut = useMutation({
    mutationFn: async () => {
      await save({ data: { id, name, is_master: isMaster, job_id: jobId === "none" ? null : jobId, content } });
      return score({ data: { resume_id: id, job_id: jobId === "none" ? undefined : jobId, job_description: jdText.trim() || undefined } });
    },
    onSuccess: (data) => { setFeedback(data); toast.success(`ATS score: ${data.score}/100`); qc.invalidateQueries({ queryKey: ["resumes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const jdMut = useMutation({
    mutationFn: async () => analyzeJD({ data: { job_description: jdText } }),
    onSuccess: (d) => { setJdAnalysis(d); toast.success("Job description analyzed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Local keyword matching against resume skills + bullets
  const resumeTextLower = JSON.stringify(content).toLowerCase();
  const resumeSkillsLower = content.skills.map((s) => s.toLowerCase());
  const jdKeywords = jdAnalysis ? Array.from(new Set([...jdAnalysis.required_skills, ...jdAnalysis.preferred_skills, ...jdAnalysis.technologies, ...jdAnalysis.keywords])) : [];
  const matched = jdKeywords.filter((k) => resumeTextLower.includes(k.toLowerCase()) || resumeSkillsLower.includes(k.toLowerCase()));
  const missing = jdKeywords.filter((k) => !matched.includes(k));
  const matchPct = jdKeywords.length ? Math.round((matched.length / jdKeywords.length) * 100) : 0;

  if (isLoading || !resume) return <p>Loading resume…</p>;

  const upd = <K extends keyof Content>(k: K, v: Content[K]) => setContent((c) => ({ ...c, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link to="/resumes"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link></Button>
          <div>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-64 font-display text-base font-semibold" maxLength={120} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={isMaster} onCheckedChange={setIsMaster} id="master" />
            <Label htmlFor="master">Master resume</Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
            <Eye className="mr-1 h-4 w-4" /> {showPreview ? "Hide preview" : "Show preview"}
          </Button>
          <Button asChild variant="outline" size="sm"><Link to="/resume-history/$id" params={{ id }}><GitBranch className="mr-1 h-4 w-4" /> History</Link></Button>
          <Button variant="outline" size="sm" onClick={() => downloadResumePdf(name, content, contactLine, template)}><Download className="mr-1 h-4 w-4" /> PDF</Button>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}><Save className="mr-1 h-4 w-4" /> Save</Button>
        </div>
      </div>

      {showPreview && (
        <Card className="overflow-hidden bg-slate-100 p-0">
          <div className="flex flex-wrap items-center gap-2 border-b bg-white px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Template</span>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={cnTpl(template === t.id, t.available)}
                title={t.description}
              >
                {t.name}{!t.available && <span className="ml-1 text-[10px] opacity-70">(soon)</span>}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">Hardcopy preview · A4</span>
          </div>
          <div className="max-h-[820px] overflow-auto p-6 md:p-10">
            <div className="origin-top" style={{ transform: "scale(0.85)", transformOrigin: "top center" }}>
              <ResumePreview template={template} name={name} contact={contactLine} content={content} />
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h3 className="font-semibold">Contact</h3>
            <p className="mt-1 text-xs text-muted-foreground">Recruiters and ATS systems scan these first. Use a professional email and full URLs.</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <Input value={content.contact.email} onChange={(e) => upd("contact", { ...content.contact, email: e.target.value })} placeholder="Email (you@example.com)" maxLength={200} type="email" />
              <Input value={content.contact.phone} onChange={(e) => upd("contact", { ...content.contact, phone: e.target.value })} placeholder="Phone (+91 9XXXXXXXXX)" maxLength={50} />
              <Input value={content.contact.location} onChange={(e) => upd("contact", { ...content.contact, location: e.target.value })} placeholder="Location (City, Country)" maxLength={200} />
              <Input value={content.contact.linkedin} onChange={(e) => upd("contact", { ...content.contact, linkedin: e.target.value })} placeholder="LinkedIn URL" maxLength={300} />
              <Input value={content.contact.github} onChange={(e) => upd("contact", { ...content.contact, github: e.target.value })} placeholder="GitHub URL" maxLength={300} />
              <Input value={content.contact.website} onChange={(e) => upd("contact", { ...content.contact, website: e.target.value })} placeholder="Portfolio / Website" maxLength={300} />
            </div>
          </Card>

          <Card className="p-5">
            <Label>Professional summary</Label>
            <Textarea className="mt-2" rows={3} value={content.summary} onChange={(e) => upd("summary", e.target.value)} maxLength={2000} placeholder="2-3 sentences about who you are and what you're looking for." />
          </Card>

          <ListSection title="Education" items={content.education} onChange={(v) => upd("education", v)} blank={{ school: "", degree: "", year: "", details: "" }}
            render={(it, set) => (
              <>
                <Input value={it.school} onChange={(e) => set({ ...it, school: e.target.value })} placeholder="School / college" maxLength={200} />
                <div className="grid gap-2 md:grid-cols-3">
                  <Input value={it.degree} onChange={(e) => set({ ...it, degree: e.target.value })} placeholder="Degree" maxLength={200} />
                  <Input value={it.year} onChange={(e) => set({ ...it, year: e.target.value })} placeholder="Year (e.g. 2022–2026)" maxLength={40} />
                  <Input value={it.details} onChange={(e) => set({ ...it, details: e.target.value })} placeholder="CGPA / honours" maxLength={500} />
                </div>
              </>
            )}
          />

          <BulletsSection title="Experience" items={content.experience} onChange={(v) => upd("experience", v)} blank={{ role: "", company: "", period: "", bullets: [] }}
            onEnhance={async (it, b) => {
              const r = await enhance({ data: { bullet: b, context: `${it.role} at ${it.company}`, job_description: jdText } });
              return r.improved;
            }}
            headerFields={(it, set) => (
              <div className="grid gap-2 md:grid-cols-3">
                <Input value={it.role} onChange={(e) => set({ ...it, role: e.target.value })} placeholder="Role" maxLength={200} />
                <Input value={it.company} onChange={(e) => set({ ...it, company: e.target.value })} placeholder="Company" maxLength={200} />
                <Input value={it.period} onChange={(e) => set({ ...it, period: e.target.value })} placeholder="Period (e.g. Jun 2024 – Aug 2024)" maxLength={80} />
              </div>
            )}
          />

          <BulletsSection title="Projects" items={content.projects} onChange={(v) => upd("projects", v)} blank={{ name: "", tech: "", bullets: [] }}
            onEnhance={async (it, b) => {
              const r = await enhance({ data: { bullet: b, context: `${it.name} (${it.tech})`, job_description: jdText } });
              return r.improved;
            }}
            headerFields={(it, set) => (
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={it.name} onChange={(e) => set({ ...it, name: e.target.value })} placeholder="Project name" maxLength={200} />
                <Input value={it.tech} onChange={(e) => set({ ...it, tech: e.target.value })} placeholder="Stack (e.g. React, Node, Postgres)" maxLength={200} />
              </div>
            )}
          />

          <StringListSection title="Skills" items={content.skills} onChange={(v) => upd("skills", v)} placeholder="React, Python…" />
          <StringListSection title="Certifications" items={content.certifications} onChange={(v) => upd("certifications", v)} placeholder="AWS Cloud Practitioner…" />
          <StringListSection title="Achievements" items={content.achievements} onChange={(v) => upd("achievements", v)} placeholder="Won Smart India Hackathon 2024…" />
          <StringListSection title="Languages" items={content.languages} onChange={(v) => upd("languages", v)} placeholder="English (Fluent), Hindi (Native)…" />
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" /> ATS check</h3>
            <p className="mt-1 text-xs text-muted-foreground">Score this resume against a job to see how well it matches.</p>
            <div className="mt-3 space-y-2">
              <Label className="text-xs">Target role (optional)</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger><SelectValue placeholder="No specific role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General ATS check</SelectItem>
                  {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title} — {j.company}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => scoreMut.mutate()} disabled={scoreMut.isPending} className="w-full bg-gradient-hero">
                <Wand2 className="mr-1 h-4 w-4" /> {scoreMut.isPending ? "Analyzing…" : "Run ATS check"}
              </Button>
            </div>
            {feedback && (
              <div className="mt-5 space-y-3">
                <div>
                  <div className="flex items-baseline gap-2"><span className="font-display text-3xl font-bold">{feedback.score}</span><span className="text-xs text-muted-foreground">/ 100</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-hero" style={{ width: `${feedback.score}%` }} />
                  </div>
                </div>
                {feedback.matched_keywords?.length > 0 && <KeywordList label="Matched" items={feedback.matched_keywords} variant="default" />}
                {feedback.missing_keywords?.length > 0 && <KeywordList label="Add these" items={feedback.missing_keywords} variant="outline" />}
                {feedback.suggestions?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold">Suggestions</h4>
                    <ul className="mt-1 space-y-1.5 text-sm text-muted-foreground">
                      {feedback.suggestions.map((s, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span> {s}</li>)}
                    </ul>
                  </div>
                )}
                {feedback.strengths?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold">Strengths</h4>
                    <ul className="mt-1 space-y-1.5 text-sm text-muted-foreground">
                      {feedback.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-primary">✓</span> {s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function KeywordList({ label, items, variant }: { label: string; items: string[]; variant: "default" | "outline" }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{label}</h4>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.map((k) => <Badge key={k} variant={variant}>{k}</Badge>)}
      </div>
    </div>
  );
}

function cnTpl(active: boolean, available: boolean) {
  const base = "rounded-full border px-3 py-1 text-xs font-medium transition-colors";
  if (active) return base + " border-primary bg-primary text-primary-foreground";
  if (!available) return base + " border-dashed text-muted-foreground/70";
  return base + " hover:bg-muted";
}

function ListSection<T>({ title, items, onChange, blank, render }: {
  title: string; items: T[]; onChange: (v: T[]) => void; blank: T;
  render: (it: T, set: (v: T) => void) => React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <Button size="sm" variant="ghost" onClick={() => onChange([...items, blank])}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      <div className="mt-3 space-y-3">
        {items.map((it, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            {render(it, (v) => onChange(items.map((x, j) => j === i ? v : x)))}
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BulletsSection<T extends { bullets: string[] }>({ title, items, onChange, blank, headerFields }: {
  title: string; items: T[]; onChange: (v: T[]) => void; blank: T;
  headerFields: (it: T, set: (v: T) => void) => React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <Button size="sm" variant="ghost" onClick={() => onChange([...items, { ...blank }])}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      <div className="mt-3 space-y-4">
        {items.map((it, i) => {
          const set = (v: T) => onChange(items.map((x, j) => j === i ? v : x));
          return (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              {headerFields(it, set)}
              <div className="space-y-1.5">
                {it.bullets.map((b, bi) => (
                  <div key={bi} className="flex gap-2">
                    <Input value={b} onChange={(e) => set({ ...it, bullets: it.bullets.map((x, j) => j === bi ? e.target.value : x) })} placeholder="Impact-focused bullet…" maxLength={500} />
                    <Button size="icon" variant="ghost" onClick={() => set({ ...it, bullets: it.bullets.filter((_, j) => j !== bi) })}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => set({ ...it, bullets: [...it.bullets, ""] })}><Plus className="mr-1 h-4 w-4" /> Add bullet</Button>
              </div>
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /> Remove</Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function StringListSection({ title, items, onChange, placeholder }: { title: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [v, setV] = useState("");
  const add = () => { const t = v.trim(); if (!t) return; if (!items.includes(t)) onChange([...items, t]); setV(""); };
  return (
    <Card className="p-5">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 flex gap-2">
        <Input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} maxLength={300} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <Button onClick={add} variant="outline">Add</Button>
      </div>
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {items.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">{t}<button onClick={() => onChange(items.filter((x) => x !== t))}><X className="h-3 w-3" /></button></Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
