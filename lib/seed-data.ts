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

const labStarter = (
  lab: LabKind,
  title: string,
  description: string,
  files?: Record<string, string>,
  commands: string[] = ["help", "run checks"],
  language = "bash"
) => ({
  lab,
  title,
  description,
  language,
  files,
  commands,
  challenge: "Run the guided commands, inspect the output, save a note, and complete the lesson for XP."
});

const fullLesson = (
  courseSlug: string,
  moduleId: string,
  slug: string,
  title: string,
  estimatedMinutes: number,
  markdown: string,
  quiz: { question: string; options: string[]; answer: string },
  lab?: NonNullable<Course["modules"][number]["lessons"][number]["lab"]>
) => ({
  id: `${courseSlug}-${slug}`,
  moduleId,
  courseSlug,
  slug,
  title,
  estimatedMinutes,
  markdown,
  quiz,
  lab
});

const fullStackCourse: Course = {
  id: "course-0",
  title: "Full-Stack Product Engineering: Browser to Production",
  slug: "full-stack-product-engineering",
  description:
    "A complete text-first flagship course that takes a learner from product requirements to frontend, backend, SQL, testing, Docker, Linux operations, and network debugging using CodeForge labs.",
  category: "Full Stack",
  difficulty: "Intermediate",
  durationMinutes: 960,
  thumbnail: "/course-art/full-stack-product-engineering.jpg",
  tags: ["Full Stack", "Next.js", "SQL", "Testing", "Docker", "Linux", "Networking"],
  published: true,
  xp: 3600,
  modules: [
    {
      id: "full-stack-product-engineering-m1",
      courseSlug: "full-stack-product-engineering",
      title: "Product foundations and browser workflow",
      summary: "Turn an idea into a working product slice with clear requirements, UI state, and a browser playground loop.",
      lessons: [
        fullLesson(
          "full-stack-product-engineering",
          "full-stack-product-engineering-m1",
          "product-slice-thinking",
          "Product slice thinking",
          28,
          `# Product slice thinking

A full-stack engineer does not start by opening ten files. Start by defining the smallest product slice that proves value.

For CodeForge Academy, a product slice has five parts:

1. A user goal.
2. A visible interface.
3. A data shape.
4. A validation rule.
5. A completion signal.

Example: "A learner can save a lesson note." The interface is a textarea and button. The data shape is lesson id plus body. The validation rule is that the note belongs to the signed-in user. The completion signal is a saved toast and restored note on reload.

## Practice

Open the playground and model a tiny feature as plain data before writing UI. This habit keeps projects from becoming a pile of components with no product spine.

\`\`\`ts
type ProductSlice = {
  userGoal: string;
  data: Record<string, string>;
  successSignal: string;
};
\`\`\`

## Checkpoint

Write one note explaining which part of the slice is most risky: interface, data, validation, or completion signal.`,
          {
            question: "What is the purpose of defining a product slice before coding?",
            options: ["To avoid writing tests", "To connect user value, data, and completion criteria", "To choose colors first"],
            answer: "To connect user value, data, and completion criteria"
          },
          labStarter(
            "playground",
            "Model a product slice",
            "Use Monaco to model a product slice as typed data and run a small JavaScript check.",
            {
              "main.js":
                "const slice = {\n  userGoal: 'Save a lesson note',\n  data: { lessonId: 'lesson-1', body: 'My note' },\n  successSignal: 'Note appears after reload'\n};\n\nconsole.log(slice.userGoal);\n"
            },
            ["run", "run checks"],
            "javascript"
          )
        ),
        fullLesson(
          "full-stack-product-engineering",
          "full-stack-product-engineering-m1",
          "state-and-events",
          "State and events in the browser",
          34,
          `# State and events in the browser

Interactive software is a loop:

- State describes what is true now.
- Events describe what just happened.
- Rendering turns state into pixels.
- Effects synchronize with storage, APIs, or runtimes.

Most bugs come from mixing these jobs. A button click should not secretly own all business rules. The click should trigger a named action. The action should update state or call a server boundary.

## Example mental model

\`\`\`ts
const state = { note: '', saved: false };
const event = { type: 'SAVE_NOTE', body: 'Use smaller commits' };
\`\`\`

The event is a fact. The reducer or action decides what that fact means.

## Practice

In the playground, add an event for completing a lesson. Then print the new XP value. Keep the state small and inspectable.`,
          {
            question: "Which statement is the cleanest state/event boundary?",
            options: ["The click handler owns every rule", "An event describes what happened and an action handles the rule", "State should be stored only in CSS"],
            answer: "An event describes what happened and an action handles the rule"
          },
          labStarter(
            "playground",
            "State event reducer",
            "Practice updating a learner state object from explicit events.",
            {
              "main.js":
                "const learner = { xp: 0, completedLessons: [] };\n\nfunction completeLesson(state, lessonId) {\n  return {\n    xp: state.xp + 120,\n    completedLessons: [...state.completedLessons, lessonId]\n  };\n}\n\nconsole.log(completeLesson(learner, 'state-and-events'));\n"
            },
            ["run", "run checks"],
            "javascript"
          )
        ),
        fullLesson(
          "full-stack-product-engineering",
          "full-stack-product-engineering-m1",
          "markdown-driven-learning",
          "Markdown-driven learning content",
          24,
          `# Markdown-driven learning content

CodeForge is designed so most course content is markdown. That is deliberate. Markdown keeps lessons portable, reviewable, searchable, and easy for an owner to update without rebuilding the app.

A strong lesson structure:

1. Concept.
2. Example.
3. Lab instruction.
4. Quiz.
5. Completion note.

Do not write lessons as walls of theory. Every section should move the learner toward a visible action.

## Authoring pattern

\`\`\`md
# Lesson title

Core idea in plain language.

## Example

Small realistic snippet.

## Lab

One concrete task.
\`\`\`

## Practice

Draft a lesson outline in your note box. Keep each heading action-oriented.`,
          {
            question: "Why is markdown a strong default for course content?",
            options: ["It is easy to version, edit, search, and render", "It replaces all labs", "It prevents quizzes"],
            answer: "It is easy to version, edit, search, and render"
          }
        )
      ]
    },
    {
      id: "full-stack-product-engineering-m2",
      courseSlug: "full-stack-product-engineering",
      title: "Data, APIs, and SQL",
      summary: "Design data models, write useful queries, and connect product behavior to database records.",
      lessons: [
        fullLesson(
          "full-stack-product-engineering",
          "full-stack-product-engineering-m2",
          "data-modeling-for-features",
          "Data modeling for features",
          38,
          `# Data modeling for features

Data modeling starts from product behavior. If a learner completes a lesson, the platform needs to know:

- Who completed it.
- Which lesson was completed.
- Whether it counts as complete.
- How much XP was earned.
- When it happened.

That becomes a table like \`user_progress\`.

## Good product data has ownership

Every learner-owned record should include \`user_id\`. Without ownership, progress and notes leak across accounts. Row Level Security depends on this column.

## Practice query

Use the SQL lab to find completed lessons and total XP. Notice that the query is not just technical. It answers a product question: "How far has this learner progressed?"`,
          {
            question: "What column is essential for learner-owned records?",
            options: ["thumbnail", "user_id", "sort_order"],
            answer: "user_id"
          },
          labStarter(
            "sql",
            "Query learner progress",
            "Write SQL that answers product questions about lessons and XP.",
            {
              "query.sql":
                "select lesson_id, xp_earned\nfrom user_progress\nwhere completed = true\norder by completed_at desc;"
            },
            ["run query", "explain", "run checks"],
            "sql"
          )
        ),
        fullLesson(
          "full-stack-product-engineering",
          "full-stack-product-engineering-m2",
          "api-boundaries",
          "API and server action boundaries",
          36,
          `# API and server action boundaries

The browser is not a trusted place for private rules. The browser can request "complete this lesson", but the server action should decide:

- Is the user signed in?
- Does the lesson exist?
- Is the XP amount allowed?
- Should this update replace or create a row?

That is why completion uses a server action. The client can still feel instant with local feedback, but persistent truth belongs behind the server boundary.

## Practical rule

If the operation changes user-owned data, put the final write behind a server action or API route.

## Practice

In your notes, list three operations in this platform that must be server-side writes.`,
          {
            question: "Why should XP writes go through a server action?",
            options: ["Because CSS cannot store XP", "Because the server must validate identity and allowed values", "Because markdown requires it"],
            answer: "Because the server must validate identity and allowed values"
          }
        ),
        fullLesson(
          "full-stack-product-engineering",
          "full-stack-product-engineering-m2",
          "sql-performance-basics",
          "SQL performance basics",
          42,
          `# SQL performance basics

Performance starts with asking the database narrow questions. A dashboard should not fetch every note body just to count completed lessons.

Use these habits:

- Select only columns you need.
- Filter by indexed ownership columns like \`user_id\`.
- Sort by fields that match the view.
- Keep dashboard queries separate from detailed lesson queries.

## Example

\`\`\`sql
select lesson_id, xp_earned, completed_at
from user_progress
where user_id = auth.uid()
  and completed = true;
\`\`\`

This is small, targeted, and directly useful for the dashboard.

## Practice

Open the SQL lab and compare a broad \`select *\` query with a narrow dashboard query.`,
          {
            question: "Which query habit usually improves dashboard performance?",
            options: ["Select every column", "Filter by user and select only needed columns", "Sort randomly"],
            answer: "Filter by user and select only needed columns"
          },
          labStarter(
            "sql",
            "Optimize a dashboard query",
            "Practice writing targeted SQL for dashboard progress.",
            {
              "query.sql":
                "select lesson_id, xp_earned, completed_at\nfrom user_progress\nwhere completed = true\norder by completed_at desc;"
            },
            ["run query", "explain", "run checks"],
            "sql"
          )
        )
      ]
    },
    {
      id: "full-stack-product-engineering-m3",
      courseSlug: "full-stack-product-engineering",
      title: "Testing, containers, and operations",
      summary: "Validate product behavior, package services, and inspect runtime problems with testing, Docker, and Linux labs.",
      lessons: [
        fullLesson(
          "full-stack-product-engineering",
          "full-stack-product-engineering-m3",
          "test-user-outcomes",
          "Test user outcomes",
          40,
          `# Test user outcomes

Good tests describe user outcomes, not implementation trivia.

For a lesson completion feature, useful tests include:

- Completing a lesson records progress.
- Completing it twice does not double count XP.
- A signed-out learner gets a clear message.
- Dashboard totals update after completion.

Each test protects a product promise.

## Testing ladder

Start with the smallest useful test, then climb:

1. Pure function test.
2. Server action validation test.
3. Browser workflow test.
4. Regression test for a fixed bug.

## Practice

Use the testing lab to add one test for duplicate completion behavior.`,
          {
            question: "What should a strong product test protect?",
            options: ["A user-visible promise", "Only file names", "Only CSS class order"],
            answer: "A user-visible promise"
          },
          labStarter(
            "testing",
            "Test lesson completion",
            "Write a Pytest-style check for a lesson completion rule.",
            {
              "test_progress.py":
                "def award_xp(already_completed):\n    return 0 if already_completed else 120\n\n\ndef test_duplicate_completion_awards_no_extra_xp():\n    assert award_xp(True) == 0\n"
            },
            ["pytest", "run checks"],
            "python"
          )
        ),
        fullLesson(
          "full-stack-product-engineering",
          "full-stack-product-engineering-m3",
          "container-runtime-thinking",
          "Container runtime thinking",
          44,
          `# Container runtime thinking

Containers make runtime assumptions explicit. A Dockerfile says:

- What base image runs the app.
- Where files live.
- What dependencies install.
- Which command starts the process.

Even when CodeForge labs run safely in the browser, the mental model is the same as a real production service.

## Common container failure modes

- Missing environment variables.
- Wrong port mapping.
- Dependency installed only in development.
- App binds to localhost instead of all interfaces.

## Practice

Use the Docker lab to build and run the simulated API image. Then run checks and write down what each Docker command proved.`,
          {
            question: "What does a Dockerfile primarily describe?",
            options: ["The runtime environment and startup command", "Only database rows", "Only frontend colors"],
            answer: "The runtime environment and startup command"
          },
          labStarter(
            "docker",
            "Package the product API",
            "Build, run, inspect, and validate a simulated product API container.",
            {
              Dockerfile:
                "FROM node:20-alpine\nWORKDIR /app\nCOPY package.json .\nRUN npm install --omit=dev\nCOPY . .\nCMD [\"npm\", \"start\"]"
            },
            ["docker build -t codeforge-api .", "docker run -p 8080:8080 codeforge-api", "docker ps", "run checks"]
          )
        ),
        fullLesson(
          "full-stack-product-engineering",
          "full-stack-product-engineering-m3",
          "linux-debugging-loop",
          "Linux debugging loop",
          42,
          `# Linux debugging loop

Production debugging is a disciplined loop:

1. Confirm where you are.
2. Inspect files.
3. Read logs.
4. Check process status.
5. Change one thing.
6. Validate the result.

Do not jump straight to edits. First observe.

## Commands worth mastering

- \`pwd\`
- \`ls -la\`
- \`cat\`
- \`grep\`
- \`systemctl status\`
- log inspection commands

## Practice

Use the Linux lab to find the service issue. Save a note that names the exact failing environment variable.`,
          {
            question: "What should you do before changing a production-like system?",
            options: ["Observe and gather evidence", "Edit random files", "Restart everything immediately"],
            answer: "Observe and gather evidence"
          },
          labStarter(
            "linux",
            "Inspect a service failure",
            "Use shell commands to inspect files, logs, and service status.",
            undefined,
            ["pwd", "ls -la", "cat README.md", "cat logs/api.log", "systemctl status api", "run checks"]
          )
        )
      ]
    },
    {
      id: "full-stack-product-engineering-m4",
      courseSlug: "full-stack-product-engineering",
      title: "Networking and final product hardening",
      summary: "Reason about connectivity, dashboards, release readiness, and the final capstone workflow.",
      lessons: [
        fullLesson(
          "full-stack-product-engineering",
          "full-stack-product-engineering-m4",
          "network-debugging",
          "Network debugging for application engineers",
          38,
          `# Network debugging for application engineers

You do not need to be a network engineer to debug basic connectivity. You need a reliable map:

- Client.
- Gateway.
- Service.
- Port.
- Route.
- Firewall or policy.

When a browser cannot reach an app, ask:

1. Is the service running?
2. Is it listening on the expected port?
3. Is the route correct?
4. Is the interface up?

## Practice

Use the Network lab to inspect interfaces and bring a simulated gateway online. Connect the network state to a product symptom: "the app cannot be reached."`,
          {
            question: "Which question belongs early in network debugging?",
            options: ["Is the service listening on the expected port?", "What is the logo size?", "Can we delete the database?"],
            answer: "Is the service listening on the expected port?"
          },
          labStarter(
            "network",
            "Bring the gateway online",
            "Use router-style commands to inspect and configure an interface.",
            undefined,
            ["show ip interface brief", "conf t", "interface g0/1", "ip address 10.0.0.1 255.255.255.0", "run checks"]
          )
        ),
        fullLesson(
          "full-stack-product-engineering",
          "full-stack-product-engineering-m4",
          "release-readiness",
          "Release readiness checklist",
          32,
          `# Release readiness checklist

A feature is not ready because it works once. A feature is ready when the team can explain and operate it.

Before release, verify:

- User flow works.
- Data persists.
- Permissions are correct.
- Empty and error states exist.
- Tests protect the main behavior.
- Logs make failures diagnosable.
- Rollback path is known.

## CodeForge release example

For lesson completion, release readiness means a learner can complete a lesson, XP is saved, dashboard updates, and a non-owner cannot access admin.

## Practice

Write a release checklist for one feature you want next in CodeForge Academy.`,
          {
            question: "What makes a feature release-ready?",
            options: ["It works once locally", "It is validated, observable, permissioned, and recoverable", "It has no documentation"],
            answer: "It is validated, observable, permissioned, and recoverable"
          }
        ),
        fullLesson(
          "full-stack-product-engineering",
          "full-stack-product-engineering-m4",
          "capstone-browser-to-production",
          "Capstone: browser to production",
          58,
          `# Capstone: browser to production

Your capstone is to trace one complete product workflow through the whole stack.

Choose one:

- Save a lesson note.
- Complete a lesson and earn XP.
- Create a course in admin.
- Launch a lab from a lesson.

For your chosen workflow, document:

1. User goal.
2. UI interaction.
3. Data written.
4. Permission rule.
5. Test case.
6. Runtime risk.
7. Debugging command or query.

## Completion standard

This capstone is complete when you can explain the workflow without hiding behind framework names. The stack is just the tool. The product behavior is the point.

## Final practice

Open at least two labs: one for code or SQL, and one for operations. Save notes in both related lessons, then complete the course checkpoint.`,
          {
            question: "What is the best capstone proof?",
            options: ["A memorized framework list", "A traced workflow from user goal to data, permissions, tests, and operations", "A screenshot with no explanation"],
            answer: "A traced workflow from user goal to data, permissions, tests, and operations"
          },
          labStarter(
            "playground",
            "Trace a product workflow",
            "Represent a full product workflow as data and print the release checklist.",
            {
              "main.js":
                "const workflow = {\n  goal: 'Complete lesson and earn XP',\n  ui: 'Complete button',\n  data: 'user_progress row',\n  permission: 'user owns row',\n  test: 'duplicate completion does not double count XP',\n  operation: 'dashboard query stays fast'\n};\n\nconsole.log(workflow);\n"
            },
            ["run", "run checks"],
            "javascript"
          )
        )
      ]
    }
  ]
};

export const courses: Course[] = [
  fullStackCourse,
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
