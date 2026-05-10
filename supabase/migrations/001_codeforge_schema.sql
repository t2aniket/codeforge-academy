create extension if not exists "uuid-ossp";

create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  description text not null,
  category text not null,
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  duration_minutes integer not null default 120,
  thumbnail text,
  tags text[] not null default '{}',
  published boolean not null default false,
  xp integer not null default 500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  slug text not null,
  summary text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(course_id, slug)
);

create table if not exists public.lessons (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  slug text not null,
  markdown text not null,
  estimated_minutes integer not null default 15,
  quiz jsonb,
  lab jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_id, slug)
);

create table if not exists public.lab_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  lab text not null,
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  files jsonb not null default '{}',
  terminal_history text[] not null default '{}',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  xp_earned integer not null default 0,
  completed_at timestamptz,
  unique(user_id, lesson_id)
);

create table if not exists public.user_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create table if not exists public.challenges (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  category text not null,
  prompt text not null,
  starter_code text not null,
  tests text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  code text not null,
  passed boolean not null default false,
  output text,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lab_sessions enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_notes enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_submissions enable row level security;

create policy "Published courses are readable" on public.courses for select using (published = true or auth.role() = 'authenticated');
create policy "Admins can read their admin profile" on public.admin_profiles for select using (auth.uid() = user_id);
create policy "Modules are readable" on public.modules for select using (true);
create policy "Lessons are readable" on public.lessons for select using (true);
create policy "Challenges are readable" on public.challenges for select using (published = true);

create policy "Users manage their lab sessions" on public.lab_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their progress" on public.user_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their notes" on public.user_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage challenge submissions" on public.challenge_submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Admins manage courses" on public.courses for all
using (exists (select 1 from public.admin_profiles ap where ap.user_id = auth.uid()))
with check (exists (select 1 from public.admin_profiles ap where ap.user_id = auth.uid()));
create policy "Admins manage modules" on public.modules for all
using (exists (select 1 from public.admin_profiles ap where ap.user_id = auth.uid()))
with check (exists (select 1 from public.admin_profiles ap where ap.user_id = auth.uid()));
create policy "Admins manage lessons" on public.lessons for all
using (exists (select 1 from public.admin_profiles ap where ap.user_id = auth.uid()))
with check (exists (select 1 from public.admin_profiles ap where ap.user_id = auth.uid()));
create policy "Admins manage challenges" on public.challenges for all
using (exists (select 1 from public.admin_profiles ap where ap.user_id = auth.uid()))
with check (exists (select 1 from public.admin_profiles ap where ap.user_id = auth.uid()));

create index if not exists courses_slug_idx on public.courses(slug);
create index if not exists admin_profiles_role_idx on public.admin_profiles(role);
create index if not exists modules_course_idx on public.modules(course_id, sort_order);
create index if not exists lessons_module_idx on public.lessons(module_id, sort_order);
create index if not exists progress_user_idx on public.user_progress(user_id);
