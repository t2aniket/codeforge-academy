"use client";

import dynamic from "next/dynamic";
import type { LabDefinition } from "@/lib/labs/registry";
import type { LabStarter } from "@/lib/types";

const LabWorkspace = dynamic(
  () => import("@/components/labs/lab-workspace").then((mod) => mod.LabWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[620px] items-center justify-center rounded-md border bg-card text-muted-foreground">
        Loading lab workspace...
      </div>
    )
  }
);

export function LabWorkspaceClient({
  definition,
  starterOverride,
  courseId,
  lessonId
}: {
  definition: LabDefinition;
  starterOverride?: LabStarter;
  courseId?: string;
  lessonId?: string;
}) {
  return (
    <LabWorkspace
      definition={definition}
      starterOverride={starterOverride}
      courseId={courseId}
      lessonId={lessonId}
    />
  );
}
