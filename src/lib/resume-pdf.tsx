import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import type { ResumeContentT } from "./api/resumes.functions";
import type { TemplateId } from "@/components/resume-preview";

/* ---------- Shared ---------- */
const c = {
  ink: "#111",
  mute: "#555",
  faint: "#777",
  rule: "#999",
  blue: "#1d4ed8",
  blueDark: "#1e3a8a",
  blueLite: "#dbeafe",
};

const base = StyleSheet.create({
  bullet: { flexDirection: "row", marginTop: 2, paddingLeft: 8 },
  bulletDot: { width: 8 },
  bulletText: { flex: 1, lineHeight: 1.35 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
});

function Bullets({ items, dot = "•" }: { items: string[]; dot?: string }) {
  return (
    <View>
      {items.filter(Boolean).map((b, i) => (
        <View key={i} style={base.bullet}>
          <Text style={base.bulletDot}>{dot}</Text>
          <Text style={base.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

/* ---------- MODERN ---------- */
const modern = StyleSheet.create({
  page: { padding: 36, fontSize: 10.5, fontFamily: "Helvetica", color: c.ink },
  header: { borderBottom: `2pt solid ${c.blue}`, paddingBottom: 6, marginBottom: 8 },
  name: { fontSize: 22, fontWeight: 700 },
  contact: { fontSize: 9.5, color: c.mute, marginTop: 3 },
  section: { marginTop: 10 },
  h2: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: c.blueDark, borderBottom: `0.5pt solid ${c.blue}`, paddingBottom: 2, marginBottom: 5 },
  itemTitle: { fontWeight: 700, fontSize: 11 },
  itemMeta: { fontSize: 9.5, color: c.mute },
  para: { lineHeight: 1.4 },
});
function ModernDoc({ content, name, contact }: { content: ResumeContentT; name: string; contact?: string }) {
  return (
    <Document>
      <Page size="A4" style={modern.page}>
        <View style={modern.header}>
          <Text style={modern.name}>{name}</Text>
          {contact && <Text style={modern.contact}>{contact}</Text>}
        </View>
        {content.summary && (<View style={modern.section}><Text style={modern.h2}>Summary</Text><Text style={modern.para}>{content.summary}</Text></View>)}
        {content.experience.length > 0 && (
          <View style={modern.section}><Text style={modern.h2}>Experience</Text>
            {content.experience.map((e, i) => (
              <View key={i} wrap={false} style={{ marginTop: i === 0 ? 0 : 6 }}>
                <View style={base.row}>
                  <Text style={modern.itemTitle}>{e.role}{e.company ? ` · ${e.company}` : ""}</Text>
                  <Text style={modern.itemMeta}>{e.period}</Text>
                </View>
                <Bullets items={e.bullets} />
              </View>
            ))}
          </View>
        )}
        {content.projects.length > 0 && (
          <View style={modern.section}><Text style={modern.h2}>Projects</Text>
            {content.projects.map((p, i) => (
              <View key={i} wrap={false} style={{ marginTop: i === 0 ? 0 : 6 }}>
                <View style={base.row}><Text style={modern.itemTitle}>{p.name}</Text><Text style={modern.itemMeta}>{p.tech}</Text></View>
                <Bullets items={p.bullets} />
              </View>
            ))}
          </View>
        )}
        {content.education.length > 0 && (
          <View style={modern.section}><Text style={modern.h2}>Education</Text>
            {content.education.map((e, i) => (
              <View key={i} style={{ marginTop: i === 0 ? 0 : 4 }}>
                <View style={base.row}><Text style={modern.itemTitle}>{e.school}</Text><Text style={modern.itemMeta}>{e.year}</Text></View>
                <Text style={modern.itemMeta}>{[e.degree, e.details].filter(Boolean).join(" · ")}</Text>
              </View>
            ))}
          </View>
        )}
        {content.skills.length > 0 && (<View style={modern.section}><Text style={modern.h2}>Skills</Text><Text style={modern.para}>{content.skills.join(" · ")}</Text></View>)}
        {content.certifications.length > 0 && (<View style={modern.section}><Text style={modern.h2}>Certifications</Text><Bullets items={content.certifications} /></View>)}
        {content.achievements.length > 0 && (<View style={modern.section}><Text style={modern.h2}>Achievements</Text><Bullets items={content.achievements} /></View>)}
        {(content.languages?.length ?? 0) > 0 && (<View style={modern.section}><Text style={modern.h2}>Languages</Text><Text style={modern.para}>{content.languages!.join(" · ")}</Text></View>)}
      </Page>
    </Document>
  );
}

/* ---------- CLASSIC (serif, centered) ---------- */
const classic = StyleSheet.create({
  page: { padding: 44, fontSize: 10.5, fontFamily: "Times-Roman", color: c.ink },
  header: { textAlign: "center", marginBottom: 10 },
  name: { fontSize: 22, fontWeight: 700, letterSpacing: 1 },
  contact: { fontSize: 10, fontStyle: "italic", color: c.mute, marginTop: 3 },
  section: { marginTop: 10 },
  h2: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, textAlign: "center", borderBottom: `0.5pt solid ${c.ink}`, paddingBottom: 2, marginBottom: 6 },
  itemTitle: { fontWeight: 700, fontSize: 11 },
  itemSub: { fontSize: 10, fontStyle: "italic", color: c.mute },
  para: { lineHeight: 1.4, textAlign: "justify" },
});
function ClassicDoc({ content, name, contact }: { content: ResumeContentT; name: string; contact?: string }) {
  return (
    <Document>
      <Page size="A4" style={classic.page}>
        <View style={classic.header}>
          <Text style={classic.name}>{name}</Text>
          {contact && <Text style={classic.contact}>{contact}</Text>}
        </View>
        {content.summary && (<View style={classic.section}><Text style={classic.h2}>Profile</Text><Text style={classic.para}>{content.summary}</Text></View>)}
        {content.experience.length > 0 && (
          <View style={classic.section}><Text style={classic.h2}>Professional Experience</Text>
            {content.experience.map((e, i) => (
              <View key={i} wrap={false} style={{ marginTop: i === 0 ? 0 : 6 }}>
                <View style={base.row}><Text style={classic.itemTitle}>{e.company}</Text><Text style={classic.itemSub}>{e.period}</Text></View>
                <Text style={classic.itemSub}>{e.role}</Text>
                <Bullets items={e.bullets} />
              </View>
            ))}
          </View>
        )}
        {content.education.length > 0 && (
          <View style={classic.section}><Text style={classic.h2}>Education</Text>
            {content.education.map((e, i) => (
              <View key={i} style={{ marginTop: i === 0 ? 0 : 4 }}>
                <View style={base.row}><Text style={classic.itemTitle}>{e.school}</Text><Text style={classic.itemSub}>{e.year}</Text></View>
                <Text style={classic.itemSub}>{[e.degree, e.details].filter(Boolean).join(" — ")}</Text>
              </View>
            ))}
          </View>
        )}
        {content.projects.length > 0 && (
          <View style={classic.section}><Text style={classic.h2}>Projects</Text>
            {content.projects.map((p, i) => (
              <View key={i} wrap={false} style={{ marginTop: i === 0 ? 0 : 6 }}>
                <Text style={classic.itemTitle}>{p.name} <Text style={classic.itemSub}>— {p.tech}</Text></Text>
                <Bullets items={p.bullets} />
              </View>
            ))}
          </View>
        )}
        {content.skills.length > 0 && (<View style={classic.section}><Text style={classic.h2}>Skills</Text><Text style={{ textAlign: "center" }}>{content.skills.join(" • ")}</Text></View>)}
        {content.certifications.length > 0 && (<View style={classic.section}><Text style={classic.h2}>Certifications</Text><Bullets items={content.certifications} /></View>)}
        {content.achievements.length > 0 && (<View style={classic.section}><Text style={classic.h2}>Honors & Achievements</Text><Bullets items={content.achievements} /></View>)}
        {(content.languages?.length ?? 0) > 0 && (<View style={classic.section}><Text style={classic.h2}>Languages</Text><Text style={{ textAlign: "center" }}>{content.languages!.join(" • ")}</Text></View>)}
      </Page>
    </Document>
  );
}

/* ---------- MINIMALIST ---------- */
const minimal = StyleSheet.create({
  page: { padding: 56, fontSize: 10.5, fontFamily: "Helvetica", color: "#222" },
  name: { fontSize: 26, fontWeight: 300 },
  contact: { fontSize: 9.5, color: c.faint, marginTop: 4 },
  rule: { width: 30, height: 0.8, backgroundColor: "#cbd5e1", marginTop: 10, marginBottom: 12 },
  section: { marginTop: 14, flexDirection: "row" },
  h2: { width: 90, fontSize: 8.5, textTransform: "uppercase", letterSpacing: 3, color: c.faint },
  body: { flex: 1 },
  itemTitle: { fontSize: 11, fontWeight: 500, color: "#111" },
  itemMeta: { fontSize: 9.5, color: c.faint },
  para: { lineHeight: 1.5 },
});
function MinRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={minimal.section}>
      <Text style={minimal.h2}>{label}</Text>
      <View style={minimal.body}>{children}</View>
    </View>
  );
}
function MinimalistDoc({ content, name, contact }: { content: ResumeContentT; name: string; contact?: string }) {
  return (
    <Document>
      <Page size="A4" style={minimal.page}>
        <Text style={minimal.name}>{name}</Text>
        {contact && <Text style={minimal.contact}>{contact}</Text>}
        <View style={minimal.rule} />
        {content.summary && <MinRow label="About"><Text style={minimal.para}>{content.summary}</Text></MinRow>}
        {content.experience.length > 0 && (
          <MinRow label="Experience">
            {content.experience.map((e, i) => (
              <View key={i} style={{ marginTop: i === 0 ? 0 : 8 }} wrap={false}>
                <Text style={minimal.itemTitle}>{e.role}</Text>
                <Text style={minimal.itemMeta}>{e.company} · {e.period}</Text>
                <Bullets items={e.bullets} dot="–" />
              </View>
            ))}
          </MinRow>
        )}
        {content.projects.length > 0 && (
          <MinRow label="Projects">
            {content.projects.map((p, i) => (
              <View key={i} style={{ marginTop: i === 0 ? 0 : 8 }} wrap={false}>
                <Text style={minimal.itemTitle}>{p.name}</Text>
                <Text style={minimal.itemMeta}>{p.tech}</Text>
                <Bullets items={p.bullets} dot="–" />
              </View>
            ))}
          </MinRow>
        )}
        {content.education.length > 0 && (
          <MinRow label="Education">
            {content.education.map((e, i) => (
              <View key={i} style={{ marginTop: i === 0 ? 0 : 6 }}>
                <Text style={minimal.itemTitle}>{e.school}</Text>
                <Text style={minimal.itemMeta}>{[e.degree, e.year, e.details].filter(Boolean).join(" · ")}</Text>
              </View>
            ))}
          </MinRow>
        )}
        {content.skills.length > 0 && <MinRow label="Skills"><Text style={minimal.para}>{content.skills.join("   ·   ")}</Text></MinRow>}
        {content.certifications.length > 0 && <MinRow label="Certifications"><Bullets items={content.certifications} dot="–" /></MinRow>}
        {content.achievements.length > 0 && <MinRow label="Achievements"><Bullets items={content.achievements} dot="–" /></MinRow>}
        {(content.languages?.length ?? 0) > 0 && <MinRow label="Languages"><Text style={minimal.para}>{content.languages!.join("   ·   ")}</Text></MinRow>}
      </Page>
    </Document>
  );
}

/* ---------- CREATIVE (sidebar) ---------- */
const creative = StyleSheet.create({
  page: { fontSize: 10.5, fontFamily: "Helvetica", color: c.ink, flexDirection: "row" },
  sidebar: { width: 180, backgroundColor: c.blueDark, color: "#fff", padding: 22 },
  main: { flex: 1, padding: 26 },
  sideName: { fontSize: 17, fontWeight: 700, color: "#fff" },
  sideContact: { fontSize: 9, color: c.blueLite, marginTop: 5, lineHeight: 1.4 },
  sideH2: { fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: c.blueLite, marginTop: 14, marginBottom: 4 },
  sideItem: { fontSize: 10, color: "#fff", marginTop: 3 },
  sideSub: { fontSize: 9, color: c.blueLite },
  h2: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: c.blueDark, marginBottom: 4, marginTop: 10 },
  itemTitle: { fontWeight: 700, fontSize: 11 },
  itemMeta: { fontSize: 9.5, color: c.mute },
});
function CreativeDoc({ content, name, contact }: { content: ResumeContentT; name: string; contact?: string }) {
  return (
    <Document>
      <Page size="A4" style={creative.page}>
        <View style={creative.sidebar}>
          <Text style={creative.sideName}>{name}</Text>
          {contact && <Text style={creative.sideContact}>{contact}</Text>}
          {content.skills.length > 0 && (<><Text style={creative.sideH2}>Skills</Text>
            {content.skills.map((s, i) => <Text key={i} style={creative.sideItem}>{s}</Text>)}</>)}
          {content.education.length > 0 && (<><Text style={creative.sideH2}>Education</Text>
            {content.education.map((e, i) => (
              <View key={i} style={{ marginTop: 4 }}>
                <Text style={creative.sideItem}>{e.school}</Text>
                <Text style={creative.sideSub}>{[e.degree, e.year].filter(Boolean).join(" · ")}</Text>
                {e.details ? <Text style={creative.sideSub}>{e.details}</Text> : null}
              </View>
            ))}</>)}
          {content.certifications.length > 0 && (<><Text style={creative.sideH2}>Certifications</Text>
            {content.certifications.map((x, i) => <Text key={i} style={creative.sideItem}>• {x}</Text>)}</>)}
          {content.achievements.length > 0 && (<><Text style={creative.sideH2}>Achievements</Text>
            {content.achievements.map((x, i) => <Text key={i} style={creative.sideItem}>• {x}</Text>)}</>)}
        </View>
        <View style={creative.main}>
          {content.summary && (<><Text style={creative.h2}>Profile</Text><Text style={{ lineHeight: 1.4 }}>{content.summary}</Text></>)}
          {content.experience.length > 0 && (<><Text style={creative.h2}>Experience</Text>
            {content.experience.map((e, i) => (
              <View key={i} wrap={false} style={{ marginTop: i === 0 ? 0 : 6 }}>
                <View style={base.row}><Text style={creative.itemTitle}>{e.role} · {e.company}</Text><Text style={creative.itemMeta}>{e.period}</Text></View>
                <Bullets items={e.bullets} />
              </View>
            ))}</>)}
          {content.projects.length > 0 && (<><Text style={creative.h2}>Projects</Text>
            {content.projects.map((p, i) => (
              <View key={i} wrap={false} style={{ marginTop: i === 0 ? 0 : 6 }}>
                <View style={base.row}><Text style={creative.itemTitle}>{p.name}</Text><Text style={creative.itemMeta}>{p.tech}</Text></View>
                <Bullets items={p.bullets} />
              </View>
            ))}</>)}
        </View>
      </Page>
    </Document>
  );
}

/* ---------- Dispatcher ---------- */
export function ResumePdfDoc({ template = "modern", content, name, contact }: { template?: TemplateId; content: ResumeContentT; name: string; contact?: string }) {
  switch (template) {
    case "classic": return <ClassicDoc content={content} name={name} contact={contact} />;
    case "minimalist": return <MinimalistDoc content={content} name={name} contact={contact} />;
    case "creative": return <CreativeDoc content={content} name={name} contact={contact} />;
    default: return <ModernDoc content={content} name={name} contact={contact} />;
  }
}

export async function downloadResumePdf(name: string, content: ResumeContentT, contact?: string, template: TemplateId = "modern") {
  const blob = await pdf(<ResumePdfDoc template={template} name={name} content={content} contact={contact} />).toBlob();
  const safeName = name.replace(/[^a-z0-9-_ ]/gi, "").trim() || "resume";
  saveAs(blob, `${safeName}.pdf`);
}
