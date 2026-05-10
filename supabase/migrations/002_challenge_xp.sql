alter table public.challenge_submissions
add column if not exists xp_earned integer not null default 0;
