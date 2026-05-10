import { CourseForm, LessonForm } from "@/components/admin/admin-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminCourses } from "@/app/actions/admin";

export const metadata = { title: "Admin Panel" };

export default async function AdminPage() {
  const courses = await getAdminCourses();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Badge className="border-primary/30 bg-primary/10 text-primary">Protected CMS</Badge>
      <h1 className="mt-4 text-4xl font-black">Admin Panel</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Add courses, modules, lessons, markdown, quizzes, and lab links. With Supabase configured,
        changes are stored in Postgres and appear live without rebuilding.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold">Add or edit course</h2>
            <div className="mt-5">
              <CourseForm />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold">Add lesson</h2>
            <div className="mt-5">
              <LessonForm courseSlugs={courses.map((course) => course.slug)} />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold">Current courses</h2>
          <div className="mt-5 divide-y rounded-md border">
            {courses.map((course) => (
              <div key={course.slug} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-medium">{course.title}</div>
                  <div className="text-sm text-muted-foreground">/{course.slug} · {course.category} · {course.difficulty}</div>
                </div>
                <Badge className={course.published ? "border-primary/30 bg-primary/10 text-primary" : ""}>
                  {course.published ? "Published" : "Draft"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
