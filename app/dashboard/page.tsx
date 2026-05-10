import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboard } from "@/lib/data";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { progress, courses, recommended, solvedChallenges } = await getDashboard();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Badge className="border-primary/30 bg-primary/10 text-primary">Learner cockpit</Badge>
      <h1 className="mt-4 text-4xl font-black">Dashboard</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {[
          ["XP", progress.xp],
          ["Daily streak", `${progress.streak} days`],
          ["Lessons done", progress.completedLessons.length],
          ["Labs practiced", progress.practicedLabs.length],
          ["Challenges", solvedChallenges.length]
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">{label}</div>
              <div className="mt-2 text-3xl font-black text-primary">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold">Continue learning</h2>
            <div className="mt-5 space-y-3">
              {courses.map((course) => (
                <div key={course.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
                  <div>
                    <div className="font-semibold">{course.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {course.completedLessons} of {course.totalLessons} lessons complete
                    </div>
                    <div className="mt-2 h-2 w-56 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${course.progressPercent}%` }} />
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={course.resumeHref}>Resume</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold">Badges</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {progress.badges.map((badge) => (
                  <Badge key={badge} className="border-secondary/40 bg-secondary/10 text-foreground">{badge}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold">Recommended</h2>
              <div className="mt-4 space-y-3">
                {recommended.map((course) => (
                  <Link key={course.id} href={`/courses/${course.slug}`} className="block rounded-md border p-3 hover:bg-muted">
                    {course.title}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold">Solved challenges</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                {solvedChallenges.length ? (
                  solvedChallenges.slice(0, 5).map((challenge, index) => (
                    <div key={`${challenge.challenge_id}-${index}`} className="rounded-md border p-3">
                      Challenge {challenge.challenge_id} · {challenge.xp_earned} XP
                    </div>
                  ))
                ) : (
                  <p>No solved challenges yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
