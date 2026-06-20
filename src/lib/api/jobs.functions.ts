import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const jobInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(150),
  company: z.string().min(1).max(150),
  location: z.string().min(1).max(150),
  job_type: z.string().min(1).max(40),
  mode: z.string().min(1).max(40),
  description: z.string().min(10).max(8000),
  requirements: z.array(z.string().min(1).max(300)).max(30).default([]),
  skills: z.array(z.string().min(1).max(60)).max(30).default([]),
  stipend: z.string().max(60).optional().nullable(),
  apply_url: z.string().url().max(500).optional().nullable(),
});

export const listJobs = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("jobs").select("*").order("posted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getJob = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: job, error } = await supabaseAdmin.from("jobs").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return job;
  });

export const saveJobApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ job_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: job } = await context.supabase.from("jobs").select("*").eq("id", data.job_id).maybeSingle();
    if (!job) throw new Error("Job not found");
    const { error } = await context.supabase.from("applications").insert({
      user_id: context.userId, job_id: job.id, company: job.company, role: job.title, status: "saved", link: job.apply_url,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function getRoles(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return new Set((data ?? []).map((r: { role: string }) => r.role));
}

export const upsertJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => jobInputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context.supabase, context.userId);
    if (!roles.has("admin") && !roles.has("recruiter")) throw new Error("Forbidden");

    const payload = {
      ...data,
      stipend: data.stipend ?? null,
      apply_url: data.apply_url ?? null,
    };

    if (data.id) {
      // RLS enforces ownership for recruiters; admins can edit any
      const { error } = await context.supabase.from("jobs").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("jobs")
      .insert({ ...payload, posted_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getRoles(context.supabase, context.userId);
    if (!roles.has("admin") && !roles.has("recruiter")) throw new Error("Forbidden");
    const { error } = await context.supabase.from("jobs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getRoles(context.supabase, context.userId);
    if (!roles.has("recruiter") && !roles.has("admin")) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const query = supabaseAdmin.from("jobs").select("*").order("posted_at", { ascending: false });
    const { data, error } = roles.has("admin")
      ? await query
      : await query.eq("posted_by", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    return (data ?? []).map((r) => r.role as string);
  });
