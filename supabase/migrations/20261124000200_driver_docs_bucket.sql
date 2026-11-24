-- The private bucket for drivers' papers (CNIC, licence, van registration). A driver uploads into their
-- own folder (<their id>/...) and reads only that; nobody else reads it from the apps. The team sees the
-- files through short-lived signed links made by the server (admin.docUrl), and the server deletes them
-- once the van is verified. Skipped where Supabase Storage isn't installed (the local test database).
do $outer$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'storage') then return; end if;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('driver-docs', 'driver-docs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
  on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
  execute $p$drop policy if exists driver_docs_insert on storage.objects$p$;
  execute $p$drop policy if exists driver_docs_update on storage.objects$p$;
  execute $p$drop policy if exists driver_docs_read on storage.objects$p$;
  execute $p$create policy driver_docs_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'driver-docs' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  execute $p$create policy driver_docs_update on storage.objects for update to authenticated
    using (bucket_id = 'driver-docs' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  execute $p$create policy driver_docs_read on storage.objects for select to authenticated
    using (bucket_id = 'driver-docs' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
end $outer$;
