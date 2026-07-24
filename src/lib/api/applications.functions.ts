import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Status = z.enum(["saved", "applied", "interview", "offer", "rejected"]);

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("applications").select("*").eq("user_id", context.userId).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    company: z.string().min(1).max(160),
    role: z.string().min(1).max(160),
    link: z.string().url().max(500).optional().nullable().or(z.literal("")),
    status: Status.optional().default("saved"),
    notes: z.string().max(2000).optional().nullable(),
    contact: z.string().max(200).optional().nullable(),
    job_id: z.string().uuid().optional().nullable(),
    resume_id: z.string().uuid().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("applications").insert({
      user_id: context.userId,
      ...data,
      applied_at: data.status === "applied" ? new Date().toISOString() : null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: Status }).parse(d))
  .handler(async ({ data, context }) => {
    const patch = { status: data.status, ...(data.status === "applied" ? { applied_at: new Date().toISOString() } : {}) };
    const { error } = await context.supabase.from("applications").update(patch).eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("applications").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const applyToJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    job_id: z.string().uuid(),
    full_name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(40).optional().nullable(),
    skills: z.string().trim().max(600).optional().nullable(),
    cover_note: z.string().trim().max(2000).optional().nullable(),
    resume_id: z.string().uuid().optional().nullable(),
    resume_path: z.string().max(500).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: job, error: jerr } = await context.supabase
      .from("jobs").select("id, company, title").eq("id", data.job_id).maybeSingle();
    if (jerr) throw new Error(jerr.message);
    if (!job) throw new Error("Job not found");

    const notes = [
      `Applicant: ${data.full_name}`,
      data.phone ? `Phone: ${data.phone}` : null,
      data.skills ? `Skills: ${data.skills}` : null,
      data.cover_note ? `\nNote:\n${data.cover_note}` : null,
    ].filter(Boolean).join("\n");

    const { error } = await context.supabase.from("applications").insert({
      user_id: context.userId,
      job_id: job.id,
      company: job.company,
      role: job.title,
      status: "applied",
      applied_at: new Date().toISOString(),
      contact: data.email,
      notes,
      resume_id: data.resume_id ?? null,
      link: data.resume_path ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

