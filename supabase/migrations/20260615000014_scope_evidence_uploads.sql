-- 0014 — scope evidence uploads to the uploader's own folder.
--
-- 0009's upload policy allowed any authenticated user to write anywhere in the
-- `evidence` bucket. Tighten it: a learner may only write into a folder named
-- for their own user id (evidence/<uid>/<file>) — prevents cross-user writes and
-- gives every upload an owner. Guarded like 0009: only runs where the storage
-- schema exists (Supabase cloud; local skips cleanly).
do $$
begin
  if exists (select from pg_tables where schemaname = 'storage' and tablename = 'objects') then
    drop policy if exists "Authenticated users can upload evidence" on storage.objects;
    execute $p$
      create policy "Learners upload to their own evidence folder"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'evidence'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
    $p$;
  end if;
end
$$;
