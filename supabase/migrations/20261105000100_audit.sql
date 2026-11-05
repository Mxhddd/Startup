-- Audit fixes (5 November 2026). Each part says what was wrong and what this changes.

-- ---------------------------------------------------------------- 1. positions as map points
-- The parent app read lat/lng straight from `positions`, which only has a geography column, so every
-- read during a live trip failed. This view gives each position's lat/lng, with the same row-level
-- security as the table (security_invoker): only the van's approved families, its driver and the team.
create or replace view public.position_points with (security_invoker = true) as
  select p.trip_id, p.heading, p.speed, p.recorded_at,
         extensions.st_y(p.location::extensions.geometry) as lat,
         extensions.st_x(p.location::extensions.geometry) as lng
  from public.positions p;
revoke all on public.position_points from anon;
grant select on public.position_points to authenticated;

-- ---------------------------------------------------------------- 2. live notification tokens
-- Android gives one token per phone, used for every trip. Saving it with "insert, ignore if it exists"
-- kept it pinned to the first trip forever. This function moves the token to the current trip/child
-- (the caller's own rows only) and checks the child and trip like the insert policy did.
create or replace function public.register_live_token(p_token text, p_kind text, p_trip uuid default null, p_child uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not_signed_in'; end if;
  if p_kind not in ('update', 'start', 'android') then raise exception 'bad_kind'; end if;
  if char_length(p_token) not between 8 and 400 then raise exception 'bad_token'; end if;
  if p_child is not null and not private.my_child(p_child) then raise exception 'not_your_child'; end if;
  if p_trip is not null and not exists (select 1 from public.trips t where t.id = p_trip and private.follows(t.van_id)) then
    raise exception 'not_your_van';
  end if;
  -- Someone else's row with this token (a phone that changed hands) is replaced too.
  delete from public.live_activity_tokens where token = p_token;
  insert into public.live_activity_tokens (token, user_id, kind, trip_id, child_id) values (p_token, me, p_kind, p_trip, p_child);
end $$;
revoke all on function public.register_live_token(text, text, uuid, uuid) from public, anon;
grant execute on function public.register_live_token(text, text, uuid, uuid) to authenticated;

-- ---------------------------------------------------------------- 3. off for one run, everywhere
-- v12 taught the tracked-trip rule about one-run chutti; pushes, "at your door" and stops-ahead still
-- only knew whole-day chutti.
create or replace function public.push_recipients(p_trip uuid, p_children uuid[] default null, p_step text default null)
returns table (child_id uuid, first_name text, user_id uuid, token text, platform text, lang text, driver_name text, sound boolean)
language sql stable security definer set search_path = '' as $$
  select c.id, c.first_name, pt.user_id, pt.token, pt.platform, pr.lang, dp.display_name, coalesce(np.sound, true)
  from public.trips t
  join public.vans v on v.id = t.van_id and v.verified_at is not null and v.switched_off_at is null
  join public.profiles dp on dp.id = v.driver_id
  join public.memberships m on m.van_id = v.id and m.status = 'approved'
  join public.children c on c.id = m.child_id
  join public.family_members fm on fm.family_id = c.family_id
  join public.push_tokens pt on pt.user_id = fm.user_id
  join public.profiles pr on pr.id = fm.user_id
  left join public.notification_prefs np on np.user_id = fm.user_id
  where t.id = p_trip and not t.is_practice
    and (p_step is null or np.user_id is null or not (p_step = any (np.off_steps)))
    and (
      (p_children is not null and c.id = any (p_children))
      or (p_children is null and not private.off_for(c.id, t.service_date, t.kind))
    )
$$;
revoke all on function public.push_recipients(uuid, uuid[], text) from public, anon, authenticated;
grant execute on function public.push_recipients(uuid, uuid[], text) to service_role;

create or replace function public.record_position(p_actor uuid, p_trip uuid, p_lng double precision, p_lat double precision,
  p_heading real, p_speed real, p_recorded_at timestamptz)
returns table (child_id uuid) language plpgsql security definer set search_path = '' as $$
declare
  t public.trips;
  pt extensions.geography;
begin
  t := private.require_running_trip(p_actor, p_trip);
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
    and not private.off_for(m.child_id, t.service_date, t.kind)
    and not exists (select 1 from public.trip_events e where e.trip_id = p_trip and e.child_id = m.child_id and e.undone_at is null
                    and e.step = case when t.kind = 'morning' then 'picked'::public.trip_step else 'dropped'::public.trip_step end)
  on conflict (client_id) do nothing
  returning trip_events.child_id;
end $$;

create or replace function public.stops_ahead(p_child uuid) returns integer
language plpgsql stable security definer set search_path = '' as $$
declare
  m public.memberships;
  my_pos int;
  t public.trips;
  n int;
begin
  if not private.my_child(p_child) then raise exception 'not_your_child'; end if;
  select * into m from public.memberships where child_id = p_child and status = 'approved';
  if m.id is null or m.stop_id is null then return null; end if;
  select position into my_pos from public.stops where id = m.stop_id;
  select * into t from public.trips where van_id = m.van_id and status = 'running' and not is_practice limit 1;
  if t.id is null then return null; end if;
  select count(distinct s.id) into n
  from public.stops s
  join public.memberships om on om.stop_id = s.id and om.status = 'approved'
  where s.van_id = m.van_id
    and (case when t.kind = 'morning' then s.position < my_pos else s.position > my_pos end)
    and not private.off_for(om.child_id, t.service_date, t.kind)
    and not exists (select 1 from public.trip_events e where e.trip_id = t.id and e.child_id = om.child_id and e.undone_at is null
                    and e.step = case when t.kind = 'morning' then 'picked'::public.trip_step else 'dropped'::public.trip_step end);
  return n;
end $$;
revoke all on function public.stops_ahead(uuid) from public, anon;
grant execute on function public.stops_ahead(uuid) to authenticated;

-- ---------------------------------------------------------------- 4. one-run chutti goes through the server
-- Families wrote run_absences directly, with no cut-off: a run could be marked off after it had started
-- (or even ended), changing the tracked-trip numbers. Now the Edge Function calls these, which refuse
-- once that run has started today, like whole-day chutti's "until the van left" rule.
create or replace function public.set_run_absence(p_actor uuid, p_child uuid, p_date date, p_kind public.trip_kind, p_off boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_family(p_actor, p_child);
  if p_date < private.karachi_today() then raise exception 'date_in_past'; end if;
  if p_date > private.karachi_today() + 60 then raise exception 'date_too_far'; end if;
  if p_date = private.karachi_today() and exists (
    select 1 from public.memberships m
    join public.trips t on t.van_id = m.van_id and t.service_date = p_date and t.kind = p_kind and not t.is_practice
    where m.child_id = p_child and m.status = 'approved'
  ) then raise exception 'van_already_left'; end if;
  if p_off then
    insert into public.run_absences (child_id, service_date, kind, created_by) values (p_child, p_date, p_kind, p_actor)
    on conflict do nothing;
  else
    delete from public.run_absences where child_id = p_child and service_date = p_date and kind = p_kind;
  end if;
end $$;
revoke all on function public.set_run_absence(uuid, uuid, date, public.trip_kind, boolean) from public, anon, authenticated;
grant execute on function public.set_run_absence(uuid, uuid, date, public.trip_kind, boolean) to service_role;

-- ---------------------------------------------------------------- 5. table rights: only what the apps use
-- Supabase gives the authenticated role every right on new tables by default; the column grants added
-- for these tables did not restrict anything. Revoke first, then grant only what each table needs.
revoke insert, update, delete, truncate, references, trigger on public.run_absences from authenticated;
grant select on public.run_absences to authenticated;

revoke insert, update, delete, truncate, references, trigger on public.signals from authenticated;
grant select on public.signals to authenticated;
grant insert (child_id, kind, created_by) on public.signals to authenticated;

revoke insert, update, delete, truncate, references, trigger on public.found_items from authenticated;
grant select on public.found_items to authenticated;
grant insert (van_id, child_id, what) on public.found_items to authenticated;
grant update (collected_at) on public.found_items to authenticated;

revoke insert, update, delete, truncate, references, trigger on public.ready_signals from authenticated;
grant select on public.ready_signals to authenticated;
grant insert (trip_id, child_id, created_by) on public.ready_signals to authenticated;

revoke insert, update, delete, truncate, references, trigger on public.live_activity_tokens from authenticated;
grant select, delete on public.live_activity_tokens to authenticated;

revoke insert, update, delete, truncate, references, trigger on public.notification_prefs from authenticated;
grant select on public.notification_prefs to authenticated;
grant insert (user_id, off_steps, sound, updated_at) on public.notification_prefs to authenticated;
grant update (user_id, off_steps, sound, updated_at) on public.notification_prefs to authenticated;

-- ---------------------------------------------------------------- 6. one signal of each kind a day
delete from public.signals s using public.signals d
  where s.child_id = d.child_id and s.service_date = d.service_date and s.kind = d.kind
    and (s.created_at > d.created_at or (s.created_at = d.created_at and s.id > d.id));
create unique index if not exists signals_once_a_day on public.signals (child_id, service_date, kind);

-- ---------------------------------------------------------------- 7. a van-wide step is recorded once
-- "Reached school" sent twice (a second hold with a new tap id) pushed every family twice.
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
  if t.status = 'cancelled' or (t.status = 'ended' and p_happened_at > t.ended_at) then raise exception 'trip_not_running'; end if;
  if p_step in ('arriving', 'late') then raise exception 'step_not_tappable'; end if;
  at := least(greatest(p_happened_at, t.started_at), now());

  if p_step in ('picked', 'dropped') then
    if coalesce(cardinality(p_children), 0) = 0 then raise exception 'children_required'; end if;
    foreach kid in array p_children loop
      if not exists (select 1 from public.memberships where child_id = kid and van_id = t.van_id and status = 'approved') then
        raise exception 'child_not_on_van';
      end if;
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
    if exists (select 1 from public.trip_events e where e.trip_id = p_trip and e.child_id is null and e.step = p_step and e.undone_at is null) then
      return 0;
    end if;
    insert into public.trip_events (trip_id, step, client_id, tap_id, created_by, happened_at)
      values (p_trip, p_step, p_client_id, p_client_id, p_actor, at)
      on conflict (client_id) do nothing;
    get diagnostics n = row_count;
  end if;
  return n;
end $$;

-- ---------------------------------------------------------------- 8. the seat check through the offline queue
create or replace function public.set_seat_checked(p_actor uuid, p_trip uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare t public.trips;
begin
  select * into t from public.trips where id = p_trip;
  if t.id is null then raise exception 'trip_not_found'; end if;
  perform private.require_driver(p_actor, t.van_id);
  update public.trips set seat_checked_at = coalesce(seat_checked_at, now()) where id = p_trip;
end $$;
revoke all on function public.set_seat_checked(uuid, uuid) from public, anon, authenticated;
grant execute on function public.set_seat_checked(uuid, uuid) to service_role;

-- ---------------------------------------------------------------- 9. speeding: one row per van
create or replace function public.admin_speeding_today()
returns table (van_name text, driver_name text, max_kmh integer, fast_fixes integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query
    select v.name, p.display_name, round(max(x.speed) * 3.6)::integer, count(*) filter (where x.speed > 13.9)::integer
    from public.trips t
    join public.vans v on v.id = t.van_id
    join public.profiles p on p.id = v.driver_id
    join public.positions x on x.trip_id = t.id
    where t.service_date = private.karachi_today() and not t.is_practice
    group by v.id, v.name, p.display_name
    having count(*) filter (where x.speed > 13.9) > 0
    order by 3 desc;
end $$;

-- ---------------------------------------------------------------- 10. a one-day time change, checked on the server
-- The driver's name in the families' push now comes from the profile, never from the phone; a
-- switched-off van can't send one.
drop function if exists public.set_run_change(uuid, uuid, date, public.trip_kind, time);
create function public.set_run_change(p_actor uuid, p_van uuid, p_date date, p_kind public.trip_kind, p_time time) returns text
language plpgsql security definer set search_path = '' as $$
declare v public.vans;
begin
  v := private.require_driver(p_actor, p_van);
  if p_date < private.karachi_today() or p_date > private.karachi_today() + 14 then raise exception 'bad_date'; end if;
  if p_time is null then
    delete from public.run_changes where van_id = p_van and service_date = p_date and kind = p_kind;
  else
    insert into public.run_changes (van_id, service_date, kind, start_time) values (p_van, p_date, p_kind, p_time)
    on conflict (van_id, service_date, kind) do update set start_time = excluded.start_time, created_at = now();
  end if;
  return (select display_name from public.profiles where id = p_actor);
end $$;
revoke all on function public.set_run_change(uuid, uuid, date, public.trip_kind, time) from public, anon, authenticated;
grant execute on function public.set_run_change(uuid, uuid, date, public.trip_kind, time) to service_role;

create or replace function public.post_notice(p_actor uuid, p_van uuid, p_body text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare nid uuid;
begin
  if not exists (select 1 from public.admins where user_id = p_actor) then raise exception 'not_admin'; end if;
  if p_van is not null and not exists (select 1 from public.vans where id = p_van) then raise exception 'van_not_found'; end if;
  insert into public.notices (van_id, body, created_by) values (p_van, p_body, p_actor) returning id into nid;
  return nid;
end $$;
revoke all on function public.post_notice(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.post_notice(uuid, uuid, text) to service_role;
