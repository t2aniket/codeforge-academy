import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonActions } from "@/components/lesson-actions";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLesson, getLessonNote } from "@/lib/data";

export default async function LessonPage({ params }: { params: { slug: string; lessonSlug: string } }) {
  const { course, lesson } = await getLesson(params.slug, params.lessonSlug);
  if (!course || !lesson) notFound();
  const initialNote = await getLessonNote(lesson.id);
  const lessons = course.modules.flatMap((module) => module.lessons);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr_320px] lg:px-8">
      <aside className="h-fit rounded-md border bg-card p-3 lg:sticky lg:top-24">
        <div className="px-2 py-2 text-sm font-semibold">{course.title}</div>
        <div className="mt-2 space-y-1">
          {lessons.map((item) => (
            <Link
              key={item.id}
              href={`/courses/${course.slug}/lessons/${item.slug}`}
              className={`block rounded-md px-3 py-2 text-sm ${item.id === lesson.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </aside>
      <article className="rounded-md border bg-card p-6 shadow-panel">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge>{lesson.estimatedMinutes} min</Badge>
          {lesson.lab && <Badge className="border-primary/30 bg-primary/10 text-primary">{lesson.lab.lab} lab ready</Badge>}
        </div>
        <MarkdownViewer content={lesson.markdown} />
        {lesson.quiz && (
          <Card className="mt-10">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold">Checkpoint quiz</h2>
              <p className="mt-3 text-muted-foreground">{lesson.quiz.question}</p>
              <div className="mt-4 grid gap-2">
                {lesson.quiz.options.map((option) => (
                  <div key={option} className="rounded-md border p-3 text-sm">
                    {option}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </article>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
        {lesson.lab && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold">Practice environment</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{lesson.lab.description}</p>
              <Button asChild className="mt-5 w-full">
                <Link href={`/labs/${lesson.lab.lab}?course=${course.slug}&lesson=${lesson.slug}`}>
                  Open in Lab
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <LessonActions courseId={course.id} lessonId={lesson.id} initialNote={initialNote} />
      </aside>
    </div>
  );
}
