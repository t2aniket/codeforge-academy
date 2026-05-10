import {
  CourseForm,
  DeleteCourseButton,
  DeleteLessonButton,
  DeleteModuleButton,
  LessonForm,
  ModuleForm,
  PublishToggle
} from "@/components/admin/admin-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminCourses } from "@/app/actions/admin";
import type { Course } from "@/lib/types";

export const metadata = { title: "Admin Panel" };

export default async function AdminPage() {
  const courses = (await getAdminCourses()) as Course[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Badge className="border-primary/30 bg-primary/10 text-primary">Protected CMS</Badge>
      <h1 className="mt-4 text-4xl font-black">Admin Panel</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Manage courses, modules, lessons, markdown content, lab links, and publish state. When
        Supabase is configured, changes persist in Postgres and appear live without rebuilds.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold">Create course</h2>
              <div className="mt-5">
                <CourseForm />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold">Quick lesson add</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Use this when creating a lesson and module in one step.
              </p>
              <div className="mt-5">
                <LessonForm courseSlugs={courses.map((course) => course.slug)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold">{course.title}</h2>
                      <Badge className={course.published ? "border-primary/30 bg-primary/10 text-primary" : ""}>
                        {course.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      /{course.slug} | {course.category} | {course.difficulty}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PublishToggle slug={course.slug} published={course.published} />
                    <DeleteCourseButton id={course.id} />
                  </div>
                </div>

                <details className="mt-5 rounded-md border bg-background p-4">
                  <summary className="cursor-pointer font-medium">Edit course metadata</summary>
                  <div className="mt-4">
                    <CourseForm course={course} />
                  </div>
                </details>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Modules</h3>
                    <Badge>{course.modules.length}</Badge>
                  </div>
                  <ModuleForm courseId={course.id} />

                  {course.modules.map((module) => (
                    <details key={module.id} className="rounded-md border bg-background p-4">
                      <summary className="cursor-pointer">
                        <span className="font-medium">{module.title}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {module.lessons.length} lessons
                        </span>
                      </summary>
                      <div className="mt-4 space-y-4">
                        <div className="flex justify-end">
                          <DeleteModuleButton id={module.id} />
                        </div>
                        <ModuleForm courseId={course.id} module={module} />
                        <div>
                          <h4 className="mb-3 font-semibold">Create lesson in this module</h4>
                          <LessonForm modules={[module]} />
                        </div>
                        <div className="space-y-3">
                          {module.lessons.map((lesson) => (
                            <details key={lesson.id} className="rounded-md border p-4">
                              <summary className="cursor-pointer">
                                <span className="font-medium">{lesson.title}</span>
                                <span className="ml-2 text-sm text-muted-foreground">
                                  {lesson.estimatedMinutes} min
                                </span>
                              </summary>
                              <div className="mt-4 space-y-3">
                                <div className="flex justify-end">
                                  <DeleteLessonButton id={lesson.id} />
                                </div>
                                <LessonForm modules={course.modules} lesson={lesson} />
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
