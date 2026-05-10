"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

const enrollmentSchema = z.object({
  courseId: z.string().min(1),
  courseSlug: z.string().min(1),
  lessonId: z.string().optional(),
  lessonSlug: z.string().optional()
});

export async function enrollCourseAction(formData: FormData) {
  const parsed = enrollmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { courseId, courseSlug, lessonId, lessonSlug } = parsed.data;

  if (hasSupabaseEnv()) {
    const supabase = createClient();
    const { data: userData } = await supabase!.auth.getUser();
    if (!userData.user) redirect(`/auth/login?next=/courses/${courseSlug}`);

    const { error } = await supabase!.from("course_enrollments").upsert(
      {
        user_id: userData.user.id,
        course_id: courseId,
        last_lesson_id: lessonId || null,
        status: "active",
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,course_id" }
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/courses/${courseSlug}`);
  if (lessonSlug) redirect(`/courses/${courseSlug}/lessons/${lessonSlug}`);
  redirect(`/courses/${courseSlug}`);
}

export async function updateLastLessonAction(input: {
  courseId: string;
  lessonId: string;
}) {
  const parsed = z.object({ courseId: z.string(), lessonId: z.string() }).safeParse(input);
  if (!parsed.success || !hasSupabaseEnv()) return { ok: true };

  const supabase = createClient();
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData.user) return { ok: false, message: "Sign in to sync course position." };

  const { error } = await supabase!.from("course_enrollments").upsert(
    {
      user_id: userData.user.id,
      course_id: parsed.data.courseId,
      last_lesson_id: parsed.data.lessonId,
      status: "active",
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,course_id" }
  );

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
