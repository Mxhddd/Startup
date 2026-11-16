-- v22 Growth panel: one place on /admin for "how many people saw, clicked, signed up and use the apps".
--
-- site_daily holds only a count per day, per page and per event: no IP, no cookie, no visitor id. The website
-- sends "view" on every page, "visitor" once a day per browser (it remembers the day itself, in the browser),
-- and "click_*" when someone taps a download link. The `interest` Edge Function writes it through site_hit().
-- play_installs holds the Play Console install totals the team types in (until a Play key lets us fetch them).
-- admin_growth() puts every number for the panel in one answer; only the Pohnch team (two-step login) can call it.

create table public.site_daily (
  day date not null,
  page text not null check (char_length(page) between 1 and 40),
  event text not null check (event in ('view', 'visitor', 'click_testers', 'click_play', 'click_apk')),
  n integer not null default 0,
  primary key (day, page, event)
);
alter table public.site_daily enable row level security;
revoke all on public.site_daily from public, anon, authenticated;
grant select on public.site_daily to authenticated;
create policy site_daily_team_read on public.site_daily for select to authenticated using (private.is_admin());

create table public.play_installs (
  app text not null check (app in ('parent', 'driver')),
  day date not null,
  installs integer not null check (installs between 0 and 10000000),
  entered_at timestamptz not null default now(),
  primary key (app, day)
);
alter table public.play_installs enable row level security;
revoke all on public.play_installs from public, anon, authenticated;
grant select on public.play_installs to authenticated;
create policy play_installs_team_read on public.play_installs for select to authenticated using (private.is_admin());

-- Counts one event on one page today (Karachi date). Called only by the `interest` Edge Function.
create or replace function public.site_hit(p_page text, p_event text) returns void
language sql security definer set search_path = '' as $$
  insert into public.site_daily (day, page, event, n) values (private.karachi_today(), p_page, p_event, 1)
  on conflict (day, page, event) do update set n = public.site_daily.n + 1;
$$;
revoke all on function public.site_hit(text, text) from public, anon, authenticated;
grant execute on function public.site_hit(text, text) to service_role;

-- The team types the install total shown in Play Console (one number per app per day; a second entry that day replaces it).
create or replace function public.admin_set_installs(p_app text, p_installs integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  insert into public.play_installs (app, day, installs) values (p_app, private.karachi_today(), p_installs)
  on conflict (app, day) do update set installs = excluded.installs, entered_at = now();
end $$;
revoke all on function public.admin_set_installs(text, integer) from public, anon;
grant execute on function public.admin_set_installs(text, integer) to authenticated;

-- Every number on the Growth panel. Each metric has today / last 7 days (today included) / all time,
-- plus 14 days of views, visitors and sign-ups for the small chart, and the most-seen pages this week.
create or replace function public.admin_growth() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  d date := private.karachi_today();
  r jsonb;
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  with
  site as (
    select event,
           coalesce(sum(n) filter (where day = d), 0)::int as today,
           coalesce(sum(n) filter (where day > d - 7), 0)::int as week,
           coalesce(sum(n), 0)::int as total
      from public.site_daily group by event
  ),
  signups as (
    select role,
           count(*) filter (where (created_at at time zone 'Asia/Karachi')::date = d)::int as today,
           count(*) filter (where (created_at at time zone 'Asia/Karachi')::date > d - 7)::int as week,
           count(*)::int as total
      from public.pilot_interest group by role
  ),
  people as (
    select 'accounts' as k, u.created_at from auth.users u
    union all select 'parents', min(fm.added_at) from public.family_members fm group by fm.user_id
    union all select 'drivers', min(v.created_at) from public.vans v group by v.driver_id
  ),
  people_n as (
    select k,
           count(*) filter (where (created_at at time zone 'Asia/Karachi')::date = d)::int as today,
           count(*) filter (where (created_at at time zone 'Asia/Karachi')::date > d - 7)::int as week,
           count(*)::int as total
      from people group by k
  ),
  days as (select generate_series(d - 13, d, interval '1 day')::date as day),
  series as (
    select days.day,
           coalesce((select sum(n) from public.site_daily s where s.day = days.day and s.event = 'view'), 0)::int as views,
           coalesce((select sum(n) from public.site_daily s where s.day = days.day and s.event = 'visitor'), 0)::int as visitors,
           (select count(*) from public.pilot_interest p where (p.created_at at time zone 'Asia/Karachi')::date = days.day)::int as signups
      from days
  ),
  pages as (
    select page, sum(n)::int as views from public.site_daily
     where event = 'view' and day > d - 7 group by page order by sum(n) desc limit 8
  ),
  installs as (
    select distinct on (app) app, installs, day from public.play_installs order by app, day desc
  )
  select jsonb_build_object(
    'site', coalesce((select jsonb_object_agg(event, jsonb_build_object('today', today, 'week', week, 'total', total)) from site), '{}'::jsonb),
    'signups', coalesce((select jsonb_object_agg(role, jsonb_build_object('today', today, 'week', week, 'total', total)) from signups), '{}'::jsonb),
    'people', coalesce((select jsonb_object_agg(k, jsonb_build_object('today', today, 'week', week, 'total', total)) from people_n), '{}'::jsonb),
    'vans', jsonb_build_object(
      'set_up', (select count(*) from public.vans v where v.switched_off_at is null and exists (select 1 from public.memberships m where m.van_id = v.id and m.status = 'approved'))::int,
      'tracked_week', (select count(*) from public.trips t where not t.is_practice and t.status <> 'cancelled'
                         and (t.started_at at time zone 'Asia/Karachi')::date > d - 7 and private.trip_tracked(t.id))::int),
    'series', (select jsonb_agg(jsonb_build_object('day', day, 'views', views, 'visitors', visitors, 'signups', signups) order by day) from series),
    'pages', coalesce((select jsonb_agg(jsonb_build_object('page', page, 'views', views) order by views desc) from pages), '[]'::jsonb),
    'installs', coalesce((select jsonb_object_agg(app, jsonb_build_object('installs', installs, 'day', day)) from installs), '{}'::jsonb)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_growth() from public, anon;
grant execute on function public.admin_growth() to authenticated;
