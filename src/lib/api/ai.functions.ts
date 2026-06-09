import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-3-flash-preview";

async function getModel() {
  const { getLovableAI } = await import("@/lib/ai-gateway.server");
  return getLovableAI()(MODEL);
}

const ResumeContentSchema = z.object({
  summary: z.string(),
  education: z.array(z.object({ school: z.string(), degree: z.string(), year: z.string(), details: z.string() })),
  experience: z.array(z.object({ role: z.string(), company: z.string(), period: z.string(), bullets: z.array(z.string()) })),
  projects: z.array(z.object({ name: z.string(), tech: z.string(), bullets: z.array(z.string()) })),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
  achievements: z.array(z.string()),
});

function handleAIError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("429")) throw new Error("AI is busy right now — please try again in a moment.");
  if (msg.includes("402")) throw new Error("AI credits exhausted. Add credits to keep using AI features.");
  throw new Error(msg);
}

export const tailorResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    master_resume_id: z.string().uuid(),
    job_id: z.string().uuid(),
    new_name: z.string().min(1).max(160),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: master }, { data: job }] = await Promise.all([
      context.supabase.from("resumes").select("*").eq("id", data.master_resume_id).eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("jobs").select("*").eq("id", data.job_id).maybeSingle(),
    ]);
    if (!master) throw new Error("Master resume not found");
    if (!job) throw new Error("Job not found");

    try {
      const model = await getModel();
      const { experimental_output } = await generateText({
        model,
        system: "You are an expert resume writer for students and early-career job seekers. Produce ATS-friendly, impact-focused, role-tailored resume content. Use strong action verbs and quantify where possible. Keep bullets concise (one line). NEVER fabricate experience, education, or facts not present in the source resume. You may rephrase, reorder, and emphasize.",
        prompt: `Tailor this resume for the job. Reorder sections/items so the most relevant content appears first. Rewrite bullets to highlight overlap with the job. Keep it truthful.\n\n=== JOB ===\nTitle: ${job.title}\nCompany: ${job.company}\nDescription: ${job.description}\nSkills required: ${(job.skills ?? []).join(", ")}\nRequirements: ${(job.requirements ?? []).join("; ")}\n\n=== SOURCE RESUME (JSON) ===\n${JSON.stringify(master.content)}\n\nReturn the tailored resume in the exact same JSON shape.`,
        experimental_output: Output.object({ schema: ResumeContentSchema }),
      });

      // Determine root + next version for history
      const rootId = master.parent_resume_id ?? master.id;
      const { data: siblings } = await context.supabase
        .from("resumes").select("version")
        .eq("user_id", context.userId)
        .or(`id.eq.${rootId},parent_resume_id.eq.${rootId}`);
      const nextVersion = ((siblings ?? []).reduce((m, r) => Math.max(m, r.version ?? 1), 1)) + 1;

      const { data: created, error } = await context.supabase.from("resumes").insert({
        user_id: context.userId, name: data.new_name, is_master: false, job_id: job.id, content: experimental_output,
        parent_resume_id: rootId, version: nextVersion,
      }).select("id").single();
      if (error) throw new Error(error.message);
      return { id: created.id };
    } catch (e) { handleAIError(e); }
  });

const ATSSchema = z.object({
  score: z.number(),
  matched_keywords: z.array(z.string()),
  missing_keywords: z.array(z.string()),
  suggestions: z.array(z.string()),
  strengths: z.array(z.string()),
});

export const scoreResumeATS = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    resume_id: z.string().uuid(),
    job_id: z.string().uuid().optional(),
    job_description: z.string().max(8000).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: resume } = await context.supabase.from("resumes").select("*").eq("id", data.resume_id).eq("user_id", context.userId).maybeSingle();
    if (!resume) throw new Error("Resume not found");
    let jd = data.job_description ?? "";
    if (data.job_id) {
      const { data: job } = await context.supabase.from("jobs").select("*").eq("id", data.job_id).maybeSingle();
      if (job) jd = `Role: ${job.title} at ${job.company}\n${job.description}\nSkills: ${(job.skills ?? []).join(", ")}\nRequirements: ${(job.requirements ?? []).join("; ")}`;
    }

    try {
      const model = await getModel();
      const { experimental_output } = await generateText({
        model,
        system: "You evaluate resumes for ATS (Applicant Tracking System) compatibility and relevance to a job. Be honest. Score 0-100 (50 = okay, 75 = strong, 90+ = excellent). Look for keyword match, clarity, action verbs, quantifiable impact. Return concise, specific suggestions a student can act on.",
        prompt: `Score this resume against the target job and return a JSON object.\n\n=== TARGET ===\n${jd || "No specific job — score for general ATS friendliness for entry-level tech roles."}\n\n=== RESUME (JSON) ===\n${JSON.stringify(resume.content)}\n\nReturn: score (0-100 integer), matched_keywords, missing_keywords (top 8), suggestions (5 concrete actions), strengths (3 things working well).`,
        experimental_output: Output.object({ schema: ATSSchema }),
      });

      const score = Math.max(0, Math.min(100, Math.round(experimental_output.score)));
      await context.supabase.from("resumes").update({ ats_score: score, ats_feedback: experimental_output }).eq("id", data.resume_id).eq("user_id", context.userId);
      return { ...experimental_output, score };
    } catch (e) { handleAIError(e); }
  });

export const generateCoverLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    resume_id: z.string().uuid(),
    job_id: z.string().uuid().optional(),
    company: z.string().max(160).optional(),
    role: z.string().max(160).optional(),
    job_description: z.string().max(8000).optional(),
    tone: z.enum(["enthusiastic", "professional", "concise"]).optional().default("enthusiastic"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: resume } = await context.supabase.from("resumes").select("*").eq("id", data.resume_id).eq("user_id", context.userId).maybeSingle();
    if (!resume) throw new Error("Resume not found");
    const { data: profile } = await context.supabase.from("profiles").select("full_name").eq("id", context.userId).maybeSingle();

    let company = data.company ?? "";
    let role = data.role ?? "";
    let jd = data.job_description ?? "";
    if (data.job_id) {
      const { data: job } = await context.supabase.from("jobs").select("*").eq("id", data.job_id).maybeSingle();
      if (job) { company = job.company; role = job.title; jd = job.description; }
    }

    try {
      const model = await getModel();
      const { text } = await generateText({
        model,
        system: `Write authentic, student-friendly cover letters. Tone: ${data.tone}. 3 short paragraphs. Open with genuine interest, middle with 2-3 concrete projects/skills from the resume that map to the role, close with a clear call-to-action. No clichés like "I am writing to apply". No fabrication. Roughly 200-280 words.`,
        prompt: `Write a cover letter.\n\nApplicant: ${profile?.full_name ?? "the candidate"}\nCompany: ${company}\nRole: ${role}\n\nJob context: ${jd}\n\nResume (JSON):\n${JSON.stringify(resume.content)}`,
      });
      return { content: text, company, role };
    } catch (e) { handleAIError(e); }
  });

const EmailDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export const draftRecruiterEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    resume_id: z.string().uuid(),
    job_id: z.string().uuid().optional(),
    company: z.string().max(160).optional(),
    role: z.string().max(160).optional(),
    recruiter_name: z.string().max(120).optional(),
    tone: z.enum(["warm", "professional", "concise"]).optional().default("warm"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: resume } = await context.supabase.from("resumes").select("*").eq("id", data.resume_id).eq("user_id", context.userId).maybeSingle();
    if (!resume) throw new Error("Resume not found");
    const { data: profile } = await context.supabase.from("profiles").select("full_name, linkedin_url, portfolio_url, github_url").eq("id", context.userId).maybeSingle();
    let company = data.company ?? "";
    let role = data.role ?? "";
    if (data.job_id) {
      const { data: job } = await context.supabase.from("jobs").select("*").eq("id", data.job_id).maybeSingle();
      if (job) { company = job.company; role = job.title; }
    }
    try {
      const model = await getModel();
      const { experimental_output } = await generateText({
        model,
        system: `You draft short, polite outreach emails students send to recruiters. Tone: ${data.tone}. 120-180 words. Plain text only — no markdown. Mention the specific role, 1-2 concrete strengths from the resume that fit, and a clear ask (a quick chat or to be considered). End with the candidate's full name. Subject line under 70 chars, specific (include role + name).`,
        prompt: `Draft an outreach email.\n\nFrom: ${profile?.full_name ?? "the candidate"}\nTo: ${data.recruiter_name ? data.recruiter_name + " (recruiter)" : "the recruiter"}\nCompany: ${company}\nRole: ${role}\nLinks: ${[profile?.linkedin_url, profile?.portfolio_url, profile?.github_url].filter(Boolean).join(", ") || "(none)"}\n\nResume highlights (JSON):\n${JSON.stringify(resume.content)}`,
        experimental_output: Output.object({ schema: EmailDraftSchema }),
      });
      return experimental_output;
    } catch (e) { handleAIError(e); }
  });

