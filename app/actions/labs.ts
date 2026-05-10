"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { LabKind } from "@/lib/types";

const labSessionSchema = z.object({
  lab: z.enum(["docker", "testing", "network", "linux", "sql", "playground"]),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  files: z.record(z.string()).default({}),
  terminalHistory: z.array(z.string()).default([]),
  status: z.enum(["active", "completed"]).default("active")
});

export async function saveLabSessionAction(input: {
  lab: LabKind;
  courseId?: string;
  lessonId?: string;
  files: Record<string, string>;
  terminalHistory: string[];
  status?: "active" | "completed";
}) {
  const parsed = labSessionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid lab session." };

  if (!hasSupabaseEnv()) {
    return { ok: true, message: "Demo mode: lab session saved locally." };
  }

  const supabase = createClient();
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData.user) return { ok: false, message: "Sign in to sync lab sessions." };

  const { error } = await supabase!.from("lab_sessions").insert({
    user_id: userData.user.id,
    lab: parsed.data.lab,
    course_id: parsed.data.courseId || null,
    lesson_id: parsed.data.lessonId || null,
    files: parsed.data.files,
    terminal_history: parsed.data.terminalHistory,
    status: parsed.data.status,
    updated_at: new Date().toISOString()
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard");
  return { ok: true, message: "Lab session synced." };
}
