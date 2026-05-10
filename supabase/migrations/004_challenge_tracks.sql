alter table public.challenges
  add column if not exists language text not null default 'javascript',
  add column if not exists track text not null default 'JavaScript',
  add column if not exists kind text not null default 'practice' check (kind in ('practice', 'interview')),
  add column if not exists function_name text,
  add column if not exists test_cases jsonb;

create index if not exists challenges_track_idx on public.challenges(track);
create index if not exists challenges_language_idx on public.challenges(language);
