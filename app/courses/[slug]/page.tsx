import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCourse } from "@/lib/data";
import { formatMinutes } from "@/lib/utils";

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = await getCourse(params.slug);
  if (!course) notFound();
  const firstLesson = course.modules[0]?.lessons[0];

  return (
    <div>
      <section className="border-b bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge className="border-primary/30 bg-primary/10 text-primary">{course.category}</Badge>
            <h1 className="mt-5 text-5xl font-black">{course.title}</h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">{course.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[course.difficulty, formatMinutes(course.durationMinutes), `${course.xp} XP`, ...course.tags].map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
            {firstLesson && (
              <Button asChild size="lg" className="mt-8">
                <Link href={`/courses/${course.slug}/lessons/${firstLesson.slug}`}>Start course</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="space-y-5">
          {course.modules.map((module, index) => (
            <Card key={module.id}>
              <CardContent className="p-6">
                <div className="text-sm font-semibold text-primary">Module {index + 1}</div>
                <h2 className="mt-1 text-2xl font-bold">{module.title}</h2>
                <p className="mt-2 text-muted-foreground">{module.summary}</p>
                <div className="mt-5 divide-y rounded-md border">
                  {module.lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                      className="flex items-center justify-between gap-4 p-4 hover:bg-muted"
                    >
                      <div>
                        <div className="font-medium">{lesson.title}</div>
                        <div className="text-sm text-muted-foreground">{formatMinutes(lesson.estimatedMinutes)}</div>
                      </div>
                      {lesson.lab && <Badge>{lesson.lab.lab} lab</Badge>}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="h-fit">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">What is included</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Markdown lessons with live rendering and rich practice links.</p>
              <p>Pre-filled browser labs attached to lesson context.</p>
              <p>Progress, notes, quizzes, XP, streaks, and challenge recommendations.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
