import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Bullet = z.string().max(500);
const Contact = z.object({
  email: z.string().max(200).optional().default(""),
  phone: z.string().max(50).optional().default(""),
  location: z.string().max(200).optional().default(""),
  linkedin: z.string().max(300).optional().default(""),
  website: z.string().max(300).optional().default(""),
  github: z.string().max(300).optional().default(""),
}).optional().default({ email: "", phone: "", location: "", linkedin: "", website: "", github: "" });
const ResumeContent = z.object({
  contact: Contact,
  summary: z.string().max(2000).optional().default(""),
  personal: z.object({
    fullName: z.string().max(120).optional().default(""),
    title: z.string().max(120).optional().default(""),
    email: z.string().max(100).optional().default(""),
    phone: z.string().max(40).optional().default(""),
    location: z.string().max(120).optional().default(""),
    linkedin: z.string().max(200).optional().default(""),
    github: z.string().max(200).optional().default(""),
    portfolio: z.string().max(200).optional().default(""),
  }).optional().default({}),
  education: z.array(z.object({
    school: z.string().max(200),
    degree: z.string().max(200).optional().default(""),
    branch: z.string().max(200).optional().default(""),
    gpa: z.string().max(40).optional().default(""),
    startDate: z.string().max(40).optional().default(""),
    endDate: z.string().max(40).optional().default(""),
    coursework: z.string().max(1000).optional().default(""),
    // compatibility fallbacks
    year: z.string().max(80).optional().default(""),
    details: z.string().max(500).optional().default(""),
  })).max(15).optional().default([]),
  skills: z.array(z.string().max(60)).max(100).optional().default([]), // fallback
  skillsCategorized: z.object({
    programmingLanguages: z.array(z.string().max(60)).optional().default([]),
    webTechnologies: z.array(z.string().max(60)).optional().default([]),
    frameworks: z.array(z.string().max(60)).optional().default([]),
    databases: z.array(z.string().max(60)).optional().default([]),
    cloudTechnologies: z.array(z.string().max(60)).optional().default([]),
    tools: z.array(z.string().max(60)).optional().default([]),
    operatingSystems: z.array(z.string().max(60)).optional().default([]),
    softSkills: z.array(z.string().max(60)).optional().default([]),
    custom: z.array(z.object({
      name: z.string().max(100),
      skills: z.array(z.string().max(60)),
    })).optional().default([]),
  }).optional().default({}),
  projects: z.array(z.object({
    name: z.string().max(200),
    title: z.string().max(200).optional().default(""), // alias
    description: z.string().max(1500).optional().default(""),
    tech: z.string().max(200).optional().default(""), // compatibility fallback
    technologies: z.array(z.string().max(60)).optional().default([]),
    features: z.array(z.string().max(500)).optional().default([]),
    challenges: z.array(z.string().max(500)).optional().default([]),
    impact: z.array(z.string().max(500)).optional().default([]),
    githubLink: z.string().max(200).optional().default(""),
    demoLink: z.string().max(200).optional().default(""),
    startDate: z.string().max(40).optional().default(""),
    endDate: z.string().max(40).optional().default(""),
    bullets: z.array(Bullet).max(12).optional().default([]), // compatibility fallback
  })).max(20).optional().default([]),
  experience: z.array(z.object({
    role: z.string().max(200),
    company: z.string().max(200),
    type: z.string().max(60).optional().default("Full-time"),
    location: z.string().max(120).optional().default(""),
    startDate: z.string().max(40).optional().default(""),
    endDate: z.string().max(40).optional().default(""),
    responsibilities: z.array(Bullet).max(15).optional().default([]),
    achievements: z.array(Bullet).max(15).optional().default([]),
    technologies: z.array(z.string().max(60)).optional().default([]),
    // compatibility fallbacks
    period: z.string().max(80).optional().default(""),
    bullets: z.array(Bullet).max(12).optional().default([]),
  })).max(20).optional().default([]),
  internships: z.array(z.object({
    company: z.string().max(200),
    role: z.string().max(200),
    duration: z.string().max(80).optional().default(""),
    responsibilities: z.array(Bullet).max(15).optional().default([]),
    skillsGained: z.array(z.string().max(60)).optional().default([]),
    achievements: z.array(Bullet).max(15).optional().default([]),
  })).max(10).optional().default([]),
  certifications: z.array(z.object({
    name: z.string().max(200),
    issuer: z.string().max(200).optional().default(""),
    issueDate: z.string().max(40).optional().default(""),
    expiryDate: z.string().max(40).optional().default(""),
    credentialId: z.string().max(120).optional().default(""),
    url: z.string().max(200).optional().default(""),
  })).max(20).optional().default([]),
  certificationsFallback: z.array(z.string().max(200)).optional().default([]), // compatibility fallback
  achievements: z.object({
    academic: z.array(z.string().max(500)).optional().default([]),
    competitions: z.array(z.string().max(500)).optional().default([]),
    awards: z.array(z.string().max(500)).optional().default([]),
    scholarships: z.array(z.string().max(500)).optional().default([]),
    rankings: z.array(z.string().max(500)).optional().default([]),
    general: z.array(z.string().max(300)).optional().default([]), // compatibility fallback
  }).optional().default({}),
  leadership: z.array(z.object({
    role: z.string().max(200),
    organization: z.string().max(200),
    duration: z.string().max(80).optional().default(""),
    contributions: z.array(Bullet).max(15).optional().default([]),
  })).max(10).optional().default([]),
  extraCurricular: z.object({
    clubs: z.array(z.string().max(500)).optional().default([]),
    volunteering: z.array(z.string().max(500)).optional().default([]),
    events: z.array(z.string().max(500)).optional().default([]),
    communityService: z.array(z.string().max(500)).optional().default([]),
  }).optional().default({}),
  publications: z.array(z.object({
    title: z.string().max(300),
    publication: z.string().max(300).optional().default(""),
    date: z.string().max(40).optional().default(""),
    description: z.string().max(1000).optional().default(""),
    url: z.string().max(200).optional().default(""),
  })).max(15).optional().default([]),
  languages: z.array(z.object({
    name: z.string().max(60),
    proficiency: z.string().max(60).optional().default(""),
  })).max(15).optional().default([]),
  references: z.array(z.object({
    name: z.string().max(120),
    designation: z.string().max(120).optional().default(""),
    organization: z.string().max(120).optional().default(""),
    contact: z.string().max(200).optional().default(""),
  })).max(10).optional().default([]),
});

export function buildContactLine(c?: { email?: string; phone?: string; location?: string; linkedin?: string; website?: string; github?: string }) {
  if (!c) return "";
  return [c.email, c.phone, c.location, c.linkedin, c.website, c.github].map((v) => (v ?? "").trim()).filter(Boolean).join(" · ");
}

export type ResumeContentT = z.infer<typeof ResumeContent>;

export const listResumes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("resumes").select("id, name, is_master, job_id, ats_score, updated_at, created_at").eq("user_id", context.userId).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getResume = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: resume, error } = await context.supabase.from("resumes").select("*").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    return resume;
  });

export const upsertResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(120),
    is_master: z.boolean().optional().default(false),
    job_id: z.string().uuid().optional().nullable(),
    content: ResumeContent,
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("resumes").update({
        name: data.name, is_master: data.is_master, job_id: data.job_id ?? null, content: data.content,
      }).eq("id", data.id).eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      if (data.is_master) {
        await context.supabase.from("resumes").update({ is_master: false }).eq("user_id", context.userId).eq("is_master", true);
      }
      const { data: created, error } = await context.supabase.from("resumes").insert({
        user_id: context.userId, name: data.name, is_master: data.is_master, job_id: data.job_id ?? null, content: data.content,
      }).select("id").single();
      if (error) throw new Error(error.message);
      return { id: created.id };
    }
  });

export const deleteResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("resumes").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
