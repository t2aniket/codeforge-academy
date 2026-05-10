import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Course } from "@/lib/types";
import { formatMinutes } from "@/lib/utils";

export function CourseCard({ course }: { course: Course }) {
  const labCount = course.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.lab).length;

  return (
    <Card className="group overflow-hidden transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow">
      <div className="h-36 bg-[linear-gradient(135deg,rgba(20,184,166,.9),rgba(251,146,60,.75)),url('/grid.svg')] p-5">
        <div className="flex h-full flex-col justify-between">
          <Badge className="w-fit border-white/35 bg-white/15 text-white">{course.category}</Badge>
          <div className="text-2xl font-black text-white">{course.title.split(" ").slice(0, 3).join(" ")}</div>
        </div>
      </div>
      <CardContent className="space-y-4 p-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{course.difficulty}</span>
            <span>•</span>
            <span>{formatMinutes(course.durationMinutes)}</span>
            <span>•</span>
            <span>{labCount} labs</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold">{course.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{course.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {course.tags.slice(0, 3).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <Button asChild className="w-full">
          <Link href={`/courses/${course.slug}`}>Start learning</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
