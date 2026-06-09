import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Bullet = z.string().max(500);
const ResumeContent = z.object({
  summary: z.string().max(2000).optional().default(""),
  education: z.array(z.object({
    school: z.string().max(200),
    degree: z.string().max(200).optional().default(""),
    year: z.string().max(40).optional().default(""),
    details: z.string().max(500).optional().default(""),
  })).max(10).optional().default([]),
  experience: z.array(z.object({
    role: z.string().max(200),
    company: z.string().max(200),
    period: z.string().max(80).optional().default(""),
    bullets: z.array(Bullet).max(12).optional().default([]),
  })).max(20).optional().default([]),
  projects: z.array(z.object({
    name: z.string().max(200),
    tech: z.string().max(200).optional().default(""),
    bullets: z.array(Bullet).max(8).optional().default([]),
  })).max(20).optional().default([]),
  skills: z.array(z.string().max(60)).max(80).optional().default([]),
  certifications: z.array(z.string().max(200)).max(20).optional().default([]),
  achievements: z.array(z.string().max(300)).max(20).optional().default([]),
});

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
