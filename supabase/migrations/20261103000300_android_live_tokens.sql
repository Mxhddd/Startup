-- Android phones get their live trip notification refreshed by quiet data messages while the app is
-- closed. They register their Expo push token per trip and child, like an iPhone Live Activity token,
-- so the same throttle (about once a minute per card) and the same privacy rules apply.
alter table public.live_activity_tokens drop constraint if exists live_activity_tokens_kind_check;
alter table public.live_activity_tokens drop constraint if exists live_activity_tokens_check;
alter table public.live_activity_tokens add constraint live_activity_tokens_kind_check check (kind in ('update', 'start', 'android'));
alter table public.live_activity_tokens add constraint live_activity_tokens_trip_check check ((kind in ('update', 'android')) = (trip_id is not null));

drop function if exists public.live_activity_targets(uuid, boolean);
create function public.live_activity_targets(p_trip uuid, p_force boolean default false)
returns table (token text, kind text, child_id uuid, first_name text, lang text, stop_lat double precision, stop_lng double precision, driver_name text)
language sql stable security definer set search_path = '' as $$
  select la.token, la.kind, c.id, c.first_name, pr.lang,
         extensions.st_y(s.location::extensions.geometry), extensions.st_x(s.location::extensions.geometry), dp.display_name
  from public.live_activity_tokens la
  join public.trips t on t.id = la.trip_id and t.status = 'running' and not t.is_practice
  join public.vans v on v.id = t.van_id and v.switched_off_at is null
  join public.profiles dp on dp.id = v.driver_id
  join public.children c on c.id = la.child_id
  join public.memberships m on m.child_id = c.id and m.van_id = v.id and m.status = 'approved'
  left join public.stops s on s.id = m.stop_id
  join public.profiles pr on pr.id = la.user_id
  where la.trip_id = p_trip and la.kind in ('update', 'android')
    and (p_force or la.last_pushed_at is null or la.last_pushed_at < now() - interval '50 seconds')
$$;
revoke all on function public.live_activity_targets(uuid, boolean) from public, anon, authenticated;
grant execute on function public.live_activity_targets(uuid, boolean) to service_role;
