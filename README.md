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
5. If you are updating an existing database, also run later migrations in order:
   - `supabase/migrations/002_challenge_xp.sql`
   - `supabase/migrations/003_course_enrollments.sql`
6. Run `supabase/seed.sql` to add initial database content.
7. Create at least one authenticated user in Supabase Auth. `/admin` is protected when Supabase is configured and `ALLOW_DEMO_ADMIN=false`.
8. Keep the Admin Panel out of public navigation. It is intentionally not linked in the header; the owner should access it directly at `/admin` after auth is configured.
9. Add your owner account to `admin_profiles` after signing up:

```sql
insert into public.admin_profiles (user_id, role)
values ('YOUR_AUTH_USER_ID', 'owner');
```

Without Supabase env vars, the app runs in demo mode using `lib/seed-data.ts`. For a real public deployment, set `ALLOW_DEMO_ADMIN=false`, configure Supabase Auth, and add only your account to `admin_profiles`.

## Recommended test accounts

Create these in Supabase Auth for local testing. Do not reuse these passwords in production.

| Role | Email | Password |
| --- | --- | --- |
| Owner/Admin | `admin@codeforge.local` | `ChangeMe!Admin123` |
| Learner | `learner@codeforge.local` | `ChangeMe!Learner123` |

After creating the admin user, copy its Auth user id and insert it into `admin_profiles`:

```sql
insert into public.admin_profiles (user_id, role)
values ('ADMIN_AUTH_USER_ID', 'owner');
```

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

The shared workspace already provides Monaco, xterm.js, dashboards, guided commands, Pyodide Python execution, JavaScript/TypeScript execution, base64 WebAssembly module execution, SQL feedback, autosaved sessions, starter loading, and session traces.

## Browser runtime adapters

The lab registry supports language/version metadata for JavaScript, TypeScript, Python, SQL, WebAssembly, Java, Dart, C++, Rust, Go, Ruby, PHP, Kotlin, Swift, Dockerfile, and YAML.

Current executable browser paths:

- JavaScript and TypeScript-style snippets run in the browser sandbox.
- Python runs through Pyodide.
- SQL runs through the CodeForge in-browser SQL simulator.
- WebAssembly accepts base64-encoded `.wasm` modules, instantiates them in the browser, and calls an exported `run` or `main` function when present.

Adapter-ready paths:

- Java, Dart, C++, Rust, Go, Ruby, PHP, Kotlin, and Swift are modeled in the UI and session layer, but require adding browser runtime assets before real execution.
- Add actual runtime loaders in `lib/labs/runtime-adapters.ts`. The shared contract returns `stdout`, `stderr`, execution logs, variables, and a runtime mode, so the workspace UI does not need to be rewritten.
- Keep all execution browser-only. Do not send learner code to the server.

## Deployment to Vercel

1. Push the project to GitHub.
2. Import it in Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `ALLOW_DEMO_ADMIN=false`.
4. Deploy.

Because all code and lab execution is browser-side simulation, native browser execution, WebAssembly, or Pyodide runtime execution, no untrusted user code is executed on the server.

## Notes for production hardening

- Keep admin access limited through `admin_profiles` or Supabase custom claims before opening author access to a team.
- Add storage buckets for uploaded thumbnails and lesson assets.
- Persist local demo notes/progress into Supabase once auth UI is enabled.
- Add automated Playwright smoke tests around lesson completion, challenge execution, and admin publishing.
