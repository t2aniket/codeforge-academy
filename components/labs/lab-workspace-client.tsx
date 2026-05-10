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

const SqlLab = dynamic(
  () => import("@/components/labs/sql-lab").then((mod) => mod.SqlLab),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[620px] items-center justify-center rounded-md border bg-card text-muted-foreground">
        Loading SQL lab...
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
  if (definition.id === "sql") {
    return (
      <SqlLab
        definition={definition}
        starterOverride={starterOverride}
        courseId={courseId}
        lessonId={lessonId}
      />
    );
  }

  return (
    <LabWorkspace
      definition={definition}
      starterOverride={starterOverride}
      courseId={courseId}
      lessonId={lessonId}
    />
  );
}
