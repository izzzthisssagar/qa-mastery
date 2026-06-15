-- 0008 — one capstone submission per learner per lesson.
--
-- The grading action now upserts: a resubmission overwrites the learner's prior
-- plan instead of stacking duplicate rows. Enforce that at the database so the
-- invariant holds even if a future caller forgets to upsert.

-- Collapse any pre-existing duplicates, keeping the most recent submission.
delete from public.capstone_submissions a
using public.capstone_submissions b
where a.user_id = b.user_id
  and a.lesson_id = b.lesson_id
  and a.created_at < b.created_at;

-- The unique constraint's index also serves the read-own lookups, so the
-- earlier non-unique index is now redundant.
drop index if exists public.capstone_submissions_user_lesson;

alter table public.capstone_submissions
  add constraint capstone_submissions_user_lesson_key unique (user_id, lesson_id);

-- created_at stays the first-submitted time; track resubmissions separately.
alter table public.capstone_submissions
  add column updated_at timestamptz not null default now();

create trigger capstone_submissions_updated_at
  before update on public.capstone_submissions
  for each row execute function public.set_updated_at();
