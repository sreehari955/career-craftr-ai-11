import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-3-flash-preview";

async function getModel() {
  const { getLovableAI } = await import("@/lib/ai-gateway.server");
  return getLovableAI()(MODEL);
}

function handleAIError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("429")) throw new Error("AI is busy right now — please try again in a moment.");
  if (msg.includes("402")) throw new Error("AI credits exhausted. Add credits to keep using AI features.");
  throw new Error(msg);
}

const QuestionSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    type: z.enum(["behavioral", "technical", "situational"]),
    hint: z.string(),
  })).min(3).max(10),
});

const FeedbackSchema = z.object({
  score: z.number(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  ideal_answer: z.string(),
});

export const listSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("interview_sessions")
      .select("id, title, job_id, created_at, updated_at, questions")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("interview_sessions").select("*").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("interview_sessions").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createInterviewSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    job_id: z.string().uuid().optional(),
    role: z.string().max(160).optional(),
    company: z.string().max(160).optional(),
    job_description: z.string().max(8000).optional(),
    count: z.number().int().min(3).max(10).default(6),
    category: z.enum(["mixed", "hr", "technical", "basic", "role"]).default("mixed"),
    experience_level: z.string().max(60).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    let role = data.role ?? "Software role";
    let company = data.company ?? "";
    let jd = data.job_description ?? "";
    if (data.job_id) {
      const { data: job } = await context.supabase.from("jobs").select("*").eq("id", data.job_id).maybeSingle();
      if (job) { role = job.title; company = job.company; jd = `${job.description}\nSkills: ${(job.skills ?? []).join(", ")}\nRequirements: ${(job.requirements ?? []).join("; ")}`; }
    }
    // Pull profile skills for personalization
    const { data: profile } = await context.supabase.from("profiles").select("skills, experience_level, target_role").eq("id", context.userId).maybeSingle();
    const skills = (profile?.skills ?? []).join(", ");
    const exp = data.experience_level || profile?.experience_level || "entry-level";

    const catInstruction = {
      mixed: "Mix behavioral (HR), technical, and situational questions.",
      hr: "Focus on HR / behavioral questions (motivation, teamwork, communication, culture fit). Use behavioral type.",
      technical: "Focus on technical questions relevant to the role's tech stack and fundamentals. Use technical type.",
      basic: "Ask basic fresher-level questions suitable for a first-time candidate (intro, strengths, coursework, simple concepts). Use behavioral/technical mix but keep them approachable.",
      role: "Ask role-specific, deep questions that a hiring manager for this exact role would ask. Use situational and technical types.",
    }[data.category];

    try {
      const model = await getModel();
      const { experimental_output } = await generateText({
        model,
        system: `You are an experienced interviewer for students and early-career candidates. Generate realistic, concise interview questions (one or two sentences). Include a short hint of what the interviewer wants to hear. ${catInstruction}`,
        prompt: `Generate ${data.count} mock interview questions.\n\nRole: ${role}${company ? ` at ${company}` : ""}\nExperience level: ${exp}\nCandidate skills: ${skills || "not provided"}\nJob context:\n${jd || "Entry-level role for a student"}\n\nReturn an array of {question, type, hint}.`,
        experimental_output: Output.object({ schema: QuestionSchema }),
      });
      const title = `${role}${company ? " — " + company : ""}`;
      const { data: created, error } = await context.supabase.from("interview_sessions").insert({
        user_id: context.userId, job_id: data.job_id ?? null, title,
        questions: experimental_output.questions, answers: [], feedback: [],
      }).select("id").single();
      if (error) throw new Error(error.message);
      return { id: created.id };
    } catch (e) { handleAIError(e); }
  });

export const saveAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    session_id: z.string().uuid(),
    question_index: z.number().int().min(0).max(20),
    text: z.string().max(8000).default(""),
    audio_path: z.string().max(500).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: s } = await context.supabase.from("interview_sessions").select("*").eq("id", data.session_id).eq("user_id", context.userId).maybeSingle();
    if (!s) throw new Error("Session not found");
    const answers = Array.isArray(s.answers) ? [...(s.answers as Array<{ text: string; audio_path: string | null }>)] : [];
    while (answers.length <= data.question_index) answers.push({ text: "", audio_path: null });
    answers[data.question_index] = { text: data.text, audio_path: data.audio_path ?? null };
    const { error } = await context.supabase.from("interview_sessions").update({ answers }).eq("id", data.session_id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const scoreAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    session_id: z.string().uuid(),
    question_index: z.number().int().min(0).max(20),
    answer_text: z.string().min(5).max(8000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: s } = await context.supabase.from("interview_sessions").select("*").eq("id", data.session_id).eq("user_id", context.userId).maybeSingle();
    if (!s) throw new Error("Session not found");
    const questions = (s.questions ?? []) as Array<{ question: string; type: string; hint: string }>;
    const q = questions[data.question_index];
    if (!q) throw new Error("Question not found");
    try {
      const model = await getModel();
      const { experimental_output } = await generateText({
        model,
        system: "You evaluate interview answers from students. Be honest but encouraging. Score 0-100 based on structure (STAR for behavioral), clarity, specificity, and relevance. Give 2-3 strengths, 2-3 improvements, and a short ideal answer (3-5 sentences).",
        prompt: `Question (${q.type}): ${q.question}\nWhat interviewer wants: ${q.hint}\n\nCandidate's answer:\n${data.answer_text}`,
        experimental_output: Output.object({ schema: FeedbackSchema }),
      });
      const feedback: unknown[] = Array.isArray(s.feedback) ? [...(s.feedback as unknown[])] : [];
      while (feedback.length <= data.question_index) feedback.push(null);
      feedback[data.question_index] = experimental_output;
      await context.supabase.from("interview_sessions").update({ feedback: feedback as never }).eq("id", data.session_id).eq("user_id", context.userId);
      return experimental_output;
    } catch (e) { handleAIError(e); }
  });
