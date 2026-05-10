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

export async function getLessonNote(lessonId: string) {
  noStore();
  if (!hasSupabaseEnv()) return "";

  const supabase = createClient();
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData.user) return "";

  const { data, error } = await supabase!
    .from("user_notes")
    .select("body")
    .eq("user_id", userData.user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (error) return "";
  return data?.body ?? "";
}

export async function getChallenges() {
  noStore();
  if (hasSupabaseEnv()) {
    const supabase = createClient();
    const { data, error } = await supabase!
      .from("challenges")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (!error && data?.length) {
      return data.map((challenge) => ({
        id: challenge.id,
        title: challenge.title,
        slug: challenge.slug,
        difficulty: challenge.difficulty,
        category: challenge.category,
        prompt: challenge.prompt,
        starterCode: challenge.starter_code,
        tests: challenge.tests
      }));
    }
  }

  return challenges;
}

export async function getDashboard() {
  noStore();
  const allCourses = await getCourses();

  if (hasSupabaseEnv()) {
    const supabase = createClient();
    const { data: userData } = await supabase!.auth.getUser();

    if (userData.user) {
      const [{ data: progressRows }, { data: labRows }, { data: challengeRows }] = await Promise.all([
        supabase!
          .from("user_progress")
          .select("lesson_id,xp_earned,completed_at")
          .eq("user_id", userData.user.id)
          .eq("completed", true),
        supabase!.from("lab_sessions").select("lab").eq("user_id", userData.user.id),
        supabase!
          .from("challenge_submissions")
          .select("challenge_id,xp_earned,created_at")
          .eq("user_id", userData.user.id)
          .eq("passed", true)
      ]);

      const completedLessons = (progressRows ?? []).map((row) => row.lesson_id as string);
      const lessonXp = (progressRows ?? []).reduce((sum, row) => sum + Number(row.xp_earned ?? 0), 0);
      const challengeXp = (challengeRows ?? []).reduce((sum, row) => sum + Number(row.xp_earned ?? 0), 0);
      const xp = lessonXp + challengeXp;
      const practicedLabs = Array.from(new Set((labRows ?? []).map((row) => row.lab as never)));
      const streak = calculateStreak((progressRows ?? []).map((row) => row.completed_at as string | null));

      return {
        progress: {
          completedLessons,
          practicedLabs,
          xp,
          streak,
          badges: buildBadges(completedLessons.length, practicedLabs.length, streak)
        },
        courses: allCourses.slice(0, 5),
        recommended: allCourses.slice(5, 9),
        solvedChallenges: challengeRows ?? []
      };
    }
  }

  return {
    progress: demoProgress,
    courses: allCourses.slice(0, 5),
    recommended: allCourses.slice(5, 9),
    solvedChallenges: []
  };
}

export function getLabs() {
  return labSummaries;
}

function calculateStreak(dates: Array<string | null>) {
  const days = new Set(
    dates
      .filter(Boolean)
      .map((date) => new Date(date as string).toISOString().slice(0, 10))
  );
  let streak = 0;
  const cursor = new Date();

  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildBadges(completedLessons: number, practicedLabs: number, streak: number) {
  const badges = [];
  if (completedLessons >= 1) badges.push("First Lesson");
  if (completedLessons >= 10) badges.push("Ten Lesson Run");
  if (practicedLabs >= 1) badges.push("First Lab");
  if (practicedLabs >= 3) badges.push("Lab Regular");
  if (streak >= 7) badges.push("Seven Day Streak");
  return badges.length ? badges : ["Getting Started"];
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
