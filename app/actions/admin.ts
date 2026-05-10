"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { courses } from "@/lib/seed-data";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

const courseSchema = z.object({
  title: z.string().min(3),
  slug: z.string().optional(),
  description: z.string().min(10),
  category: z.string().min(2),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  durationMinutes: z.coerce.number().min(15),
  thumbnail: z.string().optional(),
  tags: z.string().optional(),
  published: z.coerce.boolean().default(false)
});

const lessonSchema = z.object({
  courseSlug: z.string(),
  moduleTitle: z.string().min(3),
  lessonTitle: z.string().min(3),
  markdown: z.string().min(20),
  estimatedMinutes: z.coerce.number().min(1),
  lab: z.string().optional()
});

export async function upsertCourseAction(_: unknown, formData: FormData) {
  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid course" };

  const value = parsed.data;
  const slug = value.slug ? slugify(value.slug) : slugify(value.title);

  if (!hasSupabaseEnv()) {
    return { ok: true, message: "Demo mode: configure Supabase to persist courses. The form is valid." };
  }

  const supabase = createClient();
  const { error } = await supabase!.from("courses").upsert({
    title: value.title,
    slug,
    description: value.description,
    category: value.category,
    difficulty: value.difficulty,
    duration_minutes: value.durationMinutes,
    thumbnail: value.thumbnail || `/course-art/${slug}.jpg`,
    tags: value.tags?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [],
    published: value.published,
    xp: Math.max(500, value.durationMinutes * 4)
  }, { onConflict: "slug" });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/explore");
  return { ok: true, message: "Course saved and published state updated." };
}

export async function addLessonAction(_: unknown, formData: FormData) {
  const parsed = lessonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid lesson" };

  if (!hasSupabaseEnv()) {
    return { ok: true, message: "Demo mode: configure Supabase to persist lessons. The markdown is ready." };
  }

  const value = parsed.data;
  const supabase = createClient();
  const { data: course } = await supabase!.from("courses").select("id, slug").eq("slug", value.courseSlug).single();
  if (!course) return { ok: false, message: "Course not found" };

  const moduleSlug = slugify(value.moduleTitle);
  const { data: moduleRow, error: moduleError } = await supabase!
    .from("modules")
    .upsert(
      { course_id: course.id, title: value.moduleTitle, slug: moduleSlug, summary: "Admin-created module" },
      { onConflict: "course_id,slug" }
    )
    .select("id")
    .single();

  if (moduleError || !moduleRow) return { ok: false, message: moduleError?.message ?? "Could not save module" };

  const lessonSlug = slugify(value.lessonTitle);
  const { error } = await supabase!.from("lessons").upsert(
    {
      module_id: moduleRow.id,
      title: value.lessonTitle,
      slug: lessonSlug,
      markdown: value.markdown,
      estimated_minutes: value.estimatedMinutes,
      lab: value.lab ? { lab: value.lab, title: value.lessonTitle, description: "Admin-linked practice lab" } : null
    },
    { onConflict: "module_id,slug" }
  );

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/courses/${value.courseSlug}`);
  return { ok: true, message: "Lesson saved. It is live immediately." };
}

export async function togglePublishAction(slug: string, published: boolean) {
  if (!hasSupabaseEnv()) return { ok: true, message: "Demo mode: Supabase required to publish." };
  const supabase = createClient();
  const { error } = await supabase!.from("courses").update({ published }).eq("slug", slug);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/explore");
  return { ok: true, message: "Publish state updated." };
}

export async function getAdminCourses() {
  if (!hasSupabaseEnv()) return courses;
  const supabase = createClient();
  const { data, error } = await supabase!.from("courses").select("*").order("created_at", { ascending: false });
  if (error || !data?.length) return courses;
  return data.map((course) => ({
    ...course,
    durationMinutes: course.duration_minutes,
    modules: []
  }));
}
