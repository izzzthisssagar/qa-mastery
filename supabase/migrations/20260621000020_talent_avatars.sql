-- 0020 — talent avatars. Profile photos in a public Storage bucket (they're
-- meant to be seen on public profiles), scoped so a tester can only write into
-- their own folder. Follows the evidence-bucket pattern (0009/0014): guarded so
-- it runs on Supabase cloud and skips cleanly where the storage schema is
-- absent. Portfolio *file* attachments (private bucket + signed URLs) are a
-- separate, later increment.

alter table public.talent_profiles add column if not exists avatar_path text;

do $$
begin
  if exists (select from pg_tables where schemaname = 'storage' and tablename = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('talent-avatars', 'talent-avatars', true, 5242880,
            ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
    on conflict (id) do update set file_size_limit = EXCLUDED.file_size_limit;

    -- Upload + overwrite only within your own folder (talent-avatars/<uid>/...).
    drop policy if exists "Testers upload to their own avatar folder" on storage.objects;
    execute $p$
      create policy "Testers upload to their own avatar folder"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'talent-avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
    $p$;
    drop policy if exists "Testers update their own avatar" on storage.objects;
    execute $p$
      create policy "Testers update their own avatar"
      on storage.objects for update to authenticated
      using (
        bucket_id = 'talent-avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
    $p$;

    -- Public read so profiles/cards can display the image.
    drop policy if exists "Public can view talent avatars" on storage.objects;
    execute $p$
      create policy "Public can view talent avatars"
      on storage.objects for select using ( bucket_id = 'talent-avatars' )
    $p$;
  end if;
end
$$;

-- Surface avatar_path on the PII-safe public view. `create or replace view`
-- can only APPEND columns (reordering an existing one errors 42P16), so
-- avatar_path goes at the END, after updated_at. The app selects by name, so
-- column order is irrelevant to it.
create or replace view public.talent_public_profile
with (security_invoker = true) as
select p.id, p.handle, p.headline, p.bio, p.location, p.timezone, p.langs,
       p.availability, p.rate_cents, p.discipline, p.specialties, p.stack,
       p.verification_status, p.updated_at, p.avatar_path
from public.talent_profiles p
where p.is_public;
