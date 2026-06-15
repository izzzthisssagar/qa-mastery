-- 0009 — evidence_uploads: Allow learners to upload screenshots for their bug reports.

alter table public.bug_reports add column evidence_url text;

-- Create the "evidence" bucket (5MB limit, images only) IF storage exists
do $$
begin
  if exists (select from pg_tables where schemaname = 'storage' and tablename = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('evidence', 'evidence', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg'])
    on conflict (id) do update set file_size_limit = EXCLUDED.file_size_limit;

    -- Allow authenticated users to upload to the bucket
    execute 'create policy "Authenticated users can upload evidence" on storage.objects for insert to authenticated with check ( bucket_id = ''evidence'' )';

    -- Allow public read access (so the platform can display the images)
    execute 'create policy "Public can view evidence" on storage.objects for select using ( bucket_id = ''evidence'' )';
  end if;
end
$$;
