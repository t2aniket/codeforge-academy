insert into public.courses (title, slug, description, category, difficulty, duration_minutes, thumbnail, tags, published, xp)
values
('Docker for Real Development Teams', 'docker-real-teams', 'Build, run, inspect, and debug containers in a browser-native lab.', 'DevOps', 'Beginner', 345, '/course-art/docker-real-teams.jpg', array['Docker','Containers'], true, 1260),
('Linux Terminal Mastery', 'linux-terminal-mastery', 'Practice files, permissions, process inspection, services, and logs.', 'Linux', 'Beginner', 380, '/course-art/linux-terminal-mastery.jpg', array['Shell','Linux'], true, 1380),
('SQL Databases from Query to Schema', 'sql-query-schema', 'Learn SQL through realistic query and schema practice.', 'Databases', 'Beginner', 415, '/course-art/sql-query-schema.jpg', array['SQL','Postgres'], true, 1500),
('Automation Testing with Playwright and Pytest', 'automation-testing-playwright-pytest', 'Write practical automated tests with feedback-driven labs.', 'Testing', 'Intermediate', 450, '/course-art/automation-testing-playwright-pytest.jpg', array['Playwright','Pytest'], true, 1620)
on conflict (slug) do nothing;

insert into public.modules (course_id, title, slug, summary, sort_order)
select id, 'Core foundations', 'core-foundations', 'Build the mental model and practice in the attached lab.', 1
from public.courses
on conflict (course_id, slug) do nothing;

insert into public.lessons (module_id, title, slug, markdown, estimated_minutes, lab, sort_order)
select
  m.id,
  'Mental model and workflow',
  'mental-model',
  '# Mental model and workflow

Learn the concept, inspect a real example, practice in the lab, and save a note about what changed.

## Practice loop

- Read the scenario.
- Run a small experiment.
- Validate the result with checks.
- Explain the outcome in your own words.',
  18,
  jsonb_build_object('lab', case
    when c.slug = 'docker-real-teams' then 'docker'
    when c.slug = 'linux-terminal-mastery' then 'linux'
    when c.slug = 'sql-query-schema' then 'sql'
    else 'testing'
  end, 'title', c.title || ' lab', 'description', 'Launch a pre-filled CodeForge lab for this lesson.'),
  1
from public.modules m
join public.courses c on c.id = m.course_id
on conflict (module_id, slug) do nothing;

insert into public.challenges (title, slug, difficulty, category, prompt, starter_code, tests)
values
('Normalize Usernames', 'normalize-usernames', 'Beginner', 'Strings', 'Return a lowercase username with spaces replaced by hyphens.', 'function normalizeUsername(value) {\n  // write your solution\n}\n\nmodule.exports = normalizeUsername;', 'expect(fn(''Ada Lovelace'')).toBe(''ada-lovelace'');'),
('Retry Budget', 'retry-budget', 'Intermediate', 'Reliability', 'Return whether another retry is allowed.', 'function canRetry(attempts, maxRetries) {\n  return false;\n}\n\nmodule.exports = canRetry;', 'expect(fn(0, 3)).toBe(true);')
on conflict (slug) do nothing;
