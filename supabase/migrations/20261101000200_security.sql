-- Pohnch stage 1: who can see what. Row-level security on every table.
-- Nobody logged out sees anything. A parent sees their own children, their van, its trips and positions,
-- and only their own stop. A driver sees their van, its stops, and the first names of children riding it.
-- Writes that matter (taps, trips, positions, approvals, invites, chutti) have no write policy at all:
-- they go through the functions in the next migration, called only by Edge Functions.

-- ---------------------------------------------------------------------------
-- Logged-out users: no access to anything.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from anon;

-- ---------------------------------------------------------------------------
-- Helper checks. They live in a private schema (not reachable from the apps' API) and run with the
-- owner's rights so the policies below don't loop through each other.
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

create or replace function private.karachi_today() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'Asia/Karachi')::date
$$;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

create or replace function private.in_family(p_family uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.family_members where family_id = p_family and user_id = auth.uid())
$$;

create or replace function private.my_child(p_child uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.children c
    join public.family_members fm on fm.family_id = c.family_id
    where c.id = p_child and fm.user_id = auth.uid()
  )
$$;

create or replace function private.drives(p_van uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vans where id = p_van and driver_id = auth.uid())
$$;

-- A parent follows a van when one of their children is approved on it, the Pohnch team has verified
-- the van, and it isn't switched off.
create or replace function private.follows(p_van uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    join public.vans v on v.id = m.van_id
    join public.children c on c.id = m.child_id
    join public.family_members fm on fm.family_id = c.family_id
    where m.van_id = p_van and m.status = 'approved' and fm.user_id = auth.uid()
      and v.verified_at is not null and v.switched_off_at is null
  )
$$;

-- A parent waiting for approval may see the van's name, nothing more of it.
create or replace function private.requested(p_van uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    join public.children c on c.id = m.child_id
    join public.family_members fm on fm.family_id = c.family_id
    where m.van_id = p_van and m.status in ('pending', 'approved') and fm.user_id = auth.uid()
  )
$$;

-- The driver of a van this child rides or has asked to ride.
create or replace function private.drives_child(p_child uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    join public.vans v on v.id = m.van_id
    where m.child_id = p_child and m.status in ('pending', 'approved') and v.driver_id = auth.uid()
  )
$$;

-- The stops a parent may see: only the ones their own children are assigned to.
create or replace function private.my_stop(p_stop uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    join public.children c on c.id = m.child_id
    join public.family_members fm on fm.family_id = c.family_id
    where m.stop_id = p_stop and m.status = 'approved' and fm.user_id = auth.uid()
  )
$$;

-- The driver whose van a parent follows (so "Rafiq bhai marked" can show the driver's name).
create or replace function private.my_driver(p_profile uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vans v where v.driver_id = p_profile and private.follows(v.id))
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Switch on row-level security everywhere.
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.vans enable row level security;
alter table public.stops enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.children enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;
alter table public.trips enable row level security;
alter table public.trip_events enable row level security;
alter table public.positions enable row level security;
alter table public.absences enable row level security;
alter table public.van_days_off enable row level security;
alter table public.push_tokens enable row level security;

-- Apps may only read, except the few setup tables below that they edit directly.
revoke insert, update, delete, truncate on all tables in schema public from authenticated;

-- profiles: yourself; the driver of the van you follow; the team.
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or private.my_driver(id) or private.is_admin());
create policy profiles_insert_self on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
grant insert (id, display_name, lang) on public.profiles to authenticated;
grant update (display_name, lang) on public.profiles to authenticated;

-- admins: you can see whether you are one.
create policy admins_read_self on public.admins for select to authenticated using (user_id = auth.uid());

-- vans: the driver; a parent waiting or approved (name only matters while waiting); the team.
create policy vans_read on public.vans for select to authenticated
  using (driver_id = auth.uid() or private.requested(id) or private.is_admin());
-- A driver creates their own van, unverified and switched on.
create policy vans_insert_own on public.vans for insert to authenticated
  with check (driver_id = auth.uid() and verified_at is null and switched_off_at is null);
create policy vans_update_own on public.vans for update to authenticated
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());
grant insert (driver_id, name, school_name, plate) on public.vans to authenticated;
grant update (name, school_name, plate) on public.vans to authenticated; -- never verified_at or switched_off_at

-- stops: the driver edits them; a parent sees only their own stop; the team sees all.
create policy stops_read on public.stops for select to authenticated
  using (private.drives(van_id) or private.my_stop(id) or private.is_admin());
create policy stops_write on public.stops for all to authenticated
  using (private.drives(van_id)) with check (private.drives(van_id));
grant insert, update, delete on public.stops to authenticated;

-- families and family members: members see their family. Created through functions.
create policy families_read on public.families for select to authenticated
  using (private.in_family(id) or private.is_admin());
create policy family_members_read on public.family_members for select to authenticated
  using (private.in_family(family_id) or private.is_admin());

-- children: the family edits them; the driver of their van (or the van they asked for) sees them.
create policy children_read on public.children for select to authenticated
  using (private.in_family(family_id) or private.drives_child(id) or private.is_admin());
create policy children_insert on public.children for insert to authenticated
  with check (private.in_family(family_id));
create policy children_update on public.children for update to authenticated
  using (private.in_family(family_id)) with check (private.in_family(family_id));
create policy children_delete on public.children for delete to authenticated
  using (private.in_family(family_id));
grant insert (family_id, first_name, school_name, home_location) on public.children to authenticated;
grant update (first_name, school_name, home_location) on public.children to authenticated;
grant delete on public.children to authenticated;

-- memberships: the child's family and the van's driver. Changed only through functions.
create policy memberships_read on public.memberships for select to authenticated
  using (private.my_child(child_id) or private.drives(van_id) or private.is_admin());

-- invites: never readable from the apps. (No policy = no rows.)

-- trips: the driver, following parents, the team.
create policy trips_read on public.trips for select to authenticated
  using (private.drives(van_id) or private.follows(van_id) or private.is_admin());

-- trip events: the driver; following parents see van-wide steps and their own children's steps.
create policy trip_events_read on public.trip_events for select to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (
          private.drives(t.van_id)
          or (private.follows(t.van_id) and (trip_events.child_id is null or private.my_child(trip_events.child_id)))
          or private.is_admin()
        )
    )
  );

-- positions: the driver, following parents, the team.
create policy positions_read on public.positions for select to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and (private.drives(t.van_id) or private.follows(t.van_id) or private.is_admin())
    )
  );

-- absences: the family, and the driver of the child's van.
create policy absences_read on public.absences for select to authenticated
  using (private.my_child(child_id) or private.drives_child(child_id) or private.is_admin());

-- whole-van days off: the driver and following parents.
create policy van_days_off_read on public.van_days_off for select to authenticated
  using (private.drives(van_id) or private.follows(van_id) or private.is_admin());

-- push tokens: no policy. Written by a function, read only by the server.
