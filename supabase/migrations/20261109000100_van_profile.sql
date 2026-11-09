-- Same gap as the parent side: a driver who logs in but never finishes the name screen could not add
-- their van ("something went wrong"), because vans.driver_id needs a profile row. A BEFORE INSERT
-- trigger makes a placeholder profile (the name can be set later), so installed apps work unchanged.
create or replace function private.ensure_driver_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name) values (new.driver_id, 'ڈرائیور') on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists vans_ensure_profile on public.vans;
create trigger vans_ensure_profile before insert on public.vans
  for each row when (new.driver_id = auth.uid()) execute function private.ensure_driver_profile();
