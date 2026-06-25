-- 0023 — widen portfolio/CV uploads to common work formats. QA bug-report
-- sheets and test plans are usually Excel (.xlsx) or Word (.docx), which the
-- talent-portfolio bucket rejected (it only allowed pdf/csv/images). Add Excel
-- and Word. Guarded like the other storage migrations.
do $$
begin
  if exists (select from pg_tables where schemaname = 'storage' and tablename = 'buckets') then
    update storage.buckets
      set allowed_mime_types = ARRAY[
        'image/png', 'image/jpeg', 'image/webp',
        'application/pdf', 'text/csv', 'text/plain',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',     -- .xlsx
        'application/vnd.ms-excel',                                              -- .xls
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
        'application/msword'                                                     -- .doc
      ]
      where id = 'talent-portfolio';
  end if;
end $$;
