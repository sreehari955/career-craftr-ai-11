import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import type { ResumeContentT } from "./api/resumes.functions";
import type { TemplateId } from "@/components/resume-preview";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9.5, fontFamily: "Helvetica", color: "#111", lineHeight: 1.35 },
  header: { marginBottom: 12, alignItems: "center" },
  name: { fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 11, color: "#333", marginTop: 2, fontWeight: 500 },
  contact: { fontSize: 8.5, color: "#444", marginTop: 4, textAlign: "center" },
  section: { marginTop: 10 },
  sectionTitle: { fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: "0.5pt solid #555", paddingBottom: 2, marginBottom: 5, color: "#111" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  itemTitle: { fontWeight: 700, fontSize: 10 },
  itemRight: { fontSize: 8.5, color: "#444", fontWeight: 500 },
  itemSub: { fontSize: 8.5, color: "#444", fontStyle: "italic", marginTop: 1 },
  bullet: { flexDirection: "row", marginTop: 2, paddingLeft: 6 },
  bulletDot: { width: 6, fontSize: 9 },
  bulletText: { flex: 1, fontSize: 8.5, color: "#222" },
  para: { fontSize: 8.5, color: "#222", lineHeight: 1.4 },
  skillsText: { fontSize: 8.5, color: "#222", lineHeight: 1.3 },
  boldText: { fontWeight: 700 },
});

function Bullets({ items }: { items: string[] }) {
  const filtered = (items || []).filter(Boolean);
  if (filtered.length === 0) return null;
  return (
    <View style={{ marginTop: 2 }}>
      {filtered.map((b, i) => (
        <View key={i} style={styles.bullet} wrap={false}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function ModernDoc({ content, name, contact }: { content: ResumeContentT; name: string; contact?: string }) {
  const personal = content.personal || {};
  const fullName = personal.fullName || name;
  const profTitle = personal.title;

  const contactParts = [
    personal.phone,
    personal.email,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.portfolio
  ].filter(Boolean);
  const finalContact = contactParts.length > 0 ? contactParts.join("   |   ") : contact;

  // Render skills by categories
  const sc = content.skillsCategorized || {};
  const skillsList: { label: string; items: string[] }[] = [
    { label: "Programming Languages", items: sc.programmingLanguages || [] },
    { label: "Web Technologies", items: sc.webTechnologies || [] },
    { label: "Frameworks", items: sc.frameworks || [] },
    { label: "Databases", items: sc.databases || [] },
    { label: "Cloud Technologies", items: sc.cloudTechnologies || [] },
    { label: "Tools", items: sc.tools || [] },
    { label: "Operating Systems", items: sc.operatingSystems || [] },
    { label: "Soft Skills", items: sc.softSkills || [] },
    ...(sc.custom || []).map((c: any) => ({ label: c.name, items: c.skills || [] }))
  ].filter(x => x.items && x.items.length > 0);

  // Fallback flat skills
  const flatSkills = content.skills || [];

  // Group achievements
  const ach = content.achievements || {};
  const allAchievements = [
    ...(ach.academic || []).map(x => `[Academic] ${x}`),
    ...(ach.competitions || []).map(x => `[Competition] ${x}`),
    ...(ach.awards || []).map(x => `[Award] ${x}`),
    ...(ach.scholarships || []).map(x => `[Scholarship] ${x}`),
    ...(ach.rankings || []).map(x => `[Ranking] ${x}`),
    ...(ach.general || [])
  ].filter(Boolean);

  // Group extracurriculars
  const ec = content.extraCurricular || {};
  const allExtraCurricular = [
    ...(ec.clubs || []).map(x => `[Club] ${x}`),
    ...(ec.volunteering || []).map(x => `[Volunteering] ${x}`),
    ...(ec.events || []).map(x => `[Event Organization] ${x}`),
    ...(ec.communityService || []).map(x => `[Community Service] ${x}`)
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PERSONAL INFORMATION */}
        <View style={styles.header}>
          <Text style={styles.name}>{fullName}</Text>
          {profTitle ? <Text style={styles.title}>{profTitle}</Text> : null}
          {finalContact ? <Text style={styles.contact}>{finalContact}</Text> : null}
        </View>

        {/* SUMMARY */}
        {content.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.para}>{content.summary}</Text>
          </View>
        ) : null}

        {/* WORK EXPERIENCE */}
        {content.experience && content.experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {content.experience.map((e, i) => {
              const start = e.startDate || "";
              const end = e.endDate || "";
              const dateRange = start && end ? `${start} – ${end}` : start || end || e.period || "";
              const itemsList = [
                ...(e.responsibilities || []),
                ...(e.achievements || [])
              ];
              // Fallback to legacy bullets if empty
              const bulletsToRender = itemsList.length > 0 ? itemsList : (e.bullets || []);

              return (
                <View key={i} style={{ marginTop: i === 0 ? 0 : 5 }} wrap={false}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemTitle}>
                      {e.role}{e.company ? ` · ${e.company}` : ""}{e.type ? ` (${e.type})` : ""}
                    </Text>
                    <Text style={styles.itemRight}>{dateRange}</Text>
                  </View>
                  {e.location ? <Text style={styles.itemSub}>{e.location}</Text> : null}
                  {e.technologies && e.technologies.length > 0 ? (
                    <Text style={[styles.para, { marginTop: 2, fontStyle: "italic", fontSize: 8 }]}>
                      Technologies: {e.technologies.join(", ")}
                    </Text>
                  ) : null}
                  <Bullets items={bulletsToRender} />
                </View>
              );
            })}
          </View>
        ) : null}

        {/* INTERNSHIPS */}
        {content.internships && content.internships.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Internships</Text>
            {content.internships.map((intern, i) => {
              const bulletsToRender = [
                ...(intern.responsibilities || []),
                ...(intern.achievements || [])
              ];
              return (
                <View key={i} style={{ marginTop: i === 0 ? 0 : 5 }} wrap={false}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemTitle}>{intern.role} · {intern.company}</Text>
                    <Text style={styles.itemRight}>{intern.duration}</Text>
                  </View>
                  {intern.skillsGained && intern.skillsGained.length > 0 ? (
                    <Text style={[styles.para, { marginTop: 2, fontStyle: "italic", fontSize: 8 }]}>
                      Skills Gained: {intern.skillsGained.join(", ")}
                    </Text>
                  ) : null}
                  <Bullets items={bulletsToRender} />
                </View>
              );
            })}
          </View>
        ) : null}

        {/* PROJECTS */}
        {content.projects && content.projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {content.projects.map((p, i) => {
              const start = p.startDate || "";
              const end = p.endDate || "";
              const dateRange = start && end ? `${start} – ${end}` : start || end || "";
              const links = [
                p.githubLink ? `GitHub: ${p.githubLink}` : "",
                p.demoLink ? `Demo: ${p.demoLink}` : ""
              ].filter(Boolean).join(" | ");

              const bulletsToRender = [
                ...(p.features || []).map(x => `Key Feature: ${x}`),
                ...(p.challenges || []).map(x => `Challenge Solved: ${x}`),
                ...(p.impact || []).map(x => `Impact: ${x}`),
                ...(p.bullets || [])
              ];

              const techText = p.technologies && p.technologies.length > 0 ? p.technologies.join(", ") : p.tech || "";

              return (
                <View key={i} style={{ marginTop: i === 0 ? 0 : 5 }} wrap={false}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemTitle}>{p.name || p.title}</Text>
                    <Text style={styles.itemRight}>{dateRange}</Text>
                  </View>
                  {techText || links ? (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 1 }}>
                      {techText ? <Text style={[styles.itemSub, { fontSize: 8 }]}>Technologies: {techText}</Text> : <Text />}
                      {links ? <Text style={{ fontSize: 8, color: "#444" }}>{links}</Text> : null}
                    </View>
                  ) : null}
                  <Bullets items={bulletsToRender} />
                </View>
              );
            })}
          </View>
        ) : null}

        {/* EDUCATION */}
        {content.education && content.education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {content.education.map((e, i) => {
              const start = e.startDate || "";
              const end = e.endDate || "";
              const dateRange = start && end ? `${start} – ${end}` : start || end || e.year || "";
              const degreeInfo = [
                e.degree,
                e.branch || "",
                e.gpa ? `CGPA/GPA: ${e.gpa}` : "",
                e.details || ""
              ].filter(Boolean).join(" · ");

              return (
                <View key={i} style={{ marginTop: i === 0 ? 0 : 4 }} wrap={false}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemTitle}>{e.school}</Text>
                    <Text style={styles.itemRight}>{dateRange}</Text>
                  </View>
                  {degreeInfo ? <Text style={styles.itemSub}>{degreeInfo}</Text> : null}
                  {e.coursework ? (
                    <Text style={[styles.para, { marginTop: 1, fontSize: 8, color: "#444" }]}>
                      Coursework: {e.coursework}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* TECHNICAL SKILLS */}
        {skillsList.length > 0 || flatSkills.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            {skillsList.length > 0 ? (
              <View style={{ gap: 2 }}>
                {skillsList.map((s, i) => (
                  <Text key={i} style={styles.skillsText}>
                    <Text style={styles.boldText}>{s.label}: </Text>
                    {s.items.join(", ")}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.para}>{flatSkills.join(" · ")}</Text>
            )}
          </View>
        ) : null}

        {/* CERTIFICATIONS */}
        {content.certifications && content.certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {content.certifications.map((c: any, i: number) => {
              if (typeof c === "string") {
                return (
                  <View key={i} style={styles.bullet} wrap={false}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{c}</Text>
                  </View>
                );
              }
              const dates = [c.issueDate, c.expiryDate].filter(Boolean).join(" – ");
              const details = [
                c.issuer ? `Issuer: ${c.issuer}` : "",
                c.credentialId ? `ID: ${c.credentialId}` : "",
                c.url ? `Verify: ${c.url}` : ""
              ].filter(Boolean).join(" | ");

              return (
                <View key={i} style={{ marginTop: i === 0 ? 0 : 3 }} wrap={false}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemTitle}>{c.name}</Text>
                    {dates ? <Text style={styles.itemRight}>{dates}</Text> : null}
                  </View>
                  {details ? <Text style={styles.itemSub}>{details}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* ACHIEVEMENTS */}
        {allAchievements.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Bullets items={allAchievements} />
          </View>
        ) : null}

        {/* LEADERSHIP & RESPONSIBILITIES */}
        {content.leadership && content.leadership.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leadership & Responsibilities</Text>
            {content.leadership.map((l, i) => (
              <View key={i} style={{ marginTop: i === 0 ? 0 : 5 }} wrap={false}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>{l.role} · {l.organization}</Text>
                  <Text style={styles.itemRight}>{l.duration}</Text>
                </View>
                <Bullets items={l.contributions || []} />
              </View>
            ))}
          </View>
        ) : null}

        {/* EXTRA-CURRICULAR ACTIVITIES */}
        {allExtraCurricular.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Extra-Curricular Activities</Text>
            <Bullets items={allExtraCurricular} />
          </View>
        ) : null}

        {/* PUBLICATIONS & RESEARCH */}
        {content.publications && content.publications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Publications & Research</Text>
            {content.publications.map((pub, i) => (
              <View key={i} style={{ marginTop: i === 0 ? 0 : 4 }} wrap={false}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>{pub.title}{pub.publication ? ` · ${pub.publication}` : ""}</Text>
                  {pub.date ? <Text style={styles.itemRight}>{pub.date}</Text> : null}
                </View>
                {pub.description ? <Text style={[styles.para, { marginTop: 1 }]}>{pub.description}</Text> : null}
                {pub.url ? <Text style={[styles.itemSub, { color: "#3366cc" }]}>{pub.url}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* LANGUAGES */}
        {content.languages && content.languages.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.para}>
              {content.languages.map(l => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ""}`).join("   ·   ")}
            </Text>
          </View>
        ) : null}

        {/* REFERENCES */}
        {content.references && content.references.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>References</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 15 }}>
              {content.references.map((r, i) => {
                const info = [
                  r.name,
                  [r.designation, r.organization].filter(Boolean).join(", "),
                  r.contact
                ].filter(Boolean).join("  ·  ");

                return (
                  <View key={i} style={{ minWidth: 200 }} wrap={false}>
                    <Text style={styles.para}>• {info}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

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
          {(content.languages?.length ?? 0) > 0 && (<><Text style={creative.sideH2}>Languages</Text>
            {content.languages!.map((l, i) => <Text key={i} style={creative.sideItem}>{l}</Text>)}</>)}
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
import { baseTemplate } from "@/components/resume-preview";

export function ResumePdfDoc({ template = "modern", content, name, contact }: { template?: TemplateId; content: ResumeContentT; name: string; contact?: string }) {
  switch (baseTemplate(template)) {
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
