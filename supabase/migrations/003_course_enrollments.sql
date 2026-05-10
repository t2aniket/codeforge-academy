create table if not exists public.course_enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  last_lesson_id uuid references public.lessons(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, course_id)
);

alter table public.course_enrollments enable row level security;

create policy "Users manage their enrollments" on public.course_enrollments
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists enrollments_user_idx on public.course_enrollments(user_id);
