import { cn } from "@/lib/utils";
import type { ResumeContentT } from "@/lib/api/resumes.functions";

export type TemplateId = "modern" | "classic" | "minimalist" | "creative";

export const TEMPLATES: { id: TemplateId; name: string; description: string; available: boolean }[] = [
  { id: "modern", name: "Modern", description: "Clean, blue accents, ATS-friendly", available: true },
  { id: "classic", name: "Classic", description: "Serif, traditional layout", available: false },
  { id: "minimalist", name: "Minimalist", description: "Lots of whitespace", available: false },
  { id: "creative", name: "Creative", description: "Sidebar with accent block", available: false },
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
  // Hardcopy paper effect — A4 ratio, deep shadow, subtle paper texture
  return (
    <div
      className="mx-auto"
      style={{
        // A4 width at 96dpi-ish so it looks like real paper
        width: 794,
        transform: `scale(${scale})`,
        transformOrigin: "top center",
      }}
    >
      <div
        className="relative bg-white text-slate-900"
        style={{
          minHeight: 1123,
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.06), 0 12px 24px -8px rgba(15,23,42,0.18), 0 30px 60px -20px rgba(15,23,42,0.25)",
          borderRadius: 2,
          backgroundImage:
            "radial-gradient(rgba(15,23,42,0.025) 1px, transparent 1px), radial-gradient(rgba(15,23,42,0.018) 1px, transparent 1px)",
          backgroundSize: "3px 3px, 7px 7px",
          backgroundPosition: "0 0, 1px 1px",
        }}
      >
        {/* Top edge highlight to look like paper */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
        <div className="px-14 py-12">
          {template === "modern" && <ModernTemplate name={name} contact={contact} content={content} />}
          {template !== "modern" && (
            <div className="flex h-[900px] items-center justify-center text-center text-slate-500">
              <div>
                <p className="text-lg font-semibold">{TEMPLATES.find((t) => t.id === template)?.name} template</p>
                <p className="mt-2 text-sm">Coming soon — defaulting to Modern.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-6 mb-2 border-b border-blue-600/70 pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
      {children}
    </h2>
  );
}

function Bullets({ items }: { items: string[] }) {
  const cleaned = items.filter(Boolean);
  if (!cleaned.length) return null;
  return (
    <ul className="mt-1 space-y-1 pl-4 text-[12.5px] leading-snug">
      {cleaned.map((b, i) => (
        <li key={i} className="list-disc marker:text-blue-600">{b}</li>
      ))}
    </ul>
  );
}

function ModernTemplate({ name, contact, content }: { name: string; contact?: string; content: ResumeContentT }) {
  return (
    <div className={cn("font-sans text-slate-900", "antialiased")}>
      {/* Header */}
      <header className="border-b-2 border-blue-600 pb-3">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-slate-900">
          {name || "Your Name"}
        </h1>
        {contact && <p className="mt-1 text-[12.5px] text-slate-600">{contact}</p>}
      </header>

      {content.summary && (
        <>
          <SectionHeader>Summary</SectionHeader>
          <p className="text-[12.5px] leading-relaxed text-slate-700">{content.summary}</p>
        </>
      )}

      {content.experience.length > 0 && (
        <>
          <SectionHeader>Experience</SectionHeader>
          <div className="space-y-3">
            {content.experience.map((e, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[13.5px] font-semibold text-slate-900">
                    {e.role}{e.company ? <span className="font-normal text-slate-600"> · {e.company}</span> : null}
                  </p>
                  <p className="shrink-0 text-[11.5px] text-slate-500">{e.period}</p>
                </div>
                <Bullets items={e.bullets} />
              </div>
            ))}
          </div>
        </>
      )}

      {content.projects.length > 0 && (
        <>
          <SectionHeader>Projects</SectionHeader>
          <div className="space-y-3">
            {content.projects.map((p, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[13.5px] font-semibold text-slate-900">{p.name}</p>
                  <p className="shrink-0 text-[11.5px] text-slate-500">{p.tech}</p>
                </div>
                <Bullets items={p.bullets} />
              </div>
            ))}
          </div>
        </>
      )}

      {content.education.length > 0 && (
        <>
          <SectionHeader>Education</SectionHeader>
          <div className="space-y-2">
            {content.education.map((e, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[13px] font-semibold text-slate-900">{e.school}</p>
                  <p className="shrink-0 text-[11.5px] text-slate-500">{e.year}</p>
                </div>
                <p className="text-[12px] text-slate-600">{[e.degree, e.details].filter(Boolean).join(" · ")}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {content.skills.length > 0 && (
        <>
          <SectionHeader>Skills</SectionHeader>
          <p className="text-[12.5px] text-slate-700">{content.skills.join(" · ")}</p>
        </>
      )}

      {content.certifications.length > 0 && (
        <>
          <SectionHeader>Certifications</SectionHeader>
          <Bullets items={content.certifications} />
        </>
      )}

      {content.achievements.length > 0 && (
        <>
          <SectionHeader>Achievements</SectionHeader>
          <Bullets items={content.achievements} />
        </>
      )}
    </div>
  );
}
