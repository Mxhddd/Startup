-- v10: stage 2, built behind a switch that stays OFF until gate 1 (80% of trips tracked end to end and
-- 40% of families keeping Live). With the switch off, stage 1 is unchanged: every stage 2 function
-- below checks private.stage2_on() first and refuses with 'stage2_off'.
--
-- What is here: the switch (app_flags), Pohnch Live (a free first month only, no payment), find a van
-- and ask for a seat (with a one-week trial), request a van (opens at 4, launches at 8), ratings (shown
-- only from 5 up), fees (the driver marks "paid in cash"; no money passes through Pohnch), and the
-- driver's help alert with the van's last position for the Pohnch team.
-- Privacy: nothing here returns a child's name or a phone number to anyone but the people who already
-- see them in stage 1 (the family; the driver sees first names of riders).

-- ---------------------------------------------------------------------------
-- The switch. One row for everyone (van_id null) and/or rows for single vans (a pilot inside the pilot).
create table public.app_flags (
  key text not null check (key in ('stage2')),
  van_id uuid references public.vans (id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
create unique index app_flags_one on public.app_flags (key, coalesce(van_id, '00000000-0000-0000-0000-000000000000'::uuid));
alter table public.app_flags enable row level security;
create policy app_flags_read on public.app_flags for select to authenticated using (private.is_admin());
revoke insert, update, delete, truncate on public.app_flags from authenticated;

-- On for me: on for everyone, or on for a van I drive or a van one of my children is on (or asked for).
create or replace function private.stage2_on() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_flags where key = 'stage2' and enabled and van_id is null)
      or exists (
        select 1 from public.app_flags f
        where f.key = 'stage2' and f.enabled and f.van_id is not null
          and (exists (select 1 from public.vans v where v.id = f.van_id and v.driver_id = auth.uid())
               or exists (select 1 from public.memberships m
                          join public.children c on c.id = m.child_id
                          join public.family_members fm on fm.family_id = c.family_id
                          where m.van_id = f.van_id and m.status in ('pending', 'approved') and fm.user_id = auth.uid()))
      )
$$;

create or replace function private.need_stage2() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.stage2_on() then raise exception 'stage2_off'; end if;
end $$;

/** What the apps ask: is this feature on for me? */
create or replace function public.flag_on(p_key text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case when p_key = 'stage2' then private.stage2_on() else false end
$$;

/** The team switches stage 2 on or off, for everyone (p_van null) or one van. */
create or replace function public.admin_set_flag(p_key text, p_van uuid, p_on boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  delete from public.app_flags where key = p_key and van_id is not distinct from p_van;
  insert into public.app_flags (key, van_id, enabled) values (p_key, p_van, p_on);
end $$;

create or replace function public.admin_flags() returns table (key text, van_id uuid, van_name text, enabled boolean, updated_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query select f.key, f.van_id, v.name, f.enabled, f.updated_at from public.app_flags f left join public.vans v on v.id = f.van_id order by f.van_id nulls first;
end $$;

-- ---------------------------------------------------------------------------
-- The van's fee and seats (set by the driver), and the trial on a new seat.
alter table public.vans add column monthly_fee integer check (monthly_fee between 0 and 100000);
alter table public.vans add column seats integer check (seats between 1 and 40);
alter table public.memberships add column trial_until date;

-- ---------------------------------------------------------------------------
-- Pohnch Live: a free first month for the family. No payment is taken in the app until Pohnch has its
-- company, tax number and bank accounts; basic step alerts are always free.
create table public.live_entitlements (
  family_id uuid primary key references public.families (id) on delete cascade,
  status text not null check (status in ('trial', 'active', 'ended')),
  trial_ends date not null,
  started_at timestamptz not null default now()
);
alter table public.live_entitlements enable row level security;
create policy live_read on public.live_entitlements for select to authenticated using (private.in_family(family_id));
revoke insert, update, delete, truncate on public.live_entitlements from authenticated;

create or replace function private.my_family_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select family_id from public.family_members where user_id = auth.uid() order by is_owner desc, added_at limit 1
$$;

/** The family's Live: 'none' (never started), 'trial' with the days left, 'active', or 'ended'. */
create or replace function public.live_status() returns table (status text, trial_ends date, days_left integer)
language plpgsql stable security definer set search_path = '' as $$
declare
  e public.live_entitlements;
begin
  perform private.need_stage2();
  select * into e from public.live_entitlements where family_id = private.my_family_id();
  if not found then return query select 'none'::text, null::date, 0; return; end if;
  if e.status = 'trial' and e.trial_ends < private.karachi_today() then
    return query select 'ended'::text, e.trial_ends, 0; return;
  end if;
  return query select e.status, e.trial_ends, greatest(0, e.trial_ends - private.karachi_today());
end $$;

/** Start the free month (once per family). */
create or replace function public.start_live_trial() returns date
language plpgsql security definer set search_path = '' as $$
declare
  fam uuid := private.my_family_id();
  ends date := private.karachi_today() + 30;
begin
  perform private.need_stage2();
  if fam is null then raise exception 'no_family'; end if;
  if exists (select 1 from public.live_entitlements where family_id = fam) then raise exception 'trial_used'; end if;
  insert into public.live_entitlements (family_id, status, trial_ends) values (fam, 'trial', ends);
  return ends;
end $$;

-- ---------------------------------------------------------------------------
-- Reliability: the share of the van's last 20 finished real runs tracked end to end (null under 3 runs).
create or replace function private.van_reliability(p_van uuid) returns integer
language sql stable security definer set search_path = '' as $$
  with last as (
    select id from public.trips
    where van_id = p_van and status = 'ended' and not is_practice
    order by service_date desc, started_at desc limit 20
  )
  select case when count(*) < 3 then null
              else round(100.0 * count(*) filter (where private.trip_tracked(id)) / count(*))::integer end
  from last
$$;

-- ---------------------------------------------------------------------------
-- Ratings: 1-5 stars and a few tags, one per family per van per month. Shown only as an average once a
-- van has 5 or more, so one family's view can't be picked out.
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  van_id uuid not null references public.vans (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  month date not null,
  stars smallint not null check (stars between 1 and 5),
  tags text[] not null default '{}' check (tags <@ array['on_time', 'safe_driving', 'clean_van', 'kind', 'careful']::text[]),
  created_at timestamptz not null default now(),
  unique (van_id, family_id, month)
);
alter table public.ratings enable row level security;
create policy ratings_read_own on public.ratings for select to authenticated using (private.in_family(family_id));
revoke insert, update, delete, truncate on public.ratings from authenticated;

create or replace function public.rate_van(p_van uuid, p_stars integer, p_tags text[] default '{}') returns void
language plpgsql security definer set search_path = '' as $$
declare
  fam uuid;
begin
  perform private.need_stage2();
  select c.family_id into fam from public.memberships m
    join public.children c on c.id = m.child_id
    join public.family_members fm on fm.family_id = c.family_id
    where m.van_id = p_van and m.status = 'approved' and fm.user_id = auth.uid() limit 1;
  if fam is null then raise exception 'not_on_this_van'; end if;
  insert into public.ratings (van_id, family_id, month, stars, tags)
    values (p_van, fam, date_trunc('month', private.karachi_today())::date, p_stars, coalesce(p_tags, '{}'))
  on conflict (van_id, family_id, month) do update set stars = excluded.stars, tags = excluded.tags, created_at = now();
end $$;

create or replace function private.van_rating(p_van uuid) returns table (avg numeric, n integer)
language sql stable security definer set search_path = '' as $$
  select case when count(*) >= 5 then round(avg(stars)::numeric, 1) else null end, count(*)::integer
  from public.ratings where van_id = p_van and month >= date_trunc('month', private.karachi_today())::date - interval '5 months'
$$;

-- ---------------------------------------------------------------------------
-- Find a van: verified vans with a stop near the child's home pin, the same school first.
-- Returns what a parent may know before joining: the van, the driver's first name, verified,
-- reliability, rating (from 5 up), walk to the nearest stop, fee, seats left. Never riders' names.
create or replace function public.vans_near(p_child uuid, p_radius_m integer default 1500)
returns table (van_id uuid, van_name text, driver_name text, school_name text, same_school boolean, walk_m integer,
               reliability integer, rating numeric, ratings integer, monthly_fee integer, seats_left integer)
language plpgsql stable security definer set search_path = '' as $$
declare
  home extensions.geography;
  school text;
begin
  perform private.need_stage2();
  if not private.my_child(p_child) then raise exception 'not_your_child'; end if;
  select home_location, lower(trim(c.school_name)) into home, school from public.children c where id = p_child;
  if home is null then raise exception 'no_home_pin'; end if;
  return query
    select v.id, v.name, split_part(p.display_name, ' ', 1), v.school_name, lower(trim(v.school_name)) = school,
           round(min(extensions.st_distance(s.location, home)))::integer,
           private.van_reliability(v.id), (select r.avg from private.van_rating(v.id) r), (select r.n from private.van_rating(v.id) r),
           v.monthly_fee,
           case when v.seats is null then null else greatest(0, v.seats - (select count(*) from public.memberships m where m.van_id = v.id and m.status = 'approved'))::integer end
    from public.vans v
    join public.profiles p on p.id = v.driver_id
    join public.stops s on s.van_id = v.id
    where v.verified_at is not null and v.switched_off_at is null
      and extensions.st_dwithin(s.location, home, least(greatest(p_radius_m, 200), 5000))
    group by v.id, v.name, p.display_name, v.school_name, v.monthly_fee, v.seats
    order by (lower(trim(v.school_name)) = school) desc, min(extensions.st_distance(s.location, home));
end $$;

/** Ask for a seat on a van found nearby: a waiting membership with a one-week trial; the driver approves. */
create or replace function public.request_seat(p_van uuid, p_child uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  mid uuid;
begin
  perform private.need_stage2();
  if not private.my_child(p_child) then raise exception 'not_your_child'; end if;
  if not exists (select 1 from public.vans where id = p_van and verified_at is not null and switched_off_at is null) then raise exception 'van_not_open'; end if;
  if exists (select 1 from public.memberships where child_id = p_child and status in ('pending', 'approved')) then raise exception 'child_already_on_a_van'; end if;
  insert into public.memberships (child_id, van_id, status, requested_by, trial_until)
    values (p_child, p_van, 'pending', auth.uid(), private.karachi_today() + 7) returning id into mid;
  return mid;
end $$;

-- ---------------------------------------------------------------------------
-- Request a van for a neighbourhood and school: it opens at 4 children and Pohnch brings a verified van
-- at 8. Families pay nothing until a van runs.
create table public.van_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  school_name text not null,
  area extensions.geography(point, 4326) not null,
  status text not null default 'open' check (status in ('open', 'launched', 'withdrawn')),
  created_at timestamptz not null default now()
);
create unique index van_requests_one_open on public.van_requests (child_id) where status = 'open';
alter table public.van_requests enable row level security;
create policy van_requests_read_own on public.van_requests for select to authenticated using (private.in_family(family_id));
revoke insert, update, delete, truncate on public.van_requests from authenticated;

create or replace function public.request_van(p_child uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  c public.children;
  rid uuid;
begin
  perform private.need_stage2();
  if not private.my_child(p_child) then raise exception 'not_your_child'; end if;
  select * into c from public.children where id = p_child;
  if c.home_location is null then raise exception 'no_home_pin'; end if;
  select id into rid from public.van_requests where child_id = p_child and status = 'open';
  if rid is not null then return rid; end if;
  insert into public.van_requests (family_id, child_id, school_name, area)
    values (c.family_id, p_child, c.school_name, c.home_location) returning id into rid;
  return rid;
end $$;

/** How many open requests there are for the same school within 2 km (this one included). */
create or replace function public.request_progress(p_request uuid) returns integer
language plpgsql stable security definer set search_path = '' as $$
declare
  r public.van_requests;
begin
  perform private.need_stage2();
  select * into r from public.van_requests where id = p_request;
  if not found or not private.in_family(r.family_id) then raise exception 'not_found'; end if;
  return (select count(*)::integer from public.van_requests o
          where o.status = 'open' and lower(trim(o.school_name)) = lower(trim(r.school_name))
            and extensions.st_dwithin(o.area, r.area, 2000));
end $$;

create or replace function public.withdraw_van_request(p_request uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.need_stage2();
  update public.van_requests set status = 'withdrawn'
  where id = p_request and status = 'open' and private.in_family(family_id);
end $$;

/** The team: open requests grouped by school, with the number of children (no names, no exact places). */
create or replace function public.admin_van_requests() returns table (school_name text, children integer, lat numeric, lng numeric, oldest timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query
    select min(r.school_name), count(*)::integer,
           round(avg(extensions.st_y(r.area::extensions.geometry))::numeric, 2), round(avg(extensions.st_x(r.area::extensions.geometry))::numeric, 2),
           min(r.created_at)
    from public.van_requests r where r.status = 'open'
    group by lower(trim(r.school_name)) order by count(*) desc;
end $$;

-- ---------------------------------------------------------------------------
-- Fees: the driver sets the monthly fee and marks each family "paid in cash". No money moves through
-- Pohnch; the 7% fee waits for in-app payments.
create table public.fee_payments (
  membership_id uuid not null references public.memberships (id) on delete cascade,
  month date not null,
  amount integer not null check (amount between 0 and 100000),
  paid_at timestamptz not null default now(),
  marked_by uuid not null references public.profiles (id),
  primary key (membership_id, month)
);
alter table public.fee_payments enable row level security;
create policy fee_payments_read on public.fee_payments for select to authenticated using (
  exists (select 1 from public.memberships m where m.id = membership_id and (private.drives(m.van_id) or private.my_child(m.child_id)))
);
revoke insert, update, delete, truncate on public.fee_payments from authenticated;

create or replace function public.set_van_fee(p_van uuid, p_fee integer, p_seats integer default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.need_stage2();
  if not private.drives(p_van) then raise exception 'not_your_van'; end if;
  update public.vans set monthly_fee = p_fee, seats = coalesce(p_seats, seats) where id = p_van;
end $$;

create or replace function public.mark_fee_paid(p_membership uuid, p_paid boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m public.memberships;
  this_month date := date_trunc('month', private.karachi_today())::date;
begin
  perform private.need_stage2();
  select * into m from public.memberships where id = p_membership and status = 'approved';
  if not found or not private.drives(m.van_id) then raise exception 'not_your_van'; end if;
  if p_paid then
    insert into public.fee_payments (membership_id, month, amount, marked_by)
      values (p_membership, this_month, coalesce((select monthly_fee from public.vans where id = m.van_id), 0), auth.uid())
    on conflict (membership_id, month) do nothing;
  else
    delete from public.fee_payments where membership_id = p_membership and month = this_month;
  end if;
end $$;

/** The driver's month: each riding family (by the children's first names) and whether it is paid. */
create or replace function public.van_fees(p_van uuid) returns table (membership_id uuid, first_name text, amount integer, paid boolean)
language plpgsql stable security definer set search_path = '' as $$
declare
  this_month date := date_trunc('month', private.karachi_today())::date;
begin
  perform private.need_stage2();
  if not private.drives(p_van) then raise exception 'not_your_van'; end if;
  return query
    select m.id, c.first_name, coalesce(v.monthly_fee, 0),
           exists (select 1 from public.fee_payments f where f.membership_id = m.id and f.month = this_month)
    from public.memberships m join public.children c on c.id = m.child_id join public.vans v on v.id = m.van_id
    where m.van_id = p_van and m.status = 'approved' order by c.first_name;
end $$;

/** A parent: this month and the two before for one child, paid or due. */
create or replace function public.child_fees(p_child uuid) returns table (month date, amount integer, paid boolean, van_name text)
language plpgsql stable security definer set search_path = '' as $$
declare
  m public.memberships;
begin
  perform private.need_stage2();
  if not private.my_child(p_child) then raise exception 'not_your_child'; end if;
  select * into m from public.memberships where child_id = p_child and status = 'approved';
  if not found then return; end if;
  return query
    select g.month::date, coalesce(f.amount, v.monthly_fee, 0), f.membership_id is not null, v.name
    from generate_series(date_trunc('month', private.karachi_today()) - interval '2 months', date_trunc('month', private.karachi_today()), interval '1 month') as g(month)
    join public.vans v on v.id = m.van_id
    left join public.fee_payments f on f.membership_id = m.id and f.month = g.month::date
    order by g.month desc;
end $$;

-- ---------------------------------------------------------------------------
-- The driver's help alert: a hold on the trip screen sends the Pohnch team an alert with the van's
-- last position (already shared during the trip). Only during a running trip.
create table public.help_alerts (
  id uuid primary key default gen_random_uuid(),
  van_id uuid not null references public.vans (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  location extensions.geography(point, 4326),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.help_alerts enable row level security;
create policy help_alerts_read on public.help_alerts for select to authenticated using (private.is_admin() or private.drives(van_id));
revoke insert, update, delete, truncate on public.help_alerts from authenticated;

create or replace function public.send_help_alert(p_trip uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  t public.trips;
  hid uuid;
begin
  perform private.need_stage2();
  select * into t from public.trips where id = p_trip;
  if not found or not private.drives(t.van_id) then raise exception 'not_your_van'; end if;
  if t.status <> 'running' then raise exception 'trip_not_running'; end if;
  insert into public.help_alerts (van_id, trip_id, created_by, location)
    values (t.van_id, t.id, auth.uid(), (select location from public.positions where trip_id = t.id order by recorded_at desc limit 1))
  returning id into hid;
  return hid;
end $$;

create or replace function public.admin_help_alerts() returns table (id uuid, van_name text, driver_name text, lat double precision, lng double precision, created_at timestamptz, resolved_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query
    select h.id, v.name, p.display_name,
           extensions.st_y(h.location::extensions.geometry), extensions.st_x(h.location::extensions.geometry), h.created_at, h.resolved_at
    from public.help_alerts h join public.vans v on v.id = h.van_id join public.profiles p on p.id = h.created_by
    order by h.resolved_at nulls first, h.created_at desc limit 50;
end $$;

create or replace function public.admin_resolve_help(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  update public.help_alerts set resolved_at = now() where id = p_id and resolved_at is null;
end $$;

-- ---------------------------------------------------------------------------
-- Who may call what: nobody logged out; every function checks the caller itself.
do $$
declare f text;
begin
  foreach f in array array[
    'public.flag_on(text)', 'public.admin_set_flag(text, uuid, boolean)', 'public.admin_flags()',
    'public.live_status()', 'public.start_live_trial()', 'public.rate_van(uuid, integer, text[])',
    'public.vans_near(uuid, integer)', 'public.request_seat(uuid, uuid)', 'public.request_van(uuid)',
    'public.request_progress(uuid)', 'public.withdraw_van_request(uuid)', 'public.admin_van_requests()',
    'public.set_van_fee(uuid, integer, integer)', 'public.mark_fee_paid(uuid, boolean)', 'public.van_fees(uuid)',
    'public.child_fees(uuid)', 'public.send_help_alert(uuid)', 'public.admin_help_alerts()', 'public.admin_resolve_help(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
grant execute on all functions in schema private to authenticated, service_role;
