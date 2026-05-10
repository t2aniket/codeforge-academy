"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

const noteSchema = z.object({
  lessonId: z.string().min(1),
  body: z.string().max(20_000)
});

const completionSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  xp: z.number().min(0).max(1000).default(120)
});

export async function saveLessonNoteAction(input: z.infer<typeof noteSchema>) {
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid note." };

  if (!hasSupabaseEnv()) {
    return { ok: true, message: "Demo mode: note saved locally." };
  }

  const supabase = createClient();
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData.user) return { ok: false, message: "Sign in to sync notes." };

  const { error } = await supabase!.from("user_notes").upsert(
    {
      user_id: userData.user.id,
      lesson_id: parsed.data.lessonId,
      body: parsed.data.body,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return { ok: true, message: "Lesson note synced." };
}

export async function completeLessonAction(input: z.infer<typeof completionSchema>) {
  const parsed = completionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid lesson completion." };

  if (!hasSupabaseEnv()) {
    return { ok: true, message: `Demo mode: +${parsed.data.xp} XP saved locally.` };
  }

  const supabase = createClient();
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData.user) return { ok: false, message: "Sign in to sync progress." };

  const { error } = await supabase!.from("user_progress").upsert(
    {
      user_id: userData.user.id,
      course_id: parsed.data.courseId,
      lesson_id: parsed.data.lessonId,
      completed: true,
      xp_earned: parsed.data.xp,
      completed_at: new Date().toISOString()
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return { ok: true, message: `+${parsed.data.xp} XP synced.` };
}
