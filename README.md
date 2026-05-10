# CodeForge Academy

CodeForge Academy is a production-shaped developer education platform built with Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn-style components, Supabase, Monaco, xterm.js, Pyodide, React Markdown, Framer Motion, TanStack Query, react-hook-form, zod, sonner, and canvas-confetti.

It is designed as a self-contained learning environment: courses, lessons, notes, challenges, terminals, code execution, SQL practice, network simulation, and admin content management all live inside the browser.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ALLOW_DEMO_ADMIN=false
```

4. Run `supabase/migrations/001_codeforge_schema.sql` in the Supabase SQL editor.
5. Run `supabase/seed.sql` to add initial database content.
6. Create at least one authenticated user in Supabase Auth. `/admin` is protected when Supabase is configured and `ALLOW_DEMO_ADMIN=false`.
7. Keep the Admin Panel out of public navigation. It is intentionally not linked in the header; the owner should access it directly at `/admin` after auth is configured.

Without Supabase env vars, the app runs in demo mode using `lib/seed-data.ts`. For a real public deployment, set `ALLOW_DEMO_ADMIN=false` and configure Supabase Auth before sharing the site.

## Content model

The core tables are:

- `courses`: title, slug, metadata, tags, publish state, XP.
- `modules`: ordered sections inside a course.
- `lessons`: markdown content, quiz JSON, optional lab starter JSON.
- `lab_sessions`: saved browser lab state.
- `user_progress`: lesson completion and XP.
- `user_notes`: per-lesson notes.
- `challenges` and `challenge_submissions`: practice runner content and attempts.

## Add new courses

Use `/admin`:

1. Add the course metadata.
2. Add modules and lessons.
3. Paste markdown into the lesson editor.
4. Link a lab when hands-on practice is needed.
5. Publish the course.

Supabase-backed content is fetched dynamically with `noStore()`, so published changes appear live without a rebuild.

## Add new labs

Labs are registered in `lib/labs/registry.ts`.

To add Kubernetes, AWS CLI, Terraform, or a security lab:

1. Add a new `LabKind` in `lib/types.ts`.
2. Add a definition in `labRegistry` with title, starter files, commands, and challenge text.
3. If the lab needs custom UI, extend `components/labs/lab-workspace.tsx` or route by `definition.id`.
4. Add the lab to `labSummaries` in `lib/seed-data.ts`.
5. Link lessons to it through the Admin Panel by storing the lab id in lesson `lab` JSON.

The shared workspace already provides Monaco, xterm.js, dashboards, guided commands, Pyodide Python execution, JavaScript execution, SQL feedback, and session traces.

## Deployment to Vercel

1. Push the project to GitHub.
2. Import it in Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `ALLOW_DEMO_ADMIN=false`.
4. Deploy.

Because all code and lab execution is browser-side simulation or Pyodide runtime execution, no untrusted user code is executed on the server.

## Notes for production hardening

- Replace broad authenticated admin policies with an `admin_profiles` table or Supabase custom claims before opening author access to a team.
- Add an `admin_profiles` table or Supabase custom claim so only your account can manage `/admin`, not every authenticated learner.
- Add storage buckets for uploaded thumbnails and lesson assets.
- Persist local demo notes/progress into Supabase once auth UI is enabled.
- Add automated Playwright smoke tests around lesson completion, challenge execution, and admin publishing.
