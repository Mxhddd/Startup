-- v8 phase E: the extras the user chose (3 November 2026).
-- 1. Planned chutti and van days off: at most 60 days ahead.
-- 2. The school pin: the driver places the school; families see "school in 24 min" after pick-up.
-- 3. "We're ready": a parent tells the driver the child is at the door; the driver sees a green dot.

-- ---------------------------------------------------------------- 1. a 60-day limit on planning
create or replace function public.set_absence(p_actor uuid, p_child uuid, p_date date) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_family(p_actor, p_child);
  if p_date < private.karachi_today() then raise exception 'date_in_past'; end if;
  if p_date > private.karachi_today() + 60 then raise exception 'date_too_far'; end if;
  insert into public.absences (child_id, service_date, created_by) values (p_child, p_date, p_actor) on conflict do nothing;
end $$;

create or replace function public.set_van_day_off(p_actor uuid, p_van uuid, p_date date, p_off boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_driver(p_actor, p_van);
  if p_date < private.karachi_today() then raise exception 'date_in_past'; end if;
  if p_date > private.karachi_today() + 60 then raise exception 'date_too_far'; end if;
  if p_off then
    insert into public.van_days_off (van_id, service_date) values (p_van, p_date) on conflict do nothing;
  else
    delete from public.van_days_off where van_id = p_van and service_date = p_date;
  end if;
end $$;

-- ---------------------------------------------------------------- 2. the school pin
alter table public.vans add column if not exists school_location extensions.geography(point, 4326);

-- The van's driver places (or moves) the school. Coordinates must be in Pakistan's rough box.
create or replace function public.set_school_pin(p_van uuid, p_lat double precision, p_lng double precision) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.vans where id = p_van and driver_id = auth.uid()) then raise exception 'not_your_van'; end if;
  if p_lat not between 23 and 37.5 or p_lng not between 60 and 78 then raise exception 'position_out_of_range'; end if;
  update public.vans set school_location = extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography where id = p_van;
end $$;
revoke all on function public.set_school_pin(uuid, double precision, double precision) from public, anon;
grant execute on function public.set_school_pin(uuid, double precision, double precision) to authenticated;

-- Where the school is, for the van's driver, its families and the Pohnch team (else nothing).
create or replace function public.school_point(p_van uuid) returns table (lat double precision, lng double precision)
language sql stable security definer set search_path = '' as $$
  select extensions.st_y(v.school_location::extensions.geometry), extensions.st_x(v.school_location::extensions.geometry)
  from public.vans v
  where v.id = p_van and v.school_location is not null
    and (private.drives(v.id) or private.follows(v.id) or private.is_admin())
$$;
revoke all on function public.school_point(uuid) from public, anon;
grant execute on function public.school_point(uuid) to authenticated;

-- ---------------------------------------------------------------- 3. "we're ready"
create table if not exists public.ready_signals (
  trip_id uuid not null references public.trips (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (trip_id, child_id)
);
alter table public.ready_signals enable row level security;

-- The family says it, only for a running, real trip of their child's van; the driver and the family read it.
create policy ready_signals_insert on public.ready_signals for insert to authenticated
  with check (
    private.my_child(child_id)
    and created_by = auth.uid()
    and exists (
      select 1 from public.trips t
      join public.memberships m on m.van_id = t.van_id and m.child_id = ready_signals.child_id and m.status = 'approved'
      where t.id = ready_signals.trip_id and t.status = 'running' and not t.is_practice
    )
  );
create policy ready_signals_read on public.ready_signals for select to authenticated
  using (private.my_child(child_id) or private.drives_child(child_id) or private.is_admin());
grant select on public.ready_signals to authenticated;
grant insert (trip_id, child_id, created_by) on public.ready_signals to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.ready_signals;
  end if;
end $$;
