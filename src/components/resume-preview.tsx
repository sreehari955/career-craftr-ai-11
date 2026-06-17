import { cn } from "@/lib/utils";
import type { ResumeContentT } from "@/lib/api/resumes.functions";

export type TemplateId = "modern" | "classic" | "minimalist" | "creative";

export const TEMPLATES: { id: TemplateId; name: string; description: string; available: boolean }[] = [
  { id: "modern", name: "Modern", description: "Clean single column, blue accents, ATS-friendly", available: true },
  { id: "classic", name: "Classic", description: "Serif, traditional centered header", available: true },
  { id: "minimalist", name: "Minimalist", description: "Lots of whitespace, thin dividers", available: true },
  { id: "creative", name: "Creative", description: "Two-column sidebar with accent block", available: true },
];

export function ResumePreview({
  template = "modern",
  name,
  contact,
  content,
  scale = 1,
}: {
  template?: TemplateId;
  name: string;
  contact?: string;
  content: ResumeContentT;
  scale?: number;
}) {
  return (
    <div
      className="mx-auto"
      style={{ width: 794, transform: `scale(${scale})`, transformOrigin: "top center" }}
    >
      <div
        className="relative bg-white text-slate-900"
        style={{
          minHeight: 1123,
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.06), 0 12px 24px -8px rgba(15,23,42,0.18), 0 30px 60px -20px rgba(15,23,42,0.25)",
          borderRadius: 2,
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
        {template === "modern" && <ModernTemplate name={name} contact={contact} content={content} />}
        {template === "classic" && <ClassicTemplate name={name} contact={contact} content={content} />}
        {template === "minimalist" && <MinimalistTemplate name={name} contact={contact} content={content} />}
        {template === "creative" && <CreativeTemplate name={name} contact={contact} content={content} />}
      </div>
    </div>
  );
}

function Bullets({ items, color = "text-blue-600" }: { items: string[]; color?: string }) {
  const cleaned = items.filter(Boolean);
  if (!cleaned.length) return null;
  return (
    <ul className="mt-1 space-y-1 pl-4 text-[12.5px] leading-snug">
      {cleaned.map((b, i) => (
        <li key={i} className={cn("list-disc", `marker:${color}`)}>{b}</li>
      ))}
    </ul>
  );
}

/* ---------------- MODERN ---------------- */
function ModernTemplate({ name, contact, content }: { name: string; contact?: string; content: ResumeContentT }) {
  const SH = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mt-6 mb-2 border-b border-blue-600/70 pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">{children}</h2>
  );
  return (
    <div className="px-14 py-12 font-sans antialiased">
      <header className="border-b-2 border-blue-600 pb-3">
        <h1 className="font-display text-[28px] font-bold tracking-tight">{name || "Your Name"}</h1>
        {contact && <p className="mt-1 text-[12.5px] text-slate-600">{contact}</p>}
      </header>
      {content.summary && (<><SH>Summary</SH><p className="text-[12.5px] leading-relaxed text-slate-700">{content.summary}</p></>)}
      {content.experience.length > 0 && (<><SH>Experience</SH><div className="space-y-3">
        {content.experience.map((e, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13.5px] font-semibold">{e.role}{e.company && <span className="font-normal text-slate-600"> · {e.company}</span>}</p>
              <p className="shrink-0 text-[11.5px] text-slate-500">{e.period}</p>
            </div>
            <Bullets items={e.bullets} />
          </div>
        ))}
      </div></>)}
      {content.projects.length > 0 && (<><SH>Projects</SH><div className="space-y-3">
        {content.projects.map((p, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13.5px] font-semibold">{p.name}</p>
              <p className="shrink-0 text-[11.5px] text-slate-500">{p.tech}</p>
            </div>
            <Bullets items={p.bullets} />
          </div>
        ))}
      </div></>)}
      {content.education.length > 0 && (<><SH>Education</SH><div className="space-y-2">
        {content.education.map((e, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13px] font-semibold">{e.school}</p>
              <p className="shrink-0 text-[11.5px] text-slate-500">{e.year}</p>
            </div>
            <p className="text-[12px] text-slate-600">{[e.degree, e.details].filter(Boolean).join(" · ")}</p>
          </div>
        ))}
      </div></>)}
      {content.skills.length > 0 && (<><SH>Skills</SH><p className="text-[12.5px] text-slate-700">{content.skills.join(" · ")}</p></>)}
      {content.certifications.length > 0 && (<><SH>Certifications</SH><Bullets items={content.certifications} /></>)}
      {content.achievements.length > 0 && (<><SH>Achievements</SH><Bullets items={content.achievements} /></>)}
      {(content.languages?.length ?? 0) > 0 && (<><SH>Languages</SH><p className="text-[12.5px] text-slate-700">{content.languages!.join(" · ")}</p></>)}
    </div>
  );
}

/* ---------------- CLASSIC ---------------- */
function ClassicTemplate({ name, contact, content }: { name: string; contact?: string; content: ResumeContentT }) {
  const SH = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mt-5 mb-2 border-b border-slate-800 pb-0.5 text-center text-[12px] font-bold uppercase tracking-[0.25em] text-slate-900">{children}</h2>
  );
  return (
    <div className="px-16 py-14 font-serif text-slate-900">
      <header className="text-center">
        <h1 className="text-[30px] font-bold tracking-wide">{name || "Your Name"}</h1>
        {contact && <p className="mt-1 text-[12px] italic text-slate-700">{contact}</p>}
      </header>
      {content.summary && (<><SH>Profile</SH><p className="text-[12.5px] leading-relaxed text-justify">{content.summary}</p></>)}
      {content.experience.length > 0 && (<><SH>Professional Experience</SH><div className="space-y-3">
        {content.experience.map((e, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13px] font-bold">{e.company}</p>
              <p className="shrink-0 text-[11.5px] italic">{e.period}</p>
            </div>
            <p className="text-[12.5px] italic text-slate-700">{e.role}</p>
            <Bullets items={e.bullets} color="text-slate-800" />
          </div>
        ))}
      </div></>)}
      {content.education.length > 0 && (<><SH>Education</SH><div className="space-y-2">
        {content.education.map((e, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13px] font-bold">{e.school}</p>
              <p className="shrink-0 text-[11.5px] italic">{e.year}</p>
            </div>
            <p className="text-[12px] italic text-slate-700">{[e.degree, e.details].filter(Boolean).join(" — ")}</p>
          </div>
        ))}
      </div></>)}
      {content.projects.length > 0 && (<><SH>Projects</SH><div className="space-y-3">
        {content.projects.map((p, i) => (
          <div key={i}>
            <p className="text-[13px] font-bold">{p.name} <span className="font-normal italic text-slate-700">— {p.tech}</span></p>
            <Bullets items={p.bullets} color="text-slate-800" />
          </div>
        ))}
      </div></>)}
      {content.skills.length > 0 && (<><SH>Skills</SH><p className="text-center text-[12.5px]">{content.skills.join(" • ")}</p></>)}
      {content.certifications.length > 0 && (<><SH>Certifications</SH><Bullets items={content.certifications} color="text-slate-800" /></>)}
      {content.achievements.length > 0 && (<><SH>Honors & Achievements</SH><Bullets items={content.achievements} color="text-slate-800" /></>)}
    </div>
  );
}

/* ---------------- MINIMALIST ---------------- */
function MinimalistTemplate({ name, contact, content }: { name: string; contact?: string; content: ResumeContentT }) {
  const SH = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mt-8 mb-3 text-[10px] font-medium uppercase tracking-[0.32em] text-slate-500">{children}</h2>
  );
  return (
    <div className="px-20 py-16 font-sans text-slate-800">
      <header>
        <h1 className="text-[34px] font-light tracking-tight text-slate-900">{name || "Your Name"}</h1>
        {contact && <p className="mt-2 text-[12px] text-slate-500">{contact}</p>}
        <div className="mt-5 h-px w-12 bg-slate-300" />
      </header>
      {content.summary && (<><SH>About</SH><p className="text-[13px] leading-relaxed text-slate-700">{content.summary}</p></>)}
      {content.experience.length > 0 && (<><SH>Experience</SH><div className="space-y-5">
        {content.experience.map((e, i) => (
          <div key={i} className="grid grid-cols-[110px_1fr] gap-6">
            <p className="text-[11.5px] text-slate-500">{e.period}</p>
            <div>
              <p className="text-[13.5px] font-medium text-slate-900">{e.role}</p>
              <p className="text-[12px] text-slate-500">{e.company}</p>
              <Bullets items={e.bullets} color="text-slate-400" />
            </div>
          </div>
        ))}
      </div></>)}
      {content.projects.length > 0 && (<><SH>Projects</SH><div className="space-y-5">
        {content.projects.map((p, i) => (
          <div key={i} className="grid grid-cols-[110px_1fr] gap-6">
            <p className="text-[11.5px] text-slate-500">{p.tech}</p>
            <div>
              <p className="text-[13.5px] font-medium text-slate-900">{p.name}</p>
              <Bullets items={p.bullets} color="text-slate-400" />
            </div>
          </div>
        ))}
      </div></>)}
      {content.education.length > 0 && (<><SH>Education</SH><div className="space-y-3">
        {content.education.map((e, i) => (
          <div key={i} className="grid grid-cols-[110px_1fr] gap-6">
            <p className="text-[11.5px] text-slate-500">{e.year}</p>
            <div>
              <p className="text-[13px] font-medium text-slate-900">{e.school}</p>
              <p className="text-[12px] text-slate-500">{[e.degree, e.details].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
        ))}
      </div></>)}
      {content.skills.length > 0 && (<><SH>Skills</SH><p className="text-[12.5px] leading-relaxed text-slate-700">{content.skills.join("   ·   ")}</p></>)}
      {content.certifications.length > 0 && (<><SH>Certifications</SH><Bullets items={content.certifications} color="text-slate-400" /></>)}
      {content.achievements.length > 0 && (<><SH>Achievements</SH><Bullets items={content.achievements} color="text-slate-400" /></>)}
    </div>
  );
}

/* ---------------- CREATIVE ---------------- */
function CreativeTemplate({ name, contact, content }: { name: string; contact?: string; content: ResumeContentT }) {
  const SH = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
    <h2 className={cn("mt-5 mb-2 text-[11px] font-bold uppercase tracking-[0.18em]", light ? "text-blue-200" : "text-blue-700")}>{children}</h2>
  );
  return (
    <div className="grid min-h-[1123px] grid-cols-[260px_1fr] font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="bg-gradient-to-b from-blue-700 to-blue-900 px-7 py-10 text-white">
        <h1 className="font-display text-[24px] font-bold leading-tight">{name || "Your Name"}</h1>
        {contact && <p className="mt-2 text-[11.5px] leading-relaxed text-blue-100">{contact}</p>}
        {content.skills.length > 0 && (
          <>
            <SH light>Skills</SH>
            <ul className="space-y-1 text-[12px] text-blue-50">
              {content.skills.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </>
        )}
        {content.education.length > 0 && (
          <>
            <SH light>Education</SH>
            <div className="space-y-3">
              {content.education.map((e, i) => (
                <div key={i}>
                  <p className="text-[12.5px] font-semibold">{e.school}</p>
                  <p className="text-[11px] text-blue-100">{[e.degree, e.year].filter(Boolean).join(" · ")}</p>
                  {e.details && <p className="text-[11px] text-blue-200">{e.details}</p>}
                </div>
              ))}
            </div>
          </>
        )}
        {content.certifications.length > 0 && (
          <>
            <SH light>Certifications</SH>
            <ul className="space-y-1 text-[12px] text-blue-50">
              {content.certifications.map((c, i) => <li key={i}>• {c}</li>)}
            </ul>
          </>
        )}
        {content.achievements.length > 0 && (
          <>
            <SH light>Achievements</SH>
            <ul className="space-y-1 text-[12px] text-blue-50">
              {content.achievements.map((a, i) => <li key={i}>• {a}</li>)}
            </ul>
          </>
        )}
      </aside>
      {/* Main */}
      <main className="px-9 py-10">
        {content.summary && (<><SH>Profile</SH><p className="text-[12.5px] leading-relaxed text-slate-700">{content.summary}</p></>)}
        {content.experience.length > 0 && (<><SH>Experience</SH><div className="space-y-3">
          {content.experience.map((e, i) => (
            <div key={i} className="relative pl-4">
              <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-blue-600" />
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13.5px] font-semibold">{e.role}<span className="font-normal text-slate-600"> · {e.company}</span></p>
                <p className="shrink-0 text-[11.5px] text-slate-500">{e.period}</p>
              </div>
              <Bullets items={e.bullets} />
            </div>
          ))}
        </div></>)}
        {content.projects.length > 0 && (<><SH>Projects</SH><div className="space-y-3">
          {content.projects.map((p, i) => (
            <div key={i} className="relative pl-4">
              <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-blue-600" />
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13.5px] font-semibold">{p.name}</p>
                <p className="shrink-0 text-[11.5px] text-slate-500">{p.tech}</p>
              </div>
              <Bullets items={p.bullets} />
            </div>
          ))}
        </div></>)}
      </main>
    </div>
  );
}
