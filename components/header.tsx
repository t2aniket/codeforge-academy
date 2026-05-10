"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  ["Explore", "/explore"],
  ["Labs", "/labs"],
  ["Challenges", "/challenges"],
  ["Dashboard", "/dashboard"]
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/86 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground shadow-glow">
            CF
          </span>
          <span className="hidden text-base font-semibold sm:inline">CodeForge Academy</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                pathname.startsWith(href) && href !== "/" && "bg-muted text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            className="hidden h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground shadow-sm sm:flex"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          >
            <span>Search</span>
            <kbd className="rounded-sm border bg-muted px-1.5 text-[11px]">Ctrl K</kbd>
          </button>
          <Button asChild size="sm" variant="outline">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/playground">Playground</Link>
          </Button>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-t px-3 py-2 md:hidden">
        {nav.map(([label, href]) => (
          <Link key={href} href={href} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground">
            {label}
          </Link>
        ))}
      </div>
    </header>
  );
}
