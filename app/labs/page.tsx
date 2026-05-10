import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLabs } from "@/lib/data";

export const metadata = { title: "Labs Hub" };

export default function LabsPage() {
  const labs = getLabs();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Badge className="border-primary/30 bg-primary/10 text-primary">Practice environments</Badge>
      <h1 className="mt-4 text-4xl font-black">Labs Hub</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Every lab is a registry-backed environment that lessons can launch with starter files,
        commands, dashboards, and guided validation.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => (
          <Card key={lab.id} className="transition hover:-translate-y-1 hover:border-primary/50">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold">{lab.title}</h2>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-muted-foreground">{lab.description}</p>
              <Button asChild className="mt-5 w-full">
                <Link href={`/labs/${lab.id}`}>Launch lab</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
