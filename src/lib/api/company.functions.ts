import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Status = z.enum(["saved", "applied", "interview", "offer", "rejected"]);

async function assertRecruiter(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = new Set((data ?? []).map((r: { role: string }) => r.role));
  if (!roles.has("recruiter") && !roles.has("admin")) throw new Error("Forbidden");
}

export const listMyApplicants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRecruiter(context.supabase, context.userId);
    // RLS lets recruiters read applications for jobs they posted.
    const { data: apps, error } = await context.supabase
      .from("applications")
      .select("id, user_id, job_id, company, role, status, applied_at, updated_at, notes")
      .not("job_id", "is", null)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((apps ?? []).map((a) => a.user_id).filter(Boolean)));
    const jobIds = Array.from(new Set((apps ?? []).map((a) => a.job_id).filter(Boolean)));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profilesRes, jobsRes] = await Promise.all([
      userIds.length
        ? supabaseAdmin.from("profiles").select("id, full_name, headline, avatar_url").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      jobIds.length
        ? supabaseAdmin.from("jobs").select("id, title, company").in("id", jobIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));
    const jobMap = new Map((jobsRes.data ?? []).map((j: any) => [j.id, j]));
    return (apps ?? []).map((a) => ({
      ...a,
      candidate: profileMap.get(a.user_id) ?? null,
      job: jobMap.get(a.job_id) ?? null,
    }));
  });

export const setApplicantStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: Status }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRecruiter(context.supabase, context.userId);
    // RLS restricts UPDATE to applications for jobs the recruiter posted.
    const { error } = await context.supabase
      .from("applications")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const companyStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRecruiter(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ count: jobCount }, { data: myJobs }] = await Promise.all([
      supabaseAdmin.from("jobs").select("id", { count: "exact", head: true }).eq("posted_by", context.userId),
      supabaseAdmin.from("jobs").select("id").eq("posted_by", context.userId),
    ]);
    const jobIds = (myJobs ?? []).map((j) => j.id);
    let applicantCount = 0;
    let interviewCount = 0;
    if (jobIds.length) {
      const { count: aCount } = await supabaseAdmin.from("applications").select("id", { count: "exact", head: true }).in("job_id", jobIds);
      const { count: iCount } = await supabaseAdmin.from("applications").select("id", { count: "exact", head: true }).in("job_id", jobIds).eq("status", "interview");
      applicantCount = aCount ?? 0;
      interviewCount = iCount ?? 0;
    }
    return { jobs: jobCount ?? 0, applicants: applicantCount, interviews: interviewCount };
  });
