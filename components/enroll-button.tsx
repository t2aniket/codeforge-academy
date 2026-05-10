import { enrollCourseAction } from "@/app/actions/enrollment";
import { Button } from "@/components/ui/button";

export function EnrollButton({
  courseId,
  courseSlug,
  lessonId,
  lessonSlug,
  label = "Enroll and start"
}: {
  courseId: string;
  courseSlug: string;
  lessonId?: string;
  lessonSlug?: string;
  label?: string;
}) {
  return (
    <form action={enrollCourseAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="courseSlug" value={courseSlug} />
      {lessonId && <input type="hidden" name="lessonId" value={lessonId} />}
      {lessonSlug && <input type="hidden" name="lessonSlug" value={lessonSlug} />}
      <Button size="lg" className="w-full sm:w-auto" type="submit">
        {label}
      </Button>
    </form>
  );
}
