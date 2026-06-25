-- 0022 — talent: work experience, CV & social links. The experienced-pro path:
-- a QA analyst who never used the learning side proves themselves the normal way
-- — work history, a LinkedIn/GitHub link, years of experience, and a CV — instead
-- of (or alongside) lab-verified badges. This is what makes the marketplace open
-- to anyone with real experience, not just graduates.

alter table public.talent_profiles
  add column if not exists linkedin_url text,
  add column if not exists github_url text,
  add column if not exists cv_path text,
  add column if not exists years_experience smallint
    check (years_experience is null or years_experience between 0 and 60);

-- structured work history (one row per role)
create table public.talent_experience (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.talent_profiles (id) on delete cascade,
  company text not null check (char_length(company) between 1 and 120),
  role text not null check (char_length(role) between 1 and 120),
  start_year smallint not null check (start_year between 1980 and 2100),
  end_year smallint check (end_year is null or end_year between 1980 and 2100),
  summary text check (char_length(summary) <= 2000),
  created_at timestamptz not null default now()
);

create index talent_experience_tester on public.talent_experience (tester_id, start_year desc);

alter table public.talent_experience enable row level security;

-- visible if the parent profile is visible to the caller; owner writes own
create policy "read experience via visible parent" on public.talent_experience for select
  using (exists (select 1 from public.talent_profiles p
                 where p.id = tester_id and (p.is_public or (select auth.uid()) = p.id)));
create policy "owner writes own experience" on public.talent_experience for all
  using ((select auth.uid()) = tester_id) with check ((select auth.uid()) = tester_id);

-- Recreate the public view APPENDING the new columns at the end. create-or-
-- replace only allows appends (a mid-list insert errors 42P16 — see 0020), so
-- the existing column order is preserved and the new ones go last.
create or replace view public.talent_public_profile
with (security_invoker = true) as
select p.id, p.handle, p.headline, p.bio, p.location, p.timezone, p.langs,
       p.availability, p.rate_cents, p.discipline, p.specialties, p.stack,
       p.verification_status, p.updated_at, p.avatar_path,
       p.linkedin_url, p.github_url, p.cv_path, p.years_experience
from public.talent_profiles p
where p.is_public;
