-- 0021 — talent portfolio file attachments. PRIVATE bucket: a tester uploads
-- proof files (bug-report sheets, coverage PDFs, screenshots) into their own
-- folder. Unlike avatars, these are NOT publicly readable — reads happen only
-- via short-lived signed URLs minted server-side after a visibility check
-- (NDA items never get a URL for a non-owner). Follows 0009/0014/0020.

do $$
begin
  if exists (select from pg_tables where schemaname = 'storage' and tablename = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('talent-portfolio', 'talent-portfolio', false, 10485760,
            ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/csv', 'text/plain'])
    on conflict (id) do update set file_size_limit = EXCLUDED.file_size_limit;

    -- Upload only into your own folder (talent-portfolio/<uid>/...).
    drop policy if exists "Testers upload to their own portfolio folder" on storage.objects;
    execute $p$
      create policy "Testers upload to their own portfolio folder"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'talent-portfolio'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
    $p$;

    -- Owners may read/list their own files (for their own editor preview).
    -- Public reads go through service-role signed URLs, never a public policy.
    drop policy if exists "Testers read their own portfolio files" on storage.objects;
    execute $p$
      create policy "Testers read their own portfolio files"
      on storage.objects for select to authenticated
      using (
        bucket_id = 'talent-portfolio'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
    $p$;
  end if;
end
$$;
