import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import type { ResumeContentT } from "./api/resumes.functions";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10.5, fontFamily: "Helvetica", color: "#111" },
  header: { marginBottom: 10 },
  name: { fontSize: 20, fontWeight: 700 },
  contact: { fontSize: 9.5, color: "#444", marginTop: 2 },
  section: { marginTop: 12 },
  h2: { fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1pt solid #999", paddingBottom: 2, marginBottom: 6, color: "#222" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  itemTitle: { fontWeight: 700, fontSize: 11 },
  itemMeta: { fontSize: 9.5, color: "#555" },
  bullet: { flexDirection: "row", marginTop: 2, paddingLeft: 8 },
  bulletDot: { width: 8 },
  bulletText: { flex: 1, lineHeight: 1.35 },
  para: { lineHeight: 1.4 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  pill: { fontSize: 9.5, color: "#222" },
});

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.filter(Boolean).map((b, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

export function ResumePdfDoc({ content, name, contact }: { content: ResumeContentT; name: string; contact?: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          {contact && <Text style={styles.contact}>{contact}</Text>}
        </View>

        {content.summary && (
          <View style={styles.section}>
            <Text style={styles.h2}>Summary</Text>
            <Text style={styles.para}>{content.summary}</Text>
          </View>
        )}

        {content.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.h2}>Experience</Text>
            {content.experience.map((e, i) => (
              <View key={i} wrap={false} style={{ marginTop: i === 0 ? 0 : 6 }}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>{e.role}{e.company ? ` · ${e.company}` : ""}</Text>
                  <Text style={styles.itemMeta}>{e.period}</Text>
                </View>
                <Bullets items={e.bullets} />
              </View>
            ))}
          </View>
        )}

        {content.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.h2}>Projects</Text>
            {content.projects.map((p, i) => (
              <View key={i} wrap={false} style={{ marginTop: i === 0 ? 0 : 6 }}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>{p.name}</Text>
                  <Text style={styles.itemMeta}>{p.tech}</Text>
                </View>
                <Bullets items={p.bullets} />
              </View>
            ))}
          </View>
        )}

        {content.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.h2}>Education</Text>
            {content.education.map((e, i) => (
              <View key={i} style={{ marginTop: i === 0 ? 0 : 4 }}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>{e.school}</Text>
                  <Text style={styles.itemMeta}>{e.year}</Text>
                </View>
                <Text style={styles.itemMeta}>{[e.degree, e.details].filter(Boolean).join(" · ")}</Text>
              </View>
            ))}
          </View>
        )}

        {content.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.h2}>Skills</Text>
            <Text style={styles.para}>{content.skills.join(" · ")}</Text>
          </View>
        )}

        {content.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.h2}>Certifications</Text>
            <Bullets items={content.certifications} />
          </View>
        )}

        {content.achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.h2}>Achievements</Text>
            <Bullets items={content.achievements} />
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function downloadResumePdf(name: string, content: ResumeContentT, contact?: string) {
  const blob = await pdf(<ResumePdfDoc name={name} content={content} contact={contact} />).toBlob();
  const safeName = name.replace(/[^a-z0-9-_ ]/gi, "").trim() || "resume";
  saveAs(blob, `${safeName}.pdf`);
}
