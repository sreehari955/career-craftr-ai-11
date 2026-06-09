import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listJobs = createServerFn({ method: "GET" })
  .handler(async () => {
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
