import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">404</p>
      <h1 className="mt-4 text-4xl font-semibold">This forge is quiet.</h1>
      <p className="mt-3 text-muted-foreground">
        The page you are looking for does not exist or has moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/explore">Explore courses</Link>
      </Button>
    </div>
  );
}
