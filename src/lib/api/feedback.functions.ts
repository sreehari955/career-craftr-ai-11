import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const FeedbackInput = z.object({
  category: z.enum(["contact", "feedback", "bug", "support"]),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(5).max(5000),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  page_url: z.string().max(500).optional(),
  user_id: z.string().uuid().optional().nullable(),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => FeedbackInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase.from("feedback").insert({
      category: data.category,
      subject: data.subject,
      message: data.message,
      email: data.email || null,
      page_url: data.page_url ?? null,
      user_id: data.user_id ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
