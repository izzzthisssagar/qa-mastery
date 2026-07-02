-- 0027 — Communities: a LinkedIn-style feed for every role (learner, tester,
-- client). Posts + questions, threaded comments, likes, tags, follows, accepted
-- answers, moderation, and a generic notifications table the bell reads via
-- Supabase Realtime. RLS-first (conventions from talent 0017): insert-own,
-- read-unless-hidden, author-only accepted-answer, admin-only hide. Media:
-- images in the public `community-media` bucket; ≤60s video via Cloudinary
-- (stored as a URL in media jsonb — no bytes touch Supabase). Counters are
-- denormalized and kept honest by triggers.

-- ── admin flag + helper ──────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- security-definer so RLS policies can check admin without recursing into
-- profiles' own RLS. STABLE + search_path pinned (injection-safe).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ── tags ─────────────────────────────────────────────────────────────────────
create table public.community_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug = lower(slug) and char_length(slug) between 2 and 40),
  label text not null check (char_length(label) <= 60),
  created_at timestamptz not null default now()
);

-- ── posts (post | question) ──────────────────────────────────────────────────
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'post' check (kind in ('post', 'question')),
  title text check (char_length(title) <= 200),
  body text not null check (char_length(body) between 1 and 20000),
  -- media = [{type:'image', path:'…'} | {type:'video', url:'…', provider:'cloudinary'}]
  media jsonb not null default '[]',
  accepted_answer_id uuid,          -- FK added after community_comments exists
  like_count integer not null default 0,
  comment_count integer not null default 0,
  hidden_at timestamptz,
  hidden_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- full-text over title + body for websearch_to_tsquery
  fts tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored
);
create index community_posts_created on public.community_posts (created_at desc, id desc);
create index community_posts_author on public.community_posts (author_id);
create index community_posts_fts on public.community_posts using gin (fts);

-- ── comments (threaded one level via parent_id) ──────────────────────────────
create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.community_comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  is_accepted boolean not null default false,
  like_count integer not null default 0,
  hidden_at timestamptz,
  hidden_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index community_comments_post on public.community_comments (post_id, created_at);
create index community_comments_author on public.community_comments (author_id);

-- now that comments exist, wire the accepted-answer FK
alter table public.community_posts
  add constraint community_posts_accepted_answer_fkey
  foreign key (accepted_answer_id) references public.community_comments (id) on delete set null;

-- ── post ↔ tag join ──────────────────────────────────────────────────────────
create table public.community_post_tags (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  tag_id uuid not null references public.community_tags (id) on delete cascade,
  primary key (post_id, tag_id)
);
create index community_post_tags_tag on public.community_post_tags (tag_id);

-- ── likes (one per user per subject) ─────────────────────────────────────────
create table public.community_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_type text not null check (subject_type in ('post', 'comment')),
  subject_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, subject_type, subject_id)
);
create index community_likes_subject on public.community_likes (subject_type, subject_id);

-- ── follows ──────────────────────────────────────────────────────────────────
create table public.community_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index community_follows_following on public.community_follows (following_id);

-- ── reports (moderation queue) ───────────────────────────────────────────────
create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  subject_type text not null check (subject_type in ('post', 'comment')),
  subject_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, subject_type, subject_id)
);

-- ── notifications (generic; Tasks + talent can converge here later) ──────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null,               -- 'comment' | 'like' | 'follow' | 'accepted' | …
  subject_type text,
  subject_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread on public.notifications (user_id, created_at desc);

-- ── counter triggers (keep denormalized counts honest) ───────────────────────
create or replace function public.community_bump_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  delta integer;
begin
  delta := case when tg_op = 'INSERT' then 1 else -1 end;
  if tg_table_name = 'community_likes' then
    if coalesce(new.subject_type, old.subject_type) = 'post' then
      update public.community_posts set like_count = like_count + delta
        where id = coalesce(new.subject_id, old.subject_id);
    else
      update public.community_comments set like_count = like_count + delta
        where id = coalesce(new.subject_id, old.subject_id);
    end if;
  elsif tg_table_name = 'community_comments' then
    update public.community_posts set comment_count = comment_count + delta
      where id = coalesce(new.post_id, old.post_id);
  end if;
  return null;
end;
$$;

create trigger community_likes_count
  after insert or delete on public.community_likes
  for each row execute function public.community_bump_counts();
create trigger community_comments_count
  after insert or delete on public.community_comments
  for each row execute function public.community_bump_counts();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.community_tags       enable row level security;
alter table public.community_posts       enable row level security;
alter table public.community_comments    enable row level security;
alter table public.community_post_tags   enable row level security;
alter table public.community_likes       enable row level security;
alter table public.community_follows     enable row level security;
alter table public.community_reports     enable row level security;
alter table public.notifications         enable row level security;

-- tags: world-readable; only admins curate.
create policy "anyone reads tags" on public.community_tags for select using (true);
create policy "admins write tags" on public.community_tags for all
  using (public.is_admin()) with check (public.is_admin());

-- posts: visible unless hidden (author + admins still see their hidden rows);
-- authors insert their own; authors edit body/accepted-answer; admins hide.
create policy "read visible posts" on public.community_posts for select
  using (hidden_at is null or (select auth.uid()) = author_id or public.is_admin());
create policy "author inserts own post" on public.community_posts for insert
  with check ((select auth.uid()) = author_id);
create policy "author or admin updates post" on public.community_posts for update
  using ((select auth.uid()) = author_id or public.is_admin())
  with check ((select auth.uid()) = author_id or public.is_admin());
create policy "author or admin deletes post" on public.community_posts for delete
  using ((select auth.uid()) = author_id or public.is_admin());

-- comments: same visibility contract as posts.
create policy "read visible comments" on public.community_comments for select
  using (hidden_at is null or (select auth.uid()) = author_id or public.is_admin());
create policy "author inserts own comment" on public.community_comments for insert
  with check ((select auth.uid()) = author_id);
create policy "author or admin updates comment" on public.community_comments for update
  using ((select auth.uid()) = author_id or public.is_admin())
  with check ((select auth.uid()) = author_id or public.is_admin());
create policy "author or admin deletes comment" on public.community_comments for delete
  using ((select auth.uid()) = author_id or public.is_admin());

-- post_tags: readable with the post; only the post author manages them.
create policy "read post tags" on public.community_post_tags for select using (true);
create policy "post author writes tags" on public.community_post_tags for all
  using (exists (select 1 from public.community_posts p
                 where p.id = post_id and p.author_id = (select auth.uid())))
  with check (exists (select 1 from public.community_posts p
                 where p.id = post_id and p.author_id = (select auth.uid())));

-- likes: world-readable counts; a user manages only their own like rows.
create policy "anyone reads likes" on public.community_likes for select using (true);
create policy "user manages own likes" on public.community_likes for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- follows: world-readable; a user manages only their own follow edges.
create policy "anyone reads follows" on public.community_follows for select using (true);
create policy "user manages own follows" on public.community_follows for all
  using ((select auth.uid()) = follower_id) with check ((select auth.uid()) = follower_id);

-- reports: a reporter sees + files their own; admins see all + update status.
create policy "reporter reads own report" on public.community_reports for select
  using ((select auth.uid()) = reporter_id or public.is_admin());
create policy "reporter files own report" on public.community_reports for insert
  with check ((select auth.uid()) = reporter_id);
create policy "admin updates reports" on public.community_reports for update
  using (public.is_admin()) with check (public.is_admin());

-- notifications: recipient reads + marks their own read. Writes are service-role
-- only (server actions), so no insert policy — a learner can't forge a notice.
create policy "recipient reads own notifications" on public.notifications for select
  using ((select auth.uid()) = user_id);
create policy "recipient marks own read" on public.notifications for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Realtime: the header bell subscribes to postgres_changes on notifications,
-- filtered to the recipient. Add it to the supabase_realtime publication.
do $$
begin
  if exists (select from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;

-- ── media bucket (images only; video lives on Cloudinary) ────────────────────
do $$
begin
  if exists (select from pg_tables where schemaname = 'storage' and tablename = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('community-media', 'community-media', true, 5242880,
            ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'])
    on conflict (id) do update set file_size_limit = EXCLUDED.file_size_limit;

    drop policy if exists "Users upload to their own community folder" on storage.objects;
    execute $p$
      create policy "Users upload to their own community folder"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'community-media'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
    $p$;
    drop policy if exists "Public can view community media" on storage.objects;
    execute $p$
      create policy "Public can view community media"
      on storage.objects for select using ( bucket_id = 'community-media' )
    $p$;
  end if;
end
$$;
