import { notFound } from "next/navigation";
import { LabWorkspaceClient } from "@/components/labs/lab-workspace-client";
import { getLabDefinition } from "@/lib/labs/registry";
import { getLesson } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LabPage({
  params,
  searchParams
}: {
  params: { labId: string };
  searchParams: { course?: string; lesson?: string };
}) {
  const definition = getLabDefinition(params.labId);
  if (!definition) notFound();

  const linked =
    searchParams.course && searchParams.lesson
      ? await getLesson(searchParams.course, searchParams.lesson)
      : null;
  const starterOverride =
    linked?.lesson?.lab?.lab === definition.id ? linked.lesson.lab : undefined;

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
      <LabWorkspaceClient
        definition={definition}
        starterOverride={starterOverride}
        courseId={linked?.course?.id}
        lessonId={linked?.lesson?.id}
      />
    </div>
  );
}
