"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function signInAction(_: unknown, formData: FormData) {
  const parsed = authSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid login" };

  if (!hasSupabaseEnv()) {
    cookies().set("codeforge_demo_session", "active", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    cookies().set("codeforge_demo_email", parsed.data.email, {
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    redirect("/dashboard");
  }

  const supabase = createClient();
  const { error } = await supabase!.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: error.message };

  redirect("/dashboard");
}

export async function signUpAction(_: unknown, formData: FormData) {
  const parsed = authSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid signup" };

  if (!hasSupabaseEnv()) {
    cookies().set("codeforge_demo_session", "active", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    cookies().set("codeforge_demo_email", parsed.data.email, {
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    redirect("/dashboard");
  }

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
  cookies().delete("codeforge_demo_session");
  cookies().delete("codeforge_demo_email");

  redirect("/auth/login");
}
