"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function signInAction(_: unknown, formData: FormData) {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase is not configured yet. Add env vars before using real login." };
  }

  const parsed = authSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid login" };

  const supabase = createClient();
  const { error } = await supabase!.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: error.message };

  redirect("/dashboard");
}

export async function signUpAction(_: unknown, formData: FormData) {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase is not configured yet. Add env vars before creating accounts." };
  }

  const parsed = authSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid signup" };

  const supabase = createClient();
  const { error } = await supabase!.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password
  });
  if (error) return { ok: false, message: error.message };

  return { ok: true, message: "Account created. Check your email if confirmation is enabled." };
}

export async function signOutAction() {
  if (hasSupabaseEnv()) {
    const supabase = createClient();
    await supabase!.auth.signOut();
  }

  redirect("/");
}
