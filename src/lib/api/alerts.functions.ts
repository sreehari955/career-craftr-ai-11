import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AlertInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  keywords: z.array(z.string().max(60)).max(20).default([]),
  locations: z.array(z.string().max(80)).max(20).default([]),
  job_types: z.array(z.string().max(40)).max(10).default([]),
  modes: z.array(z.string().max(40)).max(10).default([]),
  active: z.boolean().default(true),
});

export const listAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("job_alerts").select("*").eq("user_id", context.userId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AlertInput.parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("job_alerts").update({
        name: data.name, keywords: data.keywords, locations: data.locations, job_types: data.job_types, modes: data.modes, active: data.active,
      }).eq("id", data.id).eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await context.supabase.from("job_alerts").insert({
      user_id: context.userId, name: data.name, keywords: data.keywords, locations: data.locations, job_types: data.job_types, modes: data.modes, active: data.active,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("job_alerts").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("alert_matches")
      .select("id, seen, created_at, alert_id, job_id, jobs(id, title, company, location, mode, job_type, stipend, apply_url), job_alerts(name)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const unseenCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count, error } = await context.supabase.from("alert_matches").select("id", { count: "exact", head: true }).eq("user_id", context.userId).eq("seen", false);
    if (error) return 0;
    return count ?? 0;
  });

export const markMatchesSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("alert_matches").update({ seen: true }).eq("user_id", context.userId).eq("seen", false);
    return { ok: true };
  });

// Runs the matcher synchronously for one user (used after creating an alert).
export const runUserAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: alerts } = await context.supabase.from("job_alerts").select("*").eq("user_id", context.userId).eq("active", true);
    if (!alerts || alerts.length === 0) return { matched: 0 };
    const { data: jobs } = await context.supabase.from("jobs").select("id, title, company, location, mode, job_type, skills, description");
    if (!jobs) return { matched: 0 };
    let total = 0;
    for (const a of alerts) {
      const matched = jobs.filter((j) => jobMatchesAlert(j, a));
      if (matched.length === 0) continue;
      const rows = matched.map((j) => ({ alert_id: a.id, job_id: j.id, user_id: context.userId }));
      const { error } = await context.supabase.from("alert_matches").upsert(rows, { onConflict: "alert_id,job_id", ignoreDuplicates: true });
      if (!error) total += rows.length;
    }
    return { matched: total };
  });

type JobLike = { title: string; company: string; location: string; mode: string; job_type: string; skills: string[] | null; description: string };
type AlertLike = { keywords: string[]; locations: string[]; job_types: string[]; modes: string[] };

export function jobMatchesAlert(job: JobLike, alert: AlertLike): boolean {
  if (alert.job_types.length && !alert.job_types.includes(job.job_type)) return false;
  if (alert.modes.length && !alert.modes.includes(job.mode)) return false;
  if (alert.locations.length && !alert.locations.some((loc) => job.location.toLowerCase().includes(loc.toLowerCase()))) return false;
  if (alert.keywords.length) {
    const hay = [job.title, job.company, job.description, ...(job.skills ?? [])].join(" ").toLowerCase();
    const hit = alert.keywords.some((k) => hay.includes(k.toLowerCase()));
    if (!hit) return false;
  }
  return true;
}
