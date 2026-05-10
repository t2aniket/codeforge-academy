import { unstable_noStore as noStore } from "next/cache";
import { challenges, courses, demoProgress, labSummaries } from "@/lib/seed-data";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";

type DbCourse = Omit<Course, "modules"> & {
  modules: Course["modules"];
};

export async function getCourses() {
  noStore();
  if (!hasSupabaseEnv()) return courses;

  const supabase = createClient();
  const { data, error } = await supabase!
    .from("courses")
    .select("*, modules(*, lessons(*))")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return courses;
  return normalizeCourses(data as unknown as DbCourse[]);
}

export async function getCourse(slug: string) {
  const all = await getCourses();
  return all.find((course) => course.slug === slug) ?? null;
}

export async function getLesson(courseSlug: string, lessonSlug: string) {
  const course = await getCourse(courseSlug);
  const lesson = course?.modules.flatMap((module) => module.lessons).find((item) => item.slug === lessonSlug);
  return { course, lesson: lesson ?? null };
}

export async function getChallenges() {
  noStore();
  return challenges;
}

export async function getDashboard() {
  noStore();
  return {
    progress: demoProgress,
    courses: courses.slice(0, 5),
    recommended: courses.slice(5, 9)
  };
}

export function getLabs() {
  return labSummaries;
}

function normalizeCourses(rows: DbCourse[]): Course[] {
  return rows.map((course) => ({
    ...course,
    durationMinutes: Number(course.durationMinutes ?? (course as unknown as { duration_minutes?: number }).duration_minutes ?? 0),
    modules: [...(course.modules ?? [])].map((module) => ({
      ...module,
      courseSlug: course.slug,
      lessons: [...(module.lessons ?? [])].map((lesson) => ({
        ...lesson,
        courseSlug: course.slug,
        moduleId: module.id
      }))
    }))
  }));
}
