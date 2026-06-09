import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listResumeVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: anchor, error: e1 } = await context.supabase.from("resumes").select("id, parent_resume_id").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!anchor) throw new Error("Resume not found");
    const rootId = anchor.parent_resume_id ?? anchor.id;
    const { data: rows, error } = await context.supabase
      .from("resumes")
      .select("id, name, is_master, version, parent_resume_id, ats_score, updated_at, job_id, content")
      .eq("user_id", context.userId)
      .or(`id.eq.${rootId},parent_resume_id.eq.${rootId}`)
      .order("version", { ascending: true });
    if (error) throw new Error(error.message);
    return { rootId, versions: rows ?? [] };
  });
