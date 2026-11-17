-- Pricing v2 (Nov 2026): Pohnch Plus. Families pay from day one; there is no free tier and no free
-- month. The first month is discounted (Rs 99, never 0), once per phone number and once per seat
-- (child + van + stop). Drivers never pay; they earn a bonus per paying child when the van tracks its
-- trips. Replaces the v10 "Pohnch Live with a free month" (live_entitlements, start_live_trial).
--
-- Everything that charges or gates is behind a new switch, 'billing' (app_flags), for everyone or one
-- van at a time. While it is off, the pilot works exactly as before. When it is on for a van, a family
-- on that van gets alerts, the live map and the Live Activity only for a child with a paid plan:
--   * pushes: push_recipients, dayoff_recipients, notice_recipients and live_activity_targets skip them;
--   * reads: private.follows() (the rule behind trips, events, positions, days off and notices) is
--     true only for a paid child, so the map and timeline stay empty too.
-- No money is taken here: payments are recorded by the team (cash or bank transfer in the pilot) or,
-- later, by a Play Billing server function. Only hashes are kept for intro claims, never the phone.

-- ---------------------------------------------------------------- 1. the switch
alter table public.app_flags drop constraint app_flags_key_check;
alter table public.app_flags add constraint app_flags_key_check check (key in ('stage2', 'billing'));

create or replace function private.billing_on_van(p_van uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_flags where key = 'billing' and enabled and (van_id is null or van_id = p_van))
$$;

-- On for me: for everyone, or for a van I drive or one of my children is on (or asked for).
create or replace function private.billing_on_me() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_flags where key = 'billing' and enabled and van_id is null)
      or exists (
        select 1 from public.app_flags f
        where f.key = 'billing' and f.enabled and f.van_id is not null
          and (exists (select 1 from public.vans v where v.id = f.van_id and v.driver_id = auth.uid())
               or exists (select 1 from public.memberships m
                          join public.children c on c.id = m.child_id
                          join public.family_members fm on fm.family_id = c.family_id
                          where m.van_id = f.van_id and m.status in ('pending', 'approved') and fm.user_id = auth.uid()))
      )
$$;

create or replace function public.flag_on(p_key text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case p_key when 'stage2' then private.stage2_on() when 'billing' then private.billing_on_me() else false end
$$;

-- ---------------------------------------------------------------- 2. plans
-- One row per child: the plan paying for them now. Written only by the functions below.
create table public.subscriptions (
  child_id uuid primary key references public.children (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  plan text not null check (plan in ('intro', 'monthly', 'term', 'year', 'founding', 'school')),
  source text not null check (source in ('play', 'school', 'founding', 'manual')),
  price integer not null check (price between 1 and 100000), -- never zero: nothing is free
  paid_until date not null,
  intro_at date,
  store_ref_hash text unique, -- a store purchase, hashed (Play Billing, later)
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy subscriptions_read on public.subscriptions for select to authenticated using (private.in_family(family_id) or private.is_admin());
revoke insert, update, delete, truncate on public.subscriptions from authenticated;

-- Who has had the Rs 99 intro month: a hashed phone number, or a hashed seat. No rows are readable.
create table public.intro_claims (
  kind text not null check (kind in ('phone', 'seat')),
  hash text not null check (length(hash) = 64),
  claimed_at timestamptz not null default now(),
  primary key (kind, hash)
);
alter table public.intro_claims enable row level security;
revoke all on public.intro_claims from authenticated, anon;

-- The pilot's price test: one monthly price per van (never two prices inside one van), and the
-- founding-family price for the pilot vans.
create table public.price_tests (
  van_id uuid primary key references public.vans (id) on delete cascade,
  monthly integer not null check (monthly in (249, 349, 449)),
  founding boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.price_tests enable row level security;
create policy price_tests_read on public.price_tests for select to authenticated using (private.is_admin());
revoke insert, update, delete, truncate on public.price_tests from authenticated;

-- The driver's bonus, one row per van per closed month (Rs 40 a paying child, if 80% of trips tracked).
create table public.driver_bonus (
  van_id uuid not null references public.vans (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  paying_children integer not null check (paying_children >= 0),
  tracked_pct integer check (tracked_pct between 0 and 100),
  amount integer not null check (amount >= 0),
  paid_at timestamptz,
  primary key (van_id, month)
);
alter table public.driver_bonus enable row level security;
create policy driver_bonus_read on public.driver_bonus for select to authenticated using (private.drives(van_id) or private.is_admin());
revoke insert, update, delete, truncate on public.driver_bonus from authenticated;

-- ---------------------------------------------------------------- 3. who gets alerts
create or replace function private.child_paid(p_child uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.subscriptions s where s.child_id = p_child and private.karachi_today() <= s.paid_until + 3)
$$;

/** True when this child's family hears about this van: billing is off for the van, or the child is paid. */
create or replace function private.alerts_for(p_child uuid, p_van uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select not private.billing_on_van(p_van) or private.child_paid(p_child)
$$;

-- Following a van now needs a child with alerts on it (no change while billing is off).
create or replace function private.follows(p_van uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    join public.vans v on v.id = m.van_id
    join public.children c on c.id = m.child_id
    join public.family_members fm on fm.family_id = c.family_id
    where m.van_id = p_van and m.status = 'approved' and fm.user_id = auth.uid()
      and v.verified_at is not null and v.switched_off_at is null
      and private.alerts_for(m.child_id, m.van_id)
  )
$$;

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
    and private.alerts_for(c.id, v.id)
    and (p_step is null or np.user_id is null or not (p_step = any (np.off_steps)))
    and (
      (p_children is not null and c.id = any (p_children))
      or (p_children is null and not private.off_for(c.id, t.service_date, t.kind))
    )
$$;

create or replace function public.dayoff_recipients(p_van uuid)
returns table (first_name text, token text, lang text, driver_name text, sound boolean)
language sql stable security definer set search_path = '' as $$
  select c.first_name, pt.token, pr.lang, dp.display_name, coalesce(np.sound, true)
  from public.vans v
  join public.profiles dp on dp.id = v.driver_id
  join public.memberships m on m.van_id = v.id and m.status = 'approved'
  join public.children c on c.id = m.child_id
  join public.family_members fm on fm.family_id = c.family_id
  join public.push_tokens pt on pt.user_id = fm.user_id
  join public.profiles pr on pr.id = fm.user_id
  left join public.notification_prefs np on np.user_id = fm.user_id
  where v.id = p_van and v.verified_at is not null and v.switched_off_at is null
    and private.alerts_for(c.id, v.id)
$$;

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
    and private.alerts_for(c.id, v.id)
  union
  select distinct pt.token, pr.lang, true
  from public.vans v
  join public.push_tokens pt on pt.user_id = v.driver_id
  join public.profiles pr on pr.id = v.driver_id
  where (p_van is null or v.id = p_van) and v.verified_at is not null and v.switched_off_at is null
$$;

create or replace function public.live_activity_targets(p_trip uuid, p_force boolean default false)
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
    and private.alerts_for(c.id, v.id)
    and (p_force or la.last_pushed_at is null or la.last_pushed_at < now() - interval '50 seconds')
$$;

-- ---------------------------------------------------------------- 4. what a family sees and pays
create or replace function private.sha(p text) returns text
language sql immutable set search_path = '' as $$ select encode(extensions.digest(p, 'sha256'), 'hex') $$;

create or replace function private.seat_hash(p_child uuid) returns text
language sql stable security definer set search_path = '' as $$
  select private.sha(lower(c.first_name) || ':' || m.van_id::text || ':' || coalesce(m.stop_id::text, ''))
  from public.children c
  join public.memberships m on m.child_id = c.id and m.status in ('pending', 'approved')
  where c.id = p_child
  limit 1
$$;

-- The family owner's phone, hashed (the phone number itself never leaves auth.users).
create or replace function private.owner_phone_hash(p_family uuid) returns text
language sql stable security definer set search_path = '' as $$
  select private.sha(u.phone)
  from public.family_members fm join auth.users u on u.id = fm.user_id
  where fm.family_id = p_family and fm.is_owner and u.phone is not null
  limit 1
$$;

create or replace function private.monthly_price(p_van uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce((select monthly from public.price_tests where van_id = p_van), 349)
$$;

/** My children and their plans: what to show on the Plans screen. No phone numbers, no hashes. */
create or replace function public.my_plans()
returns table (child_id uuid, first_name text, van_id uuid, plan text, paid_until date, state text,
               monthly integer, founding boolean, intro_allowed boolean, billing boolean)
language sql stable security definer set search_path = '' as $$
  select c.id, c.first_name, m.van_id, s.plan, s.paid_until,
         case when s.child_id is null then 'none'
              when private.karachi_today() <= s.paid_until then 'active'
              when private.karachi_today() <= s.paid_until + 3 then 'grace'
              else 'ended' end,
         case when coalesce(pt.founding, false) then 199 else private.monthly_price(m.van_id) end,
         coalesce(pt.founding, false),
         s.intro_at is null
           and not exists (select 1 from public.intro_claims ic where ic.kind = 'phone' and ic.hash = private.owner_phone_hash(c.family_id))
           and not exists (select 1 from public.intro_claims ic where ic.kind = 'seat' and ic.hash = private.seat_hash(c.id)),
         m.van_id is not null and private.billing_on_van(m.van_id)
  from public.children c
  join public.family_members fm on fm.family_id = c.family_id and fm.user_id = auth.uid()
  left join public.memberships m on m.child_id = c.id and m.status in ('pending', 'approved')
  left join public.subscriptions s on s.child_id = c.id
  left join public.price_tests pt on pt.van_id = m.van_id
  order by c.first_name
$$;

-- Records a payment for one child. Shared by the team's form and (later) the Play Billing function.
-- The intro month is refused once the phone or the seat has had one; a price of 0 is refused by the table.
create or replace function private.record_payment(p_child uuid, p_plan text, p_source text, p_price integer, p_days integer, p_ref_hash text)
returns date language plpgsql security definer set search_path = '' as $$
declare
  fam uuid;
  ph text;
  seat text;
  until_d date;
begin
  select family_id into fam from public.children where id = p_child;
  if fam is null then raise exception 'no_child'; end if;
  if p_days not between 1 and 400 then raise exception 'bad_days'; end if;
  if p_plan = 'intro' then
    ph := private.owner_phone_hash(fam);
    seat := private.seat_hash(p_child);
    if exists (select 1 from public.subscriptions where child_id = p_child and intro_at is not null)
       or exists (select 1 from public.intro_claims where (kind = 'phone' and hash = ph) or (kind = 'seat' and hash = seat)) then
      raise exception 'intro_used';
    end if;
    if ph is not null then insert into public.intro_claims (kind, hash) values ('phone', ph) on conflict do nothing; end if;
    if seat is not null then insert into public.intro_claims (kind, hash) values ('seat', seat) on conflict do nothing; end if;
  end if;
  insert into public.subscriptions (child_id, family_id, plan, source, price, paid_until, intro_at, store_ref_hash)
  values (p_child, fam, p_plan, p_source, p_price, private.karachi_today() - 1 + p_days,
          case when p_plan = 'intro' then private.karachi_today() end, p_ref_hash)
  on conflict (child_id) do update set
    plan = excluded.plan, source = excluded.source, price = excluded.price,
    paid_until = greatest(public.subscriptions.paid_until, private.karachi_today() - 1) + p_days,
    intro_at = coalesce(public.subscriptions.intro_at, excluded.intro_at),
    store_ref_hash = coalesce(excluded.store_ref_hash, public.subscriptions.store_ref_hash),
    updated_at = now()
  returning paid_until into until_d;
  return until_d;
end $$;

/** The team records a payment taken outside the app (pilot: cash or bank transfer). */
create or replace function public.admin_record_payment(p_child uuid, p_plan text, p_price integer, p_days integer) returns date
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return private.record_payment(p_child, p_plan, case when p_plan = 'founding' then 'founding' else 'manual' end, p_price, p_days, null);
end $$;

/** The server records a store purchase it has verified (Play Billing function, later). */
create or replace function public.billing_record_payment(p_child uuid, p_plan text, p_price integer, p_days integer, p_ref_hash text) returns date
language sql security definer set search_path = '' as $$
  select private.record_payment(p_child, p_plan, 'play', p_price, p_days, p_ref_hash)
$$;

/** The team sets a van's test price (249 / 349 / 449) and whether its families get the founding price. */
create or replace function public.admin_set_price_test(p_van uuid, p_monthly integer, p_founding boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  insert into public.price_tests (van_id, monthly, founding) values (p_van, p_monthly, p_founding)
  on conflict (van_id) do update set monthly = excluded.monthly, founding = excluded.founding, updated_at = now();
end $$;

-- ---------------------------------------------------------------- 5. drivers
/** The driver's riders who are paid (or everyone while billing is off for the van). First names stay in ridersOf. */
create or replace function public.van_paid_children(p_van uuid)
returns table (child_id uuid, paid boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.drives(p_van) then raise exception 'not_your_van'; end if;
  return query
  select m.child_id, private.alerts_for(m.child_id, p_van)
  from public.memberships m where m.van_id = p_van and m.status = 'approved';
end $$;

/** This month so far, and the closed months: paying children, tracked %, the bonus. */
create or replace function public.my_bonus()
returns table (month date, paying_children integer, tracked_pct integer, amount integer, paid boolean, open boolean)
language plpgsql stable security definer set search_path = '' as $$
declare
  v uuid;
  n int;
  pct int;
begin
  select id into v from public.vans where driver_id = auth.uid() limit 1;
  if v is null then return; end if;
  select count(*) into n from public.memberships m where m.van_id = v and m.status = 'approved' and private.child_paid(m.child_id);
  pct := private.van_reliability(v);
  return query
  select date_trunc('month', private.karachi_today())::date, n, pct,
         case when pct is not null and pct >= 80 then n * 40 else 0 end, false, true
  union all
  select b.month, b.paying_children, b.tracked_pct, b.amount, b.paid_at is not null, false
  from public.driver_bonus b where b.van_id = v
  order by 1 desc;
end $$;

/** The team closes a month: one bonus row per van with billing on. Run once, early in the next month. */
create or replace function public.admin_close_bonus_month(p_month date) returns integer
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  if extract(day from p_month) <> 1 then raise exception 'not_month_start'; end if;
  insert into public.driver_bonus (van_id, month, paying_children, tracked_pct, amount)
  select v.id, p_month, x.n, x.pct, case when x.pct is not null and x.pct >= 80 then x.n * 40 else 0 end
  from public.vans v
  cross join lateral (
    select (select count(*)::int from public.memberships m where m.van_id = v.id and m.status = 'approved' and private.child_paid(m.child_id)) as n,
           private.van_reliability(v.id) as pct
  ) x
  where private.billing_on_van(v.id)
  on conflict (van_id, month) do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.admin_mark_bonus_paid(p_van uuid, p_month date) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  update public.driver_bonus set paid_at = now() where van_id = p_van and month = p_month and paid_at is null;
end $$;

-- ---------------------------------------------------------------- 6. the team's money numbers
/** Paying children, by plan; money in a month (monthly-equivalent); intro → paid; bonuses due. */
create or replace function public.admin_revenue() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  today date := private.karachi_today();
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return jsonb_build_object(
    'paying', (select count(*) from public.subscriptions where today <= paid_until + 3),
    'grace', (select count(*) from public.subscriptions where today > paid_until and today <= paid_until + 3),
    'byPlan', coalesce((select jsonb_object_agg(plan, n) from (select plan, count(*) n from public.subscriptions where today <= paid_until + 3 group by plan) p), '{}'::jsonb),
    'monthly', coalesce((select sum(case plan when 'term' then price / 5 when 'year' then price / 12 else price end) from public.subscriptions where today <= paid_until + 3), 0),
    'introStarted', (select count(*) from public.subscriptions where intro_at is not null),
    'introPaid', (select count(*) from public.subscriptions where intro_at is not null and plan <> 'intro' and today <= paid_until + 3),
    'bonusDue', coalesce((select sum(amount) from public.driver_bonus where paid_at is null), 0)
  );
end $$;

/** For the team's payment form: a van's riders (first names only) and where each plan stands. */
create or replace function public.admin_van_riders(p_van uuid)
returns table (child_id uuid, first_name text, plan text, paid_until date)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query
  select c.id, c.first_name, s.plan, s.paid_until
  from public.memberships m
  join public.children c on c.id = m.child_id
  left join public.subscriptions s on s.child_id = c.id
  where m.van_id = p_van and m.status = 'approved'
  order by c.first_name;
end $$;

-- ---------------------------------------------------------------- 7. the old free month goes
drop function if exists public.start_live_trial();
drop function if exists public.live_status();
drop table if exists public.live_entitlements;

-- ---------------------------------------------------------------- 8. who may call what
do $$
declare f text;
begin
  foreach f in array array[
    'public.my_plans()', 'public.admin_record_payment(uuid, text, integer, integer)',
    'public.admin_set_price_test(uuid, integer, boolean)', 'public.van_paid_children(uuid)', 'public.my_bonus()',
    'public.admin_close_bonus_month(date)', 'public.admin_mark_bonus_paid(uuid, date)', 'public.admin_revenue()',
    'public.admin_van_riders(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
revoke all on function public.billing_record_payment(uuid, text, integer, integer, text) from public, anon, authenticated;
grant execute on function public.billing_record_payment(uuid, text, integer, integer, text) to service_role;
revoke all on function public.push_recipients(uuid, uuid[], text) from public, anon, authenticated;
grant execute on function public.push_recipients(uuid, uuid[], text) to service_role;
revoke all on function public.dayoff_recipients(uuid) from public, anon, authenticated;
grant execute on function public.dayoff_recipients(uuid) to service_role;
revoke all on function public.notice_recipients(uuid) from public, anon, authenticated;
grant execute on function public.notice_recipients(uuid) to service_role;
revoke all on function public.live_activity_targets(uuid, boolean) from public, anon, authenticated;
grant execute on function public.live_activity_targets(uuid, boolean) to service_role;
-- The rules used inside access policies must be callable by the signed-in user's queries.
do $$
declare f text;
begin
  foreach f in array array[
    'private.billing_on_van(uuid)', 'private.billing_on_me()', 'private.child_paid(uuid)', 'private.alerts_for(uuid, uuid)',
    'private.follows(uuid)', 'private.sha(text)', 'private.seat_hash(uuid)', 'private.owner_phone_hash(uuid)', 'private.monthly_price(uuid)'
  ] loop
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;
-- Payments are written only through admin_record_payment (the team) and billing_record_payment (the server).
revoke all on function private.record_payment(uuid, text, text, integer, integer, text) from public, anon, authenticated;
grant execute on function private.record_payment(uuid, text, text, integer, integer, text) to service_role;
