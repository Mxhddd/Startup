-- A parent who logs in but never finishes the name screen (closes the app between the code and the
-- name) used to be stuck: "Add child" failed with "something went wrong", because the family needs a
-- profile row. ensure_family now makes a placeholder profile when there is none, so the apps already
-- installed keep working. The name can still be set later.
create or replace function public.ensure_family() returns uuid
language plpgsql security definer set search_path = '' as $$
declare f uuid;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  insert into public.profiles (id, display_name) values (auth.uid(), 'والدین') on conflict (id) do nothing;
  select family_id into f from public.family_members where user_id = auth.uid() and is_owner limit 1;
  if f is null then
    insert into public.families (created_by) values (auth.uid()) returning id into f;
    insert into public.family_members (family_id, user_id, is_owner) values (f, auth.uid(), true);
  end if;
  return f;
end $$;
