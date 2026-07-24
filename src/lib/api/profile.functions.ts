import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const ProfileInput = z.object({
  avatar_url: z.string().optional().nullable(),
  full_name: z.string().max(120).optional().nullable(),
  headline: z.string().max(200).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  college: z.string().max(200).optional().nullable(),
  degree: z.string().max(120).optional().nullable(),
  graduation_year: z.number().int().min(1950).max(2100).optional().nullable(),
  cgpa: z.number().min(0).max(10).optional().nullable(),
  skills: z.array(z.string().max(60)).max(80).optional(),
  preferred_roles: z.array(z.string().max(80)).max(20).optional(),
  preferred_locations: z.array(z.string().max(80)).max(20).optional(),
  goals: z.array(z.string().max(40)).max(10).optional(),
  github_url: z.string().url().max(300).optional().nullable().or(z.literal("")),
  linkedin_url: z.string().url().max(300).optional().nullable().or(z.literal("")),
  portfolio_url: z.string().url().max(300).optional().nullable().or(z.literal("")),
  phone: z.string().max(40).optional().nullable(),
  onboarded: z.boolean().optional(),
  // New fields
  account_type: z.enum(["job_seeker", "company"]).optional(),
  experience_level: z.string().max(60).optional().nullable(),
  target_role: z.string().max(120).optional().nullable(),
  interview_prefs: z.array(z.string().max(40)).max(20).optional(),
  company_name: z.string().max(200).optional().nullable(),
  company_logo_url: z.string().max(500).optional().nullable(),
  company_website: z.string().max(300).optional().nullable().or(z.literal("")),
  industry: z.string().max(120).optional().nullable(),
  hiring_contact: z.string().max(200).optional().nullable(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
