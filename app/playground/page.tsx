import { LabWorkspaceClient } from "@/components/labs/lab-workspace-client";
import { labRegistry } from "@/lib/labs/registry";

export const metadata = { title: "Global Playground" };
export const dynamic = "force-dynamic";

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
      <LabWorkspaceClient definition={labRegistry.playground} />
    </div>
  );
}
