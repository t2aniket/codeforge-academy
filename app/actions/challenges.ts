"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

const submissionSchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().min(1),
  passed: z.boolean(),
  output: z.string().default(""),
  xp: z.number().min(0).max(1000).default(100)
});

export async function saveChallengeSubmissionAction(input: z.infer<typeof submissionSchema>) {
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid challenge submission." };

  if (!hasSupabaseEnv()) {
    return {
      ok: true,
      message: parsed.data.passed ? `Demo mode: challenge solved (+${parsed.data.xp} XP).` : "Demo mode: submission saved."
    };
  }

  const supabase = createClient();
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData.user) return { ok: false, message: "Sign in to save challenge submissions." };

  const { error } = await supabase!.from("challenge_submissions").insert({
    user_id: userData.user.id,
    challenge_id: parsed.data.challengeId,
    code: parsed.data.code,
    passed: parsed.data.passed,
    output: parsed.data.output,
    xp_earned: parsed.data.passed ? parsed.data.xp : 0
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: parsed.data.passed ? `Challenge solved (+${parsed.data.xp} XP).` : "Submission saved."
  };
}
