"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { courses, labSummaries } from "@/lib/seed-data";
import { Input } from "@/components/ui/input";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.toLowerCase();
    return [
      ...courses.map((course) => ({ label: course.title, meta: course.category, href: `/courses/${course.slug}` })),
      ...courses.flatMap((course) =>
        course.modules.flatMap((module) =>
          module.lessons.map((lesson) => ({
            label: lesson.title,
            meta: course.title,
            href: `/courses/${course.slug}/lessons/${lesson.slug}`
          }))
        )
      ),
      ...labSummaries.map((lab) => ({ label: lab.title, meta: "Lab", href: `/labs/${lab.id}` }))
    ].filter((item) => !q || `${item.label} ${item.meta}`.toLowerCase().includes(q));
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="mx-auto mt-24 max-w-2xl overflow-hidden rounded-md border bg-card shadow-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b p-3">
          <Input autoFocus placeholder="Search courses, lessons, labs..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {results.slice(0, 12).map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-md px-3 py-3 hover:bg-muted"
            >
              <span className="font-medium">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.meta}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
