-- For the parent's minutes-to-door: how many stops the van still has to serve before this child's
-- stop on the running trip. Only a number comes back: parents never see other families' stops.
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

  -- Stops before mine in this run's order (morning: by position; afternoon: reversed) that still have
  -- a child waiting (approved, not on chutti, not yet tapped for this run).
  select count(distinct s.id) into n
  from public.stops s
  join public.memberships om on om.stop_id = s.id and om.status = 'approved'
  where s.van_id = m.van_id
    and (case when t.kind = 'morning' then s.position < my_pos else s.position > my_pos end)
    and not exists (select 1 from public.absences a where a.child_id = om.child_id and a.service_date = t.service_date)
    and not exists (select 1 from public.trip_events e where e.trip_id = t.id and e.child_id = om.child_id and e.undone_at is null
                    and e.step = case when t.kind = 'morning' then 'picked'::public.trip_step else 'dropped'::public.trip_step end);
  return n;
end $$;
revoke all on function public.stops_ahead(uuid) from public, anon;
grant execute on function public.stops_ahead(uuid) to authenticated;
