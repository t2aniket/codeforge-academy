import { notFound } from "next/navigation";
import { LabWorkspaceClient } from "@/components/labs/lab-workspace-client";
import { getLabDefinition } from "@/lib/labs/registry";

export const dynamic = "force-dynamic";

export default function LabPage({ params }: { params: { labId: string } }) {
  const definition = getLabDefinition(params.labId);
  if (!definition) notFound();

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
      <LabWorkspaceClient definition={definition} />
    </div>
  );
}
