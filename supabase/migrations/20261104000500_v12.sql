-- v12: safety, smarter ETA and school life.
--   1. Seat check: the driver confirms the van is empty at the end of a trip (trips.seat_checked_at).
--   2. "Rain" as a late reason.
--   3. Speed watch for the team: today's fastest fixes per van (positions are trip-only already).
--   4. Learned ride minutes for a child's stop (median of the last 20 runs), for a better ETA.
--   5. Morning-only or afternoon-only chutti (run_absences), counted everywhere a day off is.
--   6. A one-day time change for a run (run_changes), told to the van's families.
--   7. Team notices to one van or everyone (notices), pushed and shown in both apps.
--   8. Quick signals from a family to the driver (signals): fixed messages, not chat.
--   9. Lost and found (found_items): the driver marks something a child left; the family sees it.
-- Every table has row-level security; nothing new is readable logged out.

-- ---------------------------------------------------------------- 1. seat check
alter table public.trips add column seat_checked_at timestamptz;

create or replace function public.confirm_seat_check(p_trip uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  t public.trips;
begin
  select * into t from public.trips where id = p_trip;
  if not found or not private.drives(t.van_id) then raise exception 'not_your_van'; end if;
  update public.trips set seat_checked_at = coalesce(seat_checked_at, now()) where id = p_trip;
end $$;

-- ---------------------------------------------------------------- 2. rain
alter table public.trip_events drop constraint if exists trip_events_reason_check;
alter table public.trip_events add constraint trip_events_reason_check check (reason in ('traffic', 'breakdown', 'roadClosed', 'rain'));

-- ---------------------------------------------------------------- 3. speed watch (the team)
-- Fixes over 50 km/h (13.9 m/s) today, per van. Speeds come from the phone during trips only.
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
    group by v.name, p.display_name
    having count(*) filter (where x.speed > 13.9) > 0
    order by 4 desc;
end $$;

-- ---------------------------------------------------------------- 4. learned ride minutes
-- For a child: how many minutes, typically, from the van's start (left / left school) to this child's
-- step (picked / dropped), over the last 20 runs where both happened. The median, per run kind.
create or replace function public.child_ride_minutes(p_child uuid)
returns table (kind public.trip_kind, minutes integer, runs integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.my_child(p_child) then raise exception 'not_your_child'; end if;
  return query
    with runs as (
      select t.kind, t.service_date,
             extract(epoch from (
               (select min(e.happened_at) from public.trip_events e where e.trip_id = t.id and e.child_id = p_child and e.undone_at is null
                  and e.step = case when t.kind = 'morning' then 'picked'::public.trip_step else 'dropped'::public.trip_step end)
               - (select min(e.happened_at) from public.trip_events e where e.trip_id = t.id and e.child_id is null and e.undone_at is null
                  and e.step = case when t.kind = 'morning' then 'left'::public.trip_step else 'left_school'::public.trip_step end)
             )) / 60.0 as m
      from public.trips t
      join public.memberships ms on ms.van_id = t.van_id and ms.child_id = p_child and ms.status = 'approved'
      where t.status = 'ended' and not t.is_practice
      order by t.service_date desc, t.started_at desc limit 40
    )
    select r.kind, round(percentile_cont(0.5) within group (order by r.m))::integer, count(*)::integer
    from runs r where r.m is not null and r.m >= 0 and r.m < 180
    group by r.kind;
end $$;

-- ---------------------------------------------------------------- 5. one run off
create table public.run_absences (
  child_id uuid not null references public.children (id) on delete cascade,
  service_date date not null,
  kind public.trip_kind not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (child_id, service_date, kind)
);
alter table public.run_absences enable row level security;
create policy run_absences_read on public.run_absences for select to authenticated
  using (private.my_child(child_id) or private.drives_child(child_id) or private.is_admin());
create policy run_absences_insert on public.run_absences for insert to authenticated
  with check (private.my_child(child_id) and created_by = auth.uid() and service_date >= private.karachi_today());
create policy run_absences_delete on public.run_absences for delete to authenticated
  using (private.my_child(child_id) and service_date >= private.karachi_today());
grant select, delete on public.run_absences to authenticated;
grant insert (child_id, service_date, kind, created_by) on public.run_absences to authenticated;

/** Off for this run: the whole day off, or just this run. */
create or replace function private.off_for(p_child uuid, p_date date, p_kind public.trip_kind) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.absences a where a.child_id = p_child and a.service_date = p_date)
      or exists (select 1 from public.run_absences r where r.child_id = p_child and r.service_date = p_date and r.kind = p_kind)
$$;

-- "Tracked end to end" (v10 rule) now skips a child who was off for just that run too.
create or replace function private.trip_tracked(p_trip uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  with t as (select * from public.trips where id = p_trip),
  pos as (
    select p.recorded_at, lag(p.recorded_at) over (order by p.recorded_at) as prev
    from public.positions p, t where p.trip_id = t.id
  )
  select coalesce((
    select t.status = 'ended'
       and t.ended_at is not null
       and exists (select 1 from public.trip_events e where e.trip_id = t.id and e.child_id is null and e.undone_at is null
                   and e.step = case when t.kind = 'morning' then 'left'::public.trip_step else 'left_school'::public.trip_step end)
       and not exists (
         select 1 from public.memberships m
         where m.van_id = t.van_id and m.status = 'approved'
           and not private.off_for(m.child_id, t.service_date, t.kind)
           and not exists (select 1 from public.trip_events e where e.trip_id = t.id and e.child_id = m.child_id and e.undone_at is null
                           and e.step = case when t.kind = 'morning' then 'picked'::public.trip_step else 'dropped'::public.trip_step end))
       and (t.kind <> 'morning' or exists (select 1 from public.trip_events e where e.trip_id = t.id and e.undone_at is null and e.step = 'reached_school'))
       and exists (select 1 from pos)
       and (select min(recorded_at) from pos) <= t.started_at + interval '5 minutes'
       and (select max(recorded_at) from pos) >= t.ended_at - interval '5 minutes'
       and not exists (select 1 from pos where prev is not null and recorded_at - prev > interval '5 minutes')
    from t
  ), false)
$$;

create or replace function public.admin_trips_today()
returns table (trip_id uuid, van_name text, driver_name text, kind public.trip_kind, status public.trip_status,
               started_at timestamptz, last_position_at timestamptz, riders integer, done integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query
  select t.id, v.name, p.display_name, t.kind, t.status, t.started_at,
         (select max(recorded_at) from public.positions x where x.trip_id = t.id),
         (select count(*)::int from public.memberships m where m.van_id = t.van_id and m.status = 'approved'
            and not private.off_for(m.child_id, t.service_date, t.kind)),
         (select count(distinct e.child_id)::int from public.trip_events e where e.trip_id = t.id and e.undone_at is null
            and e.step = case when t.kind = 'morning' then 'picked'::public.trip_step else 'dropped'::public.trip_step end)
  from public.trips t
  join public.vans v on v.id = t.van_id
  join public.profiles p on p.id = v.driver_id
  where t.service_date = private.karachi_today() and not t.is_practice
  order by t.started_at desc;
end $$;

-- ---------------------------------------------------------------- 6. one-day time change
create table public.run_changes (
  van_id uuid not null references public.vans (id) on delete cascade,
  service_date date not null,
  kind public.trip_kind not null,
  start_time time not null,
  created_at timestamptz not null default now(),
  primary key (van_id, service_date, kind)
);
alter table public.run_changes enable row level security;
create policy run_changes_read on public.run_changes for select to authenticated
  using (private.drives(van_id) or private.follows(van_id) or private.is_admin());
revoke insert, update, delete, truncate on public.run_changes from authenticated;

-- Called by the Edge Function (which then tells the families). Only the van's driver, today or later.
create or replace function public.set_run_change(p_actor uuid, p_van uuid, p_date date, p_kind public.trip_kind, p_time time) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.vans where id = p_van and driver_id = p_actor) then raise exception 'not_your_van'; end if;
  if p_date < private.karachi_today() or p_date > private.karachi_today() + 14 then raise exception 'bad_date'; end if;
  if p_time is null then
    delete from public.run_changes where van_id = p_van and service_date = p_date and kind = p_kind;
  else
    insert into public.run_changes (van_id, service_date, kind, start_time) values (p_van, p_date, p_kind, p_time)
    on conflict (van_id, service_date, kind) do update set start_time = excluded.start_time, created_at = now();
  end if;
end $$;
revoke all on function public.set_run_change(uuid, uuid, date, public.trip_kind, time) from public, anon, authenticated;
grant execute on function public.set_run_change(uuid, uuid, date, public.trip_kind, time) to service_role;

-- ---------------------------------------------------------------- 7. team notices
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  van_id uuid references public.vans (id) on delete cascade, -- null: everyone
  body text not null check (char_length(body) between 1 and 240),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '1 day'
);
alter table public.notices enable row level security;
create policy notices_read on public.notices for select to authenticated
  using (van_id is null or private.drives(van_id) or private.follows(van_id) or private.is_admin());
revoke insert, update, delete, truncate on public.notices from authenticated;

create or replace function public.post_notice(p_actor uuid, p_van uuid, p_body text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  nid uuid;
begin
  if not exists (select 1 from public.admins where user_id = p_actor) then raise exception 'not_admin'; end if;
  insert into public.notices (van_id, body, created_by) values (p_van, p_body, p_actor) returning id into nid;
  return nid;
end $$;
revoke all on function public.post_notice(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.post_notice(uuid, uuid, text) to service_role;

-- Who hears a van's (or everyone's) notice or time change: families and drivers with a push token.
create or replace function public.notice_recipients(p_van uuid)
returns table (token text, lang text, sound boolean)
language sql stable security definer set search_path = '' as $$
  select distinct pt.token, pr.lang, coalesce(np.sound, true)
  from public.vans v
  join public.memberships m on m.van_id = v.id and m.status = 'approved'
  join public.children c on c.id = m.child_id
  join public.family_members fm on fm.family_id = c.family_id
  join public.push_tokens pt on pt.user_id = fm.user_id
  join public.profiles pr on pr.id = fm.user_id
  left join public.notification_prefs np on np.user_id = fm.user_id
  where (p_van is null or v.id = p_van) and v.verified_at is not null and v.switched_off_at is null
  union
  select distinct pt.token, pr.lang, true
  from public.vans v
  join public.push_tokens pt on pt.user_id = v.driver_id
  join public.profiles pr on pr.id = v.driver_id
  where (p_van is null or v.id = p_van) and v.verified_at is not null and v.switched_off_at is null
$$;
revoke all on function public.notice_recipients(uuid) from public, anon, authenticated;
grant execute on function public.notice_recipients(uuid) to service_role;

-- ---------------------------------------------------------------- 8. quick signals (not chat)
create table public.signals (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  kind text not null check (kind in ('two_minutes', 'coming_down', 'sick_today', 'left_item')),
  service_date date not null default (now() at time zone 'Asia/Karachi')::date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index signals_child_day on public.signals (child_id, service_date);
alter table public.signals enable row level security;
create policy signals_insert on public.signals for insert to authenticated
  with check (private.my_child(child_id) and created_by = auth.uid()
              and exists (select 1 from public.memberships m where m.child_id = signals.child_id and m.status = 'approved'));
create policy signals_read on public.signals for select to authenticated
  using (private.my_child(child_id) or private.drives_child(child_id) or private.is_admin());
grant select on public.signals to authenticated;
grant insert (child_id, kind, created_by) on public.signals to authenticated;

-- ---------------------------------------------------------------- 9. lost and found
create table public.found_items (
  id uuid primary key default gen_random_uuid(),
  van_id uuid not null references public.vans (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  what text not null check (what in ('bottle', 'bag', 'lunchbox', 'jacket', 'book', 'other')),
  created_at timestamptz not null default now(),
  collected_at timestamptz
);
alter table public.found_items enable row level security;
create policy found_insert on public.found_items for insert to authenticated
  with check (private.drives(van_id) and private.drives_child(child_id));
create policy found_read on public.found_items for select to authenticated
  using (private.my_child(child_id) or private.drives(van_id) or private.is_admin());
create policy found_collect on public.found_items for update to authenticated
  using (private.my_child(child_id) or private.drives(van_id)) with check (private.my_child(child_id) or private.drives(van_id));
grant select on public.found_items to authenticated;
grant insert (van_id, child_id, what) on public.found_items to authenticated;
grant update (collected_at) on public.found_items to authenticated;

-- ---------------------------------------------------------------- who may call what
do $$
declare f text;
begin
  foreach f in array array['public.confirm_seat_check(uuid)', 'public.admin_speeding_today()', 'public.child_ride_minutes(uuid)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
grant execute on all functions in schema private to authenticated, service_role;
