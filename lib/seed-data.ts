import type { Challenge, Course, LabKind, UserProgress } from "@/lib/types";

const lesson = (
  courseSlug: string,
  moduleId: string,
  slug: string,
  title: string,
  markdown: string,
  lab?: NonNullable<Course["modules"][number]["lessons"][number]["lab"]>
) => ({
  id: `${courseSlug}-${slug}`,
  moduleId,
  courseSlug,
  slug,
  title,
  estimatedMinutes: 18,
  markdown,
  lab,
  quiz: {
    question: "What is the most important habit while practicing this lesson?",
    options: ["Read passively", "Run small experiments", "Skip feedback"],
    answer: "Run small experiments"
  }
});

const mkCourse = (
  index: number,
  title: string,
  slug: string,
  category: string,
  difficulty: Course["difficulty"],
  tags: string[],
  lab?: LabKind
): Course => {
  const moduleId = `${slug}-m1`;
  const files: Record<string, string> | undefined =
    lab === "playground"
      ? { "main.js": "function forge(input) {\n  return input.toUpperCase();\n}\n\nconsole.log(forge('codeforge'));" }
      : lab === "sql"
        ? { "query.sql": "select name, xp from learners where xp >= 500 order by xp desc;" }
        : lab === "testing"
          ? {
              "test_checkout.py":
                "def test_checkout_total():\n    subtotal = 40\n    tax = 4\n    assert subtotal + tax == 44\n"
            }
          : lab
            ? { "commands.sh": "help\nstatus\nrun checks" }
            : undefined;
  const labStarter = lab
    ? {
        lab,
        title: `${title} practice lab`,
        description: `A guided browser-native lab for ${title}.`,
        language: lab === "playground" ? "javascript" : lab === "sql" ? "sql" : "bash",
        files,
        commands:
          lab === "docker"
            ? ["docker ps", "docker build -t api .", "docker run -p 8080:8080 api"]
            : lab === "linux"
              ? ["pwd", "ls -la", "cat README.md", "mkdir logs"]
              : lab === "network"
                ? ["show ip interface brief", "conf t", "interface g0/1", "ip address 10.0.0.1 255.255.255.0"]
                : ["run"],
        challenge: "Complete the checklist, run the validation command, and explain the result in your own notes."
      }
    : undefined;

  return {
    id: `course-${index}`,
    title,
    slug,
    description:
      `A practical, browser-native path for mastering ${title.toLowerCase()} with theory, guided drills, and realistic projects.`,
    category,
    difficulty,
    durationMinutes: 240 + index * 35,
    thumbnail: `/course-art/${slug}.jpg`,
    tags,
    published: true,
    xp: 900 + index * 120,
    modules: [
      {
        id: moduleId,
        courseSlug: slug,
        title: "Core foundations",
        summary: "Build the mental model first, then reinforce it inside an interactive lab.",
        lessons: [
          lesson(
            slug,
            moduleId,
            "mental-model",
            "Mental model and workflow",
            `# ${title}: mental model

Software skill compounds when you can connect ideas to a repeatable workflow. In CodeForge Academy, every lesson is designed as a short loop:

1. Learn the concept.
2. Inspect a realistic example.
3. Practice in a safe browser lab.
4. Save notes and complete the checkpoint.

## What you will practice

- Read production-style examples instead of toy fragments.
- Make one small change at a time.
- Use feedback from tests, terminals, dashboards, or simulators.

> The goal is not memorization. The goal is confident execution.`,
            labStarter
          ),
          lesson(
            slug,
            moduleId,
            "project-checkpoint",
            "Project checkpoint",
            `# Project checkpoint

Now apply the workflow to a realistic scenario.

## Scenario

You joined a product team that needs a small but reliable implementation. Your job is to reason through the constraints, make a change, run the validation flow, and write a short note about what changed.

## Completion criteria

- The example runs in the browser lab.
- The validation output is understood, not just copied.
- Your lesson note explains the tradeoff you chose.`,
            labStarter
          )
        ]
      }
    ]
  };
};

export const courses: Course[] = [
  mkCourse(1, "Frontend Engineering with React and Next.js", "frontend-react-nextjs", "Frontend", "Beginner", ["React", "Next.js", "UI"], "playground"),
  mkCourse(2, "Backend APIs with TypeScript", "backend-apis-typescript", "Backend", "Intermediate", ["REST", "Auth", "Node"], "playground"),
  mkCourse(3, "Docker for Real Development Teams", "docker-real-teams", "DevOps", "Beginner", ["Docker", "Containers"], "docker"),
  mkCourse(4, "Linux Terminal Mastery", "linux-terminal-mastery", "Linux", "Beginner", ["Shell", "Files", "Processes"], "linux"),
  mkCourse(5, "SQL Databases from Query to Schema", "sql-query-schema", "Databases", "Beginner", ["SQL", "Postgres"], "sql"),
  mkCourse(6, "Automation Testing with Playwright and Pytest", "automation-testing-playwright-pytest", "Testing", "Intermediate", ["Playwright", "Pytest", "QA"], "testing"),
  mkCourse(7, "Network Fundamentals and CCNA Labs", "network-ccna-labs", "Networking", "Intermediate", ["CCNA", "Routing", "Switching"], "network"),
  mkCourse(8, "Cybersecurity Foundations", "cybersecurity-foundations", "Security", "Beginner", ["Threats", "Web Security"]),
  mkCourse(9, "Kubernetes Operator Mindset", "kubernetes-operator-mindset", "DevOps", "Advanced", ["Kubernetes", "SRE"]),
  mkCourse(10, "Cloud Architecture on AWS Concepts", "aws-cloud-architecture", "Cloud", "Intermediate", ["AWS", "Architecture"]),
  mkCourse(11, "Manual QA and Exploratory Testing", "manual-qa-exploratory-testing", "Testing", "Beginner", ["QA", "Test Plans"], "testing"),
  mkCourse(12, "AI Tools for Productive Developers", "ai-tools-developers", "AI", "Beginner", ["AI", "Prompting", "Automation"], "playground")
];

export const challenges: Challenge[] = [
  {
    id: "challenge-1",
    title: "Normalize Usernames",
    slug: "normalize-usernames",
    difficulty: "Beginner",
    category: "Strings",
    prompt: "Return a lowercase username with spaces replaced by hyphens.",
    starterCode: "function normalizeUsername(value) {\n  // write your solution\n}\n\nmodule.exports = normalizeUsername;",
    tests:
      "expect(fn('Ada Lovelace')).toBe('ada-lovelace');\nexpect(fn(' Grace  Hopper ')).toBe('grace-hopper');"
  },
  {
    id: "challenge-2",
    title: "Retry Budget",
    slug: "retry-budget",
    difficulty: "Intermediate",
    category: "Reliability",
    prompt: "Given attempts and maxRetries, return whether another retry is allowed.",
    starterCode: "function canRetry(attempts, maxRetries) {\n  return false;\n}\n\nmodule.exports = canRetry;",
    tests: "expect(fn(0, 3)).toBe(true);\nexpect(fn(3, 3)).toBe(false);"
  },
  {
    id: "challenge-3",
    title: "Top SQL Learners",
    slug: "top-sql-learners",
    difficulty: "Beginner",
    category: "SQL",
    prompt: "Write a query that returns learners with at least 500 XP ordered by XP descending.",
    starterCode: "select * from learners;",
    tests: "Expected columns: name, xp. Filter xp >= 500. Order by xp desc."
  }
];

export const demoProgress: UserProgress = {
  completedLessons: ["frontend-react-nextjs-mental-model", "docker-real-teams-mental-model"],
  practicedLabs: ["playground", "docker", "sql"],
  xp: 2840,
  streak: 9,
  badges: ["First Lab", "Docker Spark", "Query Runner", "Seven Day Streak"]
};

export const labSummaries = [
  {
    id: "docker",
    title: "Docker Lab",
    description: "Container build/run simulator with image layers, logs, ports, and validation checks."
  },
  {
    id: "testing",
    title: "Automation Testing Lab",
    description: "Pytest, Selenium-style, Playwright-style, and Cypress-style test practice with feedback."
  },
  {
    id: "network",
    title: "Network & CCNA Lab",
    description: "Router and switch CLI plus topology visualizer for routing, VLANs, and interfaces."
  },
  {
    id: "linux",
    title: "Linux Terminal Lab",
    description: "Realistic shell practice for files, permissions, pipes, services, and diagnostics."
  },
  {
    id: "sql",
    title: "SQL Database Lab",
    description: "In-browser query editor with sample tables, explain-style feedback, and challenges."
  },
  {
    id: "playground",
    title: "General Code Playground",
    description: "Monaco editor for JavaScript, TypeScript-style exercises, Python via Pyodide, and snippets."
  }
] as const;
