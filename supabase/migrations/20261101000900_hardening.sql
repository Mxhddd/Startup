-- B8 hardening, from a review of B3-B7 against CLAUDE.md.

-- 1. Deleting a person must work (the privacy policy promises deletion within 7 days).
--    References to the person who did something become empty instead of blocking the deletion.
alter table public.memberships alter column requested_by drop not null;
alter table public.memberships drop constraint memberships_requested_by_fkey,
  add constraint memberships_requested_by_fkey foreign key (requested_by) references public.profiles (id) on delete set null;
alter table public.absences alter column created_by drop not null;
alter table public.absences drop constraint absences_created_by_fkey,
  add constraint absences_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null;
alter table public.trip_events drop constraint trip_events_created_by_fkey,
  add constraint trip_events_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null;
alter table public.families drop constraint families_created_by_fkey,
  add constraint families_created_by_fkey foreign key (created_by) references public.profiles (id) on delete cascade;

-- 2. One van per driver (the driver app shows one van).
create unique index vans_one_per_driver on public.vans (driver_id);

-- 3. A trip left running (the driver's phone died) must not block tomorrow, and must not keep a van
--    "live". Trips from earlier days, or with nothing new for 3 hours, are ended automatically.
create or replace function private.end_stale_trips() returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  update public.trips t set status = 'ended', ended_at = coalesce(t.ended_at, now())
  where t.status = 'running'
    and (t.service_date < private.karachi_today()
         or greatest(t.started_at,
                     coalesce((select max(p.recorded_at) from public.positions p where p.trip_id = t.id), t.started_at),
                     coalesce((select max(e.created_at) from public.trip_events e where e.trip_id = t.id), t.started_at))
            < now() - interval '3 hours');
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function private.end_stale_trips() from public, authenticated;
grant execute on function private.end_stale_trips() to service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('end-stale-trips', '*/15 * * * *', 'select private.end_stale_trips()');
  end if;
end $$;

-- Starting a trip first tidies up this van's stale ones, so a dead phone yesterday never blocks today.
create or replace function private.end_stale_trips_for(p_van uuid) returns void
language sql security definer set search_path = '' as $$
  update public.trips set status = 'ended', ended_at = coalesce(ended_at, now())
  where van_id = p_van and status = 'running' and service_date < private.karachi_today()
$$;

create or replace function public.start_trip(p_actor uuid, p_van uuid, p_kind public.trip_kind, p_client_id uuid, p_practice boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v public.vans;
  t_id uuid;
  today date := private.karachi_today();
begin
  select e.trip_id into t_id from public.trip_events e where e.client_id = p_client_id;
  if t_id is not null then return t_id; end if;

  v := private.require_driver(p_actor, p_van);
  perform private.end_stale_trips_for(p_van);
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

-- The team can end a stuck trip from the admin page.
create or replace function public.admin_end_trip(p_actor uuid, p_trip uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin(p_actor);
  update public.trips set status = 'ended', ended_at = coalesce(ended_at, now()) where id = p_trip and status = 'running';
end $$;

-- 4. Leaving a van: a parent takes their child off it, or the driver removes a rider.
create or replace function public.leave_van(p_actor uuid, p_child uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_family(p_actor, p_child);
  update public.memberships set status = 'left', decided_at = now()
  where child_id = p_child and status in ('pending', 'approved');
end $$;

create or replace function public.remove_rider(p_actor uuid, p_membership uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare m public.memberships;
begin
  select * into m from public.memberships where id = p_membership;
  if m.id is null then raise exception 'membership_not_found'; end if;
  perform private.require_driver(p_actor, m.van_id);
  update public.memberships set status = 'left', decided_at = now() where id = p_membership and status in ('pending', 'approved');
end $$;

-- 5. Rate limits for the Edge Function: a fixed window per person and kind of action.
create table private.rate_limits (
  user_id uuid not null,
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (user_id, bucket)
);

-- Counts one call; returns false when the person is over the limit for this window.
create or replace function public.rate_hit(p_actor uuid, p_bucket text, p_max integer, p_window_s integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare r private.rate_limits;
begin
  insert into private.rate_limits as rl (user_id, bucket, window_start, hits)
  values (p_actor, p_bucket, now(), 1)
  on conflict (user_id, bucket) do update
    set hits = case when rl.window_start < now() - make_interval(secs => p_window_s) then 1 else rl.hits + 1 end,
        window_start = case when rl.window_start < now() - make_interval(secs => p_window_s) then now() else rl.window_start end
  returning * into r;
  return r.hits <= p_max;
end $$;

revoke all on function public.admin_end_trip(uuid, uuid), public.leave_van(uuid, uuid), public.remove_rider(uuid, uuid),
  public.rate_hit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_end_trip(uuid, uuid), public.leave_van(uuid, uuid), public.remove_rider(uuid, uuid),
  public.rate_hit(uuid, text, integer, integer) to service_role;
revoke all on function private.end_stale_trips_for(uuid) from public, authenticated;
grant execute on function private.end_stale_trips_for(uuid) to service_role;
