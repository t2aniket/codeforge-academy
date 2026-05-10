"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { courses } from "@/lib/seed-data";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

const courseSchema = z.object({
  id: z.string().optional(),
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

const moduleSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1),
  title: z.string().min(3),
  slug: z.string().optional(),
  summary: z.string().optional(),
  sortOrder: z.coerce.number().min(0).default(0)
});

const lessonSchema = z.object({
  id: z.string().optional(),
  courseSlug: z.string().optional(),
  moduleId: z.string().optional(),
  moduleTitle: z.string().optional(),
  lessonTitle: z.string().min(3),
  slug: z.string().optional(),
  markdown: z.string().min(20),
  estimatedMinutes: z.coerce.number().min(1),
  lab: z.string().optional(),
  sortOrder: z.coerce.number().min(0).default(0)
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
  const payload = {
    ...(value.id ? { id: value.id } : {}),
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
  };
  const { error } = await supabase!.from("courses").upsert(payload, { onConflict: "slug" });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/admin");
  return { ok: true, message: "Course saved and published state updated." };
}

export async function upsertModuleAction(_: unknown, formData: FormData) {
  const parsed = moduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid module" };

  const value = parsed.data;
  const slug = value.slug ? slugify(value.slug) : slugify(value.title);

  if (!hasSupabaseEnv()) {
    return { ok: true, message: "Demo mode: configure Supabase to persist modules. The form is valid." };
  }

  const supabase = createClient();
  const { error } = await supabase!.from("modules").upsert(
    {
      ...(value.id ? { id: value.id } : {}),
      course_id: value.courseId,
      title: value.title,
      slug,
      summary: value.summary ?? "",
      sort_order: value.sortOrder
    },
    { onConflict: value.id ? "id" : "course_id,slug" }
  );

  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/explore");
  return { ok: true, message: "Module saved." };
}

export async function addLessonAction(_: unknown, formData: FormData) {
  const parsed = lessonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid lesson" };

  if (!hasSupabaseEnv()) {
    return { ok: true, message: "Demo mode: configure Supabase to persist lessons. The markdown is ready." };
  }

  const value = parsed.data;
  const supabase = createClient();
  let moduleId = value.moduleId;
  let courseSlug = value.courseSlug;

  if (!moduleId) {
    if (!value.courseSlug || !value.moduleTitle) {
      return { ok: false, message: "Select a module or provide a course and module title." };
    }

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
    moduleId = moduleRow.id;
    courseSlug = course.slug;
  }

  const lessonSlug = value.slug ? slugify(value.slug) : slugify(value.lessonTitle);
  const { error } = await supabase!.from("lessons").upsert(
    {
      ...(value.id ? { id: value.id } : {}),
      module_id: moduleId,
      title: value.lessonTitle,
      slug: lessonSlug,
      markdown: value.markdown,
      estimated_minutes: value.estimatedMinutes,
      lab: value.lab ? { lab: value.lab, title: value.lessonTitle, description: "Admin-linked practice lab" } : null,
      sort_order: value.sortOrder
    },
    { onConflict: value.id ? "id" : "module_id,slug" }
  );

  if (error) return { ok: false, message: error.message };
  if (courseSlug) revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/admin");
  return { ok: true, message: "Lesson saved. It is live immediately." };
}

export async function togglePublishAction(slug: string, published: boolean) {
  if (!hasSupabaseEnv()) return { ok: true, message: "Demo mode: Supabase required to publish." };
  const supabase = createClient();
  const { error } = await supabase!.from("courses").update({ published }).eq("slug", slug);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/admin");
  return { ok: true, message: "Publish state updated." };
}

export async function togglePublishFormAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const published = String(formData.get("published") ?? "") === "true";
  await togglePublishAction(slug, published);
}

export async function deleteCourseAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id || !hasSupabaseEnv()) return;

  const supabase = createClient();
  const { error } = await supabase!.from("courses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/admin");
}

export async function deleteModuleAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id || !hasSupabaseEnv()) return;

  const supabase = createClient();
  const { error } = await supabase!.from("modules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deleteLessonAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id || !hasSupabaseEnv()) return;

  const supabase = createClient();
  const { error } = await supabase!.from("lessons").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function getAdminCourses() {
  if (!hasSupabaseEnv()) return courses;
  const supabase = createClient();
  const { data, error } = await supabase!
    .from("courses")
    .select("*, modules(*, lessons(*))")
    .order("created_at", { ascending: false })
    .order("sort_order", { foreignTable: "modules", ascending: true })
    .order("sort_order", { foreignTable: "modules.lessons", ascending: true });
  if (error || !data?.length) return courses;
  return data.map((course) => ({
    ...course,
    durationMinutes: course.duration_minutes,
    modules: (course.modules ?? []).map((module: {
      id: string;
      title: string;
      slug: string;
      summary: string;
      sort_order?: number;
      lessons?: Array<{
        id: string;
        title: string;
        slug: string;
        markdown: string;
        estimated_minutes: number;
        lab?: { lab?: string } | null;
        sort_order?: number;
      }>;
    }) => ({
      ...module,
      courseSlug: course.slug,
      sortOrder: module.sort_order ?? 0,
      lessons: (module.lessons ?? []).map((lesson) => ({
        ...lesson,
        courseSlug: course.slug,
        moduleId: module.id,
        estimatedMinutes: lesson.estimated_minutes,
        lab: lesson.lab ?? undefined,
        sortOrder: lesson.sort_order ?? 0
      }))
    }))
  }));
}
