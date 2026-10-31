-- The Pohnch team's admin page: the pilot's numbers, today's trips, and the driver check queue.
-- Every function here checks the caller is on the team (admins table) and refuses everyone else.

-- Push counts per Karachi day (numbers only: no tokens, names or phone numbers).
create table public.push_stats (
  day date primary key,
  sent integer not null default 0,
  dead integer not null default 0,
  failed integer not null default 0
);
alter table public.push_stats enable row level security;
revoke all on public.push_stats from anon, authenticated;
grant select on public.push_stats to authenticated;
create policy push_stats_team on public.push_stats for select to authenticated using (private.is_admin());

create or replace function public.record_push_stats(p_sent integer, p_dead integer, p_failed integer) returns void
language sql security definer set search_path = '' as $$
  insert into public.push_stats (day, sent, dead, failed) values (private.karachi_today(), p_sent, p_dead, p_failed)
  on conflict (day) do update set sent = push_stats.sent + excluded.sent, dead = push_stats.dead + excluded.dead, failed = push_stats.failed + excluded.failed
$$;
revoke all on function public.record_push_stats(integer, integer, integer) from public, anon, authenticated;
grant execute on function public.record_push_stats(integer, integer, integer) to service_role;

-- A trip is "tracked end to end" when it ended, sent positions, and every child riding that day
-- (approved, not on chutti) got their tap: in the van (morning) or dropped (afternoon).
create or replace function private.trip_tracked(p_trip uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select t.status = 'ended'
     and exists (select 1 from public.positions p where p.trip_id = t.id)
     and not exists (
       select 1 from public.memberships m
       where m.van_id = t.van_id and m.status = 'approved'
         and not exists (select 1 from public.absences a where a.child_id = m.child_id and a.service_date = t.service_date)
         and not exists (select 1 from public.trip_events e where e.trip_id = t.id and e.child_id = m.child_id and e.undone_at is null
                         and e.step = case when t.kind = 'morning' then 'picked'::public.trip_step else 'dropped'::public.trip_step end))
  from public.trips t where t.id = p_trip
$$;

-- The four numbers, over the last p_days Karachi days (today included).
create or replace function public.admin_stats(p_days integer default 7) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  since date;
  res jsonb;
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  since := private.karachi_today() - (greatest(p_days, 1) - 1);
  with t as (
    select id from public.trips where not is_practice and status <> 'cancelled' and service_date >= since
  ),
  active as (
    select distinct c.family_id from public.memberships m
    join public.vans v on v.id = m.van_id and v.verified_at is not null and v.switched_off_at is null
    join public.children c on c.id = m.child_id
    where m.status = 'approved'
  )
  select jsonb_build_object(
    'days', greatest(p_days, 1),
    'trips', (select count(*) from t),
    'tripsTracked', (select count(*) from t where private.trip_tracked(t.id)),
    'familiesActive', (select count(*) from active),
    'familiesWithAlerts', (select count(distinct a.family_id) from active a join public.family_members fm on fm.family_id = a.family_id
                            join public.push_tokens pt on pt.user_id = fm.user_id),
    'alertsSent', coalesce((select sum(sent) from public.push_stats where day >= since), 0),
    'alertsFailed', coalesce((select sum(failed + dead) from public.push_stats where day >= since), 0)
  ) into res;
  return res;
end $$;

-- Today's trips with their state, for watching the morning and afternoon runs.
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
            and not exists (select 1 from public.absences a where a.child_id = m.child_id and a.service_date = t.service_date)),
         (select count(distinct e.child_id)::int from public.trip_events e where e.trip_id = t.id and e.undone_at is null
            and e.step = case when t.kind = 'morning' then 'picked'::public.trip_step else 'dropped'::public.trip_step end)
  from public.trips t
  join public.vans v on v.id = t.van_id
  join public.profiles p on p.id = v.driver_id
  where t.service_date = private.karachi_today() and not t.is_practice
  order by t.started_at desc;
end $$;

-- Every van with its driver's name and phone (so the team can call to check papers), newest first.
create or replace function public.admin_vans()
returns table (van_id uuid, van_name text, school_name text, plate text, driver_name text, driver_phone text,
               verified_at timestamptz, switched_off_at timestamptz, created_at timestamptz, riders integer, waiting integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query
  select v.id, v.name, v.school_name, v.plate, p.display_name, u.phone::text, v.verified_at, v.switched_off_at, v.created_at,
         (select count(*)::int from public.memberships m where m.van_id = v.id and m.status = 'approved'),
         (select count(*)::int from public.memberships m where m.van_id = v.id and m.status = 'pending')
  from public.vans v
  join public.profiles p on p.id = v.driver_id
  join auth.users u on u.id = v.driver_id
  order by (v.verified_at is not null), v.created_at desc;
end $$;

revoke all on function public.admin_stats(integer), public.admin_trips_today(), public.admin_vans() from public, anon;
grant execute on function public.admin_stats(integer), public.admin_trips_today(), public.admin_vans() to authenticated;
revoke all on function private.trip_tracked(uuid) from public;
grant execute on function private.trip_tracked(uuid) to authenticated, service_role;
