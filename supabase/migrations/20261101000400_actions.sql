-- Pohnch stage 1: the writes that matter. Each function checks the person's role itself.
-- They take p_actor (the logged-in user, checked by the Edge Function from their token) and can only be
-- run by the server (service_role); the apps cannot call them directly.
-- Errors are short codes ('not_your_van', 'trip_not_running' ...) that the Edge Function turns into replies.

-- ---------------------------------------------------------------- shared checks
create or replace function private.require_driver(p_actor uuid, p_van uuid) returns public.vans
language plpgsql stable security definer set search_path = '' as $$
declare v public.vans;
begin
  select * into v from public.vans where id = p_van;
  if v.id is null or v.driver_id <> p_actor then raise exception 'not_your_van'; end if;
  if v.switched_off_at is not null then raise exception 'van_switched_off'; end if;
  return v;
end $$;

create or replace function private.require_family(p_actor uuid, p_child uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.children c join public.family_members fm on fm.family_id = c.family_id
    where c.id = p_child and fm.user_id = p_actor
  ) then raise exception 'not_your_child'; end if;
end $$;

create or replace function private.require_admin(p_actor uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.admins where user_id = p_actor) then raise exception 'not_admin'; end if;
end $$;

-- A running trip on a van this actor drives.
create or replace function private.require_running_trip(p_actor uuid, p_trip uuid) returns public.trips
language plpgsql stable security definer set search_path = '' as $$
declare t public.trips;
begin
  select * into t from public.trips where id = p_trip;
  if t.id is null then raise exception 'trip_not_found'; end if;
  perform private.require_driver(p_actor, t.van_id);
  if t.status <> 'running' then raise exception 'trip_not_running'; end if;
  return t;
end $$;

-- Sibling taps share one client_id from the phone; each child's row gets its own id derived from it.
create or replace function private.child_client_id(p_client uuid, p_child uuid) returns uuid
language sql immutable set search_path = '' as $$
  select extensions.uuid_generate_v5(p_client, p_child::text)
$$;

-- ---------------------------------------------------------------- trips
-- Start the morning or afternoon run. The first step goes in with it: morning "left", afternoon "left school".
create or replace function public.start_trip(p_actor uuid, p_van uuid, p_kind public.trip_kind, p_client_id uuid, p_practice boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v public.vans;
  t_id uuid;
  today date := private.karachi_today();
begin
  -- The same start sent twice (offline queue) returns the same trip.
  select e.trip_id into t_id from public.trip_events e where e.client_id = p_client_id;
  if t_id is not null then return t_id; end if;

  v := private.require_driver(p_actor, p_van);
  if not p_practice and v.verified_at is null then raise exception 'van_not_verified'; end if;
  if exists (select 1 from public.trips where van_id = p_van and status = 'running') then raise exception 'trip_already_running'; end if;
  if not p_practice and exists (select 1 from public.van_days_off where van_id = p_van and service_date = today) then raise exception 'van_day_off'; end if;
  if not p_practice and exists (select 1 from public.trips where van_id = p_van and service_date = today and kind = p_kind and not is_practice and status <> 'cancelled') then
    raise exception 'trip_already_done';
  end if;

  insert into public.trips (van_id, service_date, kind, is_practice) values (p_van, today, p_kind, p_practice) returning id into t_id;
  insert into public.trip_events (trip_id, step, client_id, tap_id, created_by, happened_at)
    values (t_id, case when p_kind = 'morning' then 'left'::public.trip_step else 'left_school'::public.trip_step end, p_client_id, p_client_id, p_actor, now());
  return t_id;
end $$;

create or replace function public.end_trip(p_actor uuid, p_trip uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare t public.trips;
begin
  select * into t from public.trips where id = p_trip;
  if t.id is null then raise exception 'trip_not_found'; end if;
  perform private.require_driver(p_actor, t.van_id);
  -- Ending twice is fine (offline queue).
  update public.trips set status = 'ended', ended_at = coalesce(ended_at, now()) where id = p_trip and status = 'running';
end $$;

-- ---------------------------------------------------------------- taps
-- One tap: a van-wide step (reached school) or a step for the children at one stop (siblings together).
-- Returns how many new rows were stored (0 when this tap had already arrived).
create or replace function public.record_tap(p_actor uuid, p_trip uuid, p_step public.trip_step, p_children uuid[], p_client_id uuid, p_happened_at timestamptz)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  t public.trips;
  kid uuid;
  n integer := 0;
  added integer;
  at timestamptz;
begin
  select * into t from public.trips where id = p_trip;
  if t.id is null then raise exception 'trip_not_found'; end if;
  perform private.require_driver(p_actor, t.van_id);
  -- Taps made offline may arrive after the trip ended; accept them if they happened during it.
  if t.status = 'cancelled' or (t.status = 'ended' and p_happened_at > t.ended_at) then raise exception 'trip_not_running'; end if;
  if p_step in ('arriving', 'late') then raise exception 'step_not_tappable'; end if;
  -- The phone's clock decides the order, but never a time in the future or before the trip.
  at := least(greatest(p_happened_at, t.started_at), now());

  if p_step in ('picked', 'dropped') then
    if coalesce(cardinality(p_children), 0) = 0 then raise exception 'children_required'; end if;
    foreach kid in array p_children loop
      if not exists (select 1 from public.memberships where child_id = kid and van_id = t.van_id and status = 'approved') then
        raise exception 'child_not_on_van';
      end if;
      -- A double tap (a new tap id for a step this child already has on this trip) is ignored too,
      -- so a family never gets the same push twice.
      if exists (select 1 from public.trip_events e where e.trip_id = p_trip and e.child_id = kid and e.step = p_step and e.undone_at is null) then
        continue;
      end if;
      insert into public.trip_events (trip_id, child_id, step, client_id, tap_id, created_by, happened_at)
        values (p_trip, kid, p_step, private.child_client_id(p_client_id, kid), p_client_id, p_actor, at)
        on conflict (client_id) do nothing;
      get diagnostics added = row_count;
      n := n + added;
    end loop;
  else
    if coalesce(cardinality(p_children), 0) > 0 then raise exception 'van_step_has_no_children'; end if;
    insert into public.trip_events (trip_id, step, client_id, tap_id, created_by, happened_at)
      values (p_trip, p_step, p_client_id, p_client_id, p_actor, at)
      on conflict (client_id) do nothing;
    get diagnostics n = row_count;
  end if;
  return n;
end $$;

-- Undo within the window (5 s on the phone; the server allows 60 s for a slow network).
create or replace function public.undo_tap(p_actor uuid, p_client_id uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  update public.trip_events e set undone_at = now()
  where e.tap_id = p_client_id
    and e.created_by = p_actor and e.undone_at is null and e.created_at > now() - interval '60 seconds';
  get diagnostics n = row_count;
  return n;
end $$;

-- "Running late": one tap tells every family on the van, with the reason.
create or replace function public.report_late(p_actor uuid, p_trip uuid, p_reason text, p_client_id uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  perform private.require_running_trip(p_actor, p_trip);
  insert into public.trip_events (trip_id, step, reason, client_id, tap_id, created_by, happened_at)
    values (p_trip, 'late', p_reason, p_client_id, p_client_id, p_actor, now())
    on conflict (client_id) do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------------------------------------------------------------- positions
-- The van's position, only during a running trip. Also marks "arriving" (once per child per trip) for
-- children whose stop is within 300 m and who are not on chutti. Returns the children now arriving.
create or replace function public.record_position(p_actor uuid, p_trip uuid, p_lng double precision, p_lat double precision,
  p_heading real, p_speed real, p_recorded_at timestamptz)
returns table (child_id uuid) language plpgsql security definer set search_path = '' as $$
declare
  t public.trips;
  pt extensions.geography;
begin
  t := private.require_running_trip(p_actor, p_trip);
  -- Pakistan, roughly. A point outside is a GPS glitch.
  if p_lat not between 23 and 37.5 or p_lng not between 60 and 78 then raise exception 'position_out_of_range'; end if;
  pt := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;
  insert into public.positions (trip_id, location, heading, speed, recorded_at)
    values (p_trip, pt, p_heading, p_speed, least(p_recorded_at, now()));

  if t.is_practice then return; end if;
  return query
  insert into public.trip_events (trip_id, child_id, step, client_id, created_by, happened_at)
  select p_trip, m.child_id, 'arriving', extensions.uuid_generate_v5(p_trip, 'arriving:' || m.child_id::text), null, now()
  from public.memberships m
  join public.stops s on s.id = m.stop_id
  where m.van_id = t.van_id and m.status = 'approved'
    and extensions.st_dwithin(s.location, pt, 300)
    and not exists (select 1 from public.absences a where a.child_id = m.child_id and a.service_date = t.service_date)
    -- Morning: not yet picked up. Afternoon: not yet dropped home.
    and not exists (select 1 from public.trip_events e where e.trip_id = p_trip and e.child_id = m.child_id and e.undone_at is null
                    and e.step = case when t.kind = 'morning' then 'picked'::public.trip_step else 'dropped'::public.trip_step end)
  on conflict (client_id) do nothing
  returning trip_events.child_id;
end $$;

-- ---------------------------------------------------------------- invites (the Edge Function makes the token; only its hash comes here)
create or replace function public.create_van_invite(p_actor uuid, p_van uuid, p_token_hash bytea) returns uuid
language plpgsql security definer set search_path = '' as $$
declare i uuid;
begin
  perform private.require_driver(p_actor, p_van);
  insert into public.invites (kind, van_id, token_hash, created_by) values ('van', p_van, p_token_hash, p_actor) returning id into i;
  return i;
end $$;

create or replace function public.create_driver_invite(p_actor uuid, p_child uuid, p_token_hash bytea) returns uuid
language plpgsql security definer set search_path = '' as $$
declare i uuid;
begin
  perform private.require_family(p_actor, p_child);
  insert into public.invites (kind, child_id, token_hash, created_by) values ('driver', p_child, p_token_hash, p_actor) returning id into i;
  return i;
end $$;

-- A parent opens a driver's link and asks to join with one child. The driver still approves.
create or replace function public.accept_van_invite(p_actor uuid, p_token_hash bytea, p_child uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  inv public.invites;
  v public.vans;
  m uuid;
begin
  select * into inv from public.invites where token_hash = p_token_hash and kind = 'van';
  if inv.id is null or inv.revoked_at is not null or inv.expires_at < now() then raise exception 'invite_invalid'; end if;
  select * into v from public.vans where id = inv.van_id;
  if v.verified_at is null then raise exception 'van_not_verified'; end if;
  if v.switched_off_at is not null then raise exception 'van_switched_off'; end if;
  perform private.require_family(p_actor, p_child);
  if exists (select 1 from public.memberships where child_id = p_child and status in ('pending', 'approved')) then raise exception 'child_already_on_a_van'; end if;
  insert into public.memberships (child_id, van_id, requested_by) values (p_child, inv.van_id, p_actor) returning id into m;
  return m;
end $$;

-- A driver opens a parent's "invite my driver" link after setting up their van: the child's request
-- lands in the driver's approvals like any other.
create or replace function public.accept_driver_invite(p_actor uuid, p_token_hash bytea, p_van uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  inv public.invites;
  m uuid;
begin
  select * into inv from public.invites where token_hash = p_token_hash and kind = 'driver';
  if inv.id is null or inv.revoked_at is not null or inv.used_at is not null or inv.expires_at < now() then raise exception 'invite_invalid'; end if;
  perform private.require_driver(p_actor, p_van);
  if exists (select 1 from public.memberships where child_id = inv.child_id and status in ('pending', 'approved')) then raise exception 'child_already_on_a_van'; end if;
  insert into public.memberships (child_id, van_id, requested_by) values (inv.child_id, p_van, inv.created_by) returning id into m;
  update public.invites set used_at = now() where id = inv.id;
  return m;
end $$;

-- ---------------------------------------------------------------- approvals
create or replace function public.decide_membership(p_actor uuid, p_membership uuid, p_approve boolean, p_stop uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.memberships;
  v public.vans;
begin
  select * into m from public.memberships where id = p_membership;
  if m.id is null then raise exception 'membership_not_found'; end if;
  v := private.require_driver(p_actor, m.van_id);
  if v.verified_at is null then raise exception 'van_not_verified'; end if;
  if m.status <> 'pending' then raise exception 'already_decided'; end if;
  if p_stop is not null and not exists (select 1 from public.stops where id = p_stop and van_id = m.van_id) then raise exception 'stop_not_on_van'; end if;
  update public.memberships
     set status = case when p_approve then 'approved'::public.membership_status else 'declined'::public.membership_status end,
         stop_id = case when p_approve then p_stop else null end,
         decided_at = now()
   where id = p_membership;
end $$;

-- ---------------------------------------------------------------- chutti and days off
create or replace function public.set_absence(p_actor uuid, p_child uuid, p_date date) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_family(p_actor, p_child);
  if p_date < private.karachi_today() then raise exception 'date_in_past'; end if;
  insert into public.absences (child_id, service_date, created_by) values (p_child, p_date, p_actor) on conflict do nothing;
end $$;

-- Undo "aaj chutti" until the van's morning "left" tap; after that the driver has already planned the route.
create or replace function public.clear_absence(p_actor uuid, p_child uuid, p_date date) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_family(p_actor, p_child);
  if p_date = private.karachi_today() and exists (
    select 1 from public.memberships m
    join public.trips t on t.van_id = m.van_id and t.service_date = p_date and t.kind = 'morning' and not t.is_practice
    join public.trip_events e on e.trip_id = t.id and e.step = 'left' and e.undone_at is null
    where m.child_id = p_child and m.status = 'approved'
  ) then raise exception 'van_already_left'; end if;
  delete from public.absences where child_id = p_child and service_date = p_date;
end $$;

create or replace function public.set_van_day_off(p_actor uuid, p_van uuid, p_date date, p_off boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_driver(p_actor, p_van);
  if p_date < private.karachi_today() then raise exception 'date_in_past'; end if;
  if p_off then
    insert into public.van_days_off (van_id, service_date) values (p_van, p_date) on conflict do nothing;
  else
    delete from public.van_days_off where van_id = p_van and service_date = p_date;
  end if;
end $$;

-- ---------------------------------------------------------------- families (up to 4 people: the parent and 3 more)
-- Called by the app itself right after a parent first logs in: makes their family if they have none.
create or replace function public.ensure_family() returns uuid
language plpgsql security definer set search_path = '' as $$
declare f uuid;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select family_id into f from public.family_members where user_id = auth.uid() and is_owner limit 1;
  if f is null then
    insert into public.families (created_by) values (auth.uid()) returning id into f;
    insert into public.family_members (family_id, user_id, is_owner) values (f, auth.uid(), true);
  end if;
  return f;
end $$;

create or replace function public.add_family_member(p_actor uuid, p_member uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare f uuid;
begin
  select family_id into f from public.family_members where user_id = p_actor and is_owner limit 1;
  if f is null then raise exception 'not_family_owner'; end if;
  if (select count(*) from public.family_members where family_id = f) >= 4 then raise exception 'family_full'; end if;
  insert into public.family_members (family_id, user_id) values (f, p_member) on conflict do nothing;
end $$;

-- ---------------------------------------------------------------- push tokens (the app registers its own)
create or replace function public.register_push_token(p_token text, p_platform text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  insert into public.push_tokens (user_id, token, platform) values (auth.uid(), p_token, p_platform)
  on conflict (user_id, token) do update set updated_at = now(), platform = excluded.platform;
end $$;

-- ---------------------------------------------------------------- the Pohnch team
create or replace function public.verify_van(p_actor uuid, p_van uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin(p_actor);
  update public.vans set verified_at = coalesce(verified_at, now()) where id = p_van;
end $$;

create or replace function public.switch_off_van(p_actor uuid, p_van uuid, p_off boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin(p_actor);
  update public.vans set switched_off_at = case when p_off then now() else null end where id = p_van;
  if p_off then update public.trips set status = 'ended', ended_at = now() where van_id = p_van and status = 'running'; end if;
end $$;

-- ---------------------------------------------------------------- who may run what
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'start_trip', 'end_trip', 'record_tap', 'undo_tap', 'report_late', 'record_position',
      'create_van_invite', 'create_driver_invite', 'accept_van_invite', 'accept_driver_invite',
      'decide_membership', 'set_absence', 'clear_absence', 'set_van_day_off', 'add_family_member',
      'verify_van', 'switch_off_van', 'ensure_family', 'register_push_token')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
    -- These two act on the caller themselves, so the app may call them directly.
    if f.proname in ('ensure_family', 'register_push_token') then
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated, service_role;

-- ---------------------------------------------------------------- finding a family member by phone (server only)
create or replace function public.user_id_by_phone(p_phone text) returns uuid
language sql stable security definer set search_path = '' as $$
  -- Supabase may store the number with or without the leading +.
  select id from auth.users where phone in (p_phone, ltrim(p_phone, '+')) limit 1
$$;
revoke all on function public.user_id_by_phone(text) from public, anon, authenticated;
grant execute on function public.user_id_by_phone(text) to service_role;
