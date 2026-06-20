import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string, passcode: string) {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) throw new Error("Admin passcode not configured");
  if (!passcode || passcode.length > 200) throw new Error("Invalid passcode");
  const { timingSafeEqual } = await import("crypto");
  const a = Buffer.from(passcode);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid passcode");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You do not have admin access");
}

export const checkAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ passcode: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.passcode);
    return { ok: true };
  });

export const adminStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ passcode: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [users, resumes, applications, payments, premiumUsers] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("resumes").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("applications").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("payments").select("amount_paise, status"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("is_premium", true),
    ]);
    const revenuePaise = (payments.data ?? [])
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + (p.amount_paise ?? 0), 0);
    return {
      users: users.count ?? 0,
      premiumUsers: premiumUsers.count ?? 0,
      resumes: resumes.count ?? 0,
      applications: applications.count ?? 0,
      revenueInr: Math.round(revenuePaise / 100),
      paymentCount: (payments.data ?? []).filter((p) => p.status === "paid").length,
    };
  });

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ passcode: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, headline, is_premium, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminListPayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ passcode: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, plan, amount_paise, currency, status, razorpay_order_id, razorpay_payment_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminGetSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ passcode: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("site_settings").select("key, value");
    return (rows ?? []) as { key: string; value: Record<string, string | number | boolean> }[];
  });

export const adminUpdateSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        passcode: z.string().min(1).max(200),
        key: z.string().min(1).max(80).regex(/^[a-z0-9_]+$/),
        value: z.record(z.string(), z.any()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: data.key, value: data.value, updated_by: context.userId, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGrantSelf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ passcode: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    // First-time bootstrap: anyone who knows the admin passcode can grant
    // themselves admin. After the first admin exists, only existing admins can.
    const expected = process.env.ADMIN_PASSCODE;
    if (!expected) throw new Error("Admin passcode not configured");
    const { timingSafeEqual } = await import("crypto");
    const a = Buffer.from(data.passcode);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid passcode");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) {
      const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (!isAdmin) throw new Error("An admin already exists. Ask an existing admin to add you.");
    }
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    return { ok: true };
  });

export const adminGrantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      passcode: z.string().min(1).max(200),
      email: z.string().email().max(255),
      role: z.enum(["admin", "recruiter", "moderator"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw new Error(listErr.message);
    const user = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (!user) throw new Error("No user found with that email");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: data.role }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRevokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      passcode: z.string().min(1).max(200),
      user_id: z.string().uuid(),
      role: z.enum(["admin", "recruiter", "moderator"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ passcode: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const nameMap = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
    return (rows ?? []).map((r) => ({ ...r, full_name: nameMap.get(r.user_id) ?? null }));
  });

export const adminListAllJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ passcode: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId, data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .order("posted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
