import { createFileRoute } from "@tanstack/react-router";
import { jobMatchesAlert } from "@/lib/api/alerts.functions";

export const Route = createFileRoute("/api/public/run-job-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
        if (!apikey || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: alerts } = await supabaseAdmin.from("job_alerts").select("*").eq("active", true);
        const { data: jobs } = await supabaseAdmin.from("jobs").select("id, title, company, location, mode, job_type, skills, description");
        if (!alerts || !jobs) return Response.json({ matched: 0 });
        let total = 0;
        for (const a of alerts) {
          const hits = jobs.filter((j) => jobMatchesAlert(j, a));
          if (hits.length === 0) continue;
          const rows = hits.map((j) => ({ alert_id: a.id, job_id: j.id, user_id: a.user_id }));
          const { error } = await supabaseAdmin.from("alert_matches").upsert(rows, { onConflict: "alert_id,job_id", ignoreDuplicates: true });
          if (!error) total += rows.length;
          await supabaseAdmin.from("job_alerts").update({ last_checked_at: new Date().toISOString() }).eq("id", a.id);
        }
        return Response.json({ matched: total, alerts: alerts.length });
      },
    },
  },
});
