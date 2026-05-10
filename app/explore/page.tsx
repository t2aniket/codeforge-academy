import { CourseCard } from "@/components/course-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getCourses } from "@/lib/data";

export const metadata = { title: "Explore Courses" };

export default async function ExplorePage({
  searchParams
}: {
  searchParams: { q?: string; category?: string; difficulty?: string };
}) {
  const courses = await getCourses();
  const q = searchParams.q?.toLowerCase() ?? "";
  const category = searchParams.category ?? "All";
  const difficulty = searchParams.difficulty ?? "All";
  const categories = ["All", ...Array.from(new Set(courses.map((course) => course.category)))];
  const filtered = courses.filter((course) => {
    const matchesQuery = !q || `${course.title} ${course.description} ${course.tags.join(" ")}`.toLowerCase().includes(q);
    const matchesCategory = category === "All" || course.category === category;
    const matchesDifficulty = difficulty === "All" || course.difficulty === difficulty;
    return matchesQuery && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="border-primary/30 bg-primary/10 text-primary">Course catalog</Badge>
          <h1 className="mt-4 text-4xl font-bold">Explore CodeForge paths</h1>
          <p className="mt-2 text-muted-foreground">Search by topic, difficulty, category, or tool.</p>
        </div>
        <form className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-[220px_160px_160px]">
          <Input name="q" placeholder="Search courses..." defaultValue={searchParams.q} />
          <Select name="category" defaultValue={category}>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
          <Select name="difficulty" defaultValue={difficulty}>
            {["All", "Beginner", "Intermediate", "Advanced"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </form>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
