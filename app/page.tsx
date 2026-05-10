import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCourses, getLabs } from "@/lib/data";

export default async function HomePage() {
  const [courses, labs] = await Promise.all([getCourses(), Promise.resolve(getLabs())]);

  return (
    <div>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div>
          <Badge className="border-primary/30 bg-primary/10 text-primary">Browser-native software mastery</Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-normal sm:text-6xl lg:text-7xl">
            Learn, code, run, test, and ship without leaving the browser.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            CodeForge Academy combines premium markdown lessons, realistic labs, challenge runners,
            progress tracking, and an owner-friendly CMS built for years of course expansion.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/explore">Explore courses</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/labs">Open labs hub</Link>
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-3 text-sm">
            {[
              ["12", "seed courses"],
              ["6", "lab engines"],
              ["100%", "browser practice"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-md border bg-card/70 p-4">
                <div className="text-2xl font-black text-primary">{value}</div>
                <div className="text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border bg-card p-3 shadow-panel">
          <div className="rounded-md bg-slate-950 p-4 text-slate-100">
            <div className="flex gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-6 grid gap-4">
              {labs.map((lab, index) => (
                <div key={lab.id} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{lab.title}</span>
                    <span className="text-xs text-teal-300">ready</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${72 + index * 4}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="border-y bg-card/35 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">Featured learning paths</h2>
              <p className="mt-2 text-muted-foreground">Seeded courses demonstrate the scalable content model.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/explore">View all</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {["Data-driven CMS", "Pluggable lab engine", "Gamified progress"].map((title) => (
            <Card key={title}>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Built as production-shaped foundations: Supabase schema, server actions,
                  React Query, live markdown content, notes, XP, and safe in-browser execution.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
