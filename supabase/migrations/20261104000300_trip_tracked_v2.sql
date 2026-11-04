-- v10: "tracked end to end" now means what the brief says (gate 1 counts it):
--   - the run ended;
--   - its van-wide start was tapped ("left" in the morning, "left school" in the afternoon);
--   - every approved rider who wasn't off that day was tapped in (morning: picked) or home (afternoon: dropped);
--   - in the morning, "reached school" was tapped;
--   - positions cover the whole run: one within 5 minutes of the start and of the end, and no gap
--     between two positions longer than 5 minutes (the phone sends every 5-30 s; queued positions
--     sent later still count, by their recorded time).
-- Undone taps never count.
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
       -- the van-wide start
       and exists (select 1 from public.trip_events e where e.trip_id = t.id and e.child_id is null and e.undone_at is null
                   and e.step = case when t.kind = 'morning' then 'left'::public.trip_step else 'left_school'::public.trip_step end)
       -- every rider
       and not exists (
         select 1 from public.memberships m
         where m.van_id = t.van_id and m.status = 'approved'
           and not exists (select 1 from public.absences a where a.child_id = m.child_id and a.service_date = t.service_date)
           and not exists (select 1 from public.trip_events e where e.trip_id = t.id and e.child_id = m.child_id and e.undone_at is null
                           and e.step = case when t.kind = 'morning' then 'picked'::public.trip_step else 'dropped'::public.trip_step end))
       -- reached school (mornings)
       and (t.kind <> 'morning' or exists (select 1 from public.trip_events e where e.trip_id = t.id and e.undone_at is null and e.step = 'reached_school'))
       -- positions throughout
       and exists (select 1 from pos)
       and (select min(recorded_at) from pos) <= t.started_at + interval '5 minutes'
       and (select max(recorded_at) from pos) >= t.ended_at - interval '5 minutes'
       and not exists (select 1 from pos where prev is not null and recorded_at - prev > interval '5 minutes')
    from t
  ), false)
$$;

revoke all on function private.trip_tracked(uuid) from public;
grant execute on function private.trip_tracked(uuid) to authenticated, service_role;
