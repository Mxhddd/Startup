-- Easier reads for the apps. The views run with the reader's own rights (security_invoker), so the same
-- row-level security applies: they only turn map points into plain latitude/longitude.

create view public.stop_points with (security_invoker = true) as
  select s.id, s.van_id, s.position, s.label, s.morning_time, s.afternoon_time,
         extensions.st_y(s.location::extensions.geometry) as lat,
         extensions.st_x(s.location::extensions.geometry) as lng
  from public.stops s;

create view public.child_points with (security_invoker = true) as
  select c.id, c.family_id, c.first_name, c.school_name,
         extensions.st_y(c.home_location::extensions.geometry) as lat,
         extensions.st_x(c.home_location::extensions.geometry) as lng
  from public.children c;

-- The latest position of each trip the reader may see (for the parent's map and the admin page).
create view public.latest_positions with (security_invoker = true) as
  select distinct on (p.trip_id) p.trip_id, p.heading, p.speed, p.recorded_at,
         extensions.st_y(p.location::extensions.geometry) as lat,
         extensions.st_x(p.location::extensions.geometry) as lng
  from public.positions p
  order by p.trip_id, p.recorded_at desc;

revoke all on public.stop_points, public.child_points, public.latest_positions from anon;
grant select on public.stop_points, public.child_points, public.latest_positions to authenticated;

-- Add a stop from a map tap (the driver's own van only; the stops policy checks it).
create or replace function public.add_stop(p_van uuid, p_label text, p_lat double precision, p_lng double precision,
  p_morning time default null, p_afternoon time default null) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare s uuid;
begin
  insert into public.stops (van_id, position, label, location, morning_time, afternoon_time)
  values (p_van, coalesce((select max(position) from public.stops where van_id = p_van), 0) + 1, p_label,
          extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography, p_morning, p_afternoon)
  returning id into s;
  return s;
end $$;

-- Put the driver's stops in a new order in one go (positions must stay unique, so it is one transaction).
create or replace function public.reorder_stops(p_van uuid, p_ids uuid[]) returns void
language plpgsql security invoker set search_path = '' as $$
declare i int;
begin
  if (select count(*) from public.stops where van_id = p_van) <> cardinality(p_ids) then raise exception 'stop_list_mismatch'; end if;
  for i in 1 .. cardinality(p_ids) loop
    update public.stops set position = i where id = p_ids[i] and van_id = p_van;
    if not found then raise exception 'stop_list_mismatch'; end if;
  end loop;
end $$;

-- Place a child's home pin by hand (the parent app never reads the phone's location).
create or replace function public.set_home_pin(p_child uuid, p_lat double precision, p_lng double precision) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  update public.children set home_location = extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography
  where id = p_child;
  if not found then raise exception 'not_your_child'; end if;
end $$;

revoke all on function public.add_stop(uuid, text, double precision, double precision, time, time) from public, anon;
revoke all on function public.reorder_stops(uuid, uuid[]) from public, anon;
revoke all on function public.set_home_pin(uuid, double precision, double precision) from public, anon;
grant execute on function public.add_stop(uuid, text, double precision, double precision, time, time) to authenticated;
grant execute on function public.reorder_stops(uuid, uuid[]) to authenticated;
grant execute on function public.set_home_pin(uuid, double precision, double precision) to authenticated;
