-- "Join the pilot" on pohnch.pk (website v16).
-- pilot_interest: one row per sign-up (parent or driver, area, school, children, does the driver have a
--   smartphone, an optional WhatsApp number). Written only by the `interest` Edge Function with the
--   service key; apps and anonymous users can't read or write it; the Pohnch team reads it on the
--   admin page. WhatsApp numbers are removed after 90 days. The visitor's IP is never stored, only
--   a salted hash used to allow at most 5 sign-ups a day from one place.
-- site_doubts: how many times each of the six "honest answers" was opened, per day. Counts only.
-- interest_summary(): what the website may show publicly: families per area (only areas with 3 or
--   more) and the pilot numbers (only once there are 3 vans and 20 trips tracked end to end).

create table public.pilot_interest (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  role text not null check (role in ('parent', 'driver')),
  area text not null check (area ~ '^[a-zA-Z0-9]{2,20}$'),
  school text check (char_length(school) <= 80),
  kids smallint check (kids between 1 and 6),
  driver_phone text check (driver_phone in ('yes', 'no', 'unknown')),
  whatsapp text check (whatsapp ~ '^\+923[0-9]{9}$'),
  lang text not null default 'en' check (lang in ('ur', 'en')),
  ip_hash text not null check (char_length(ip_hash) = 64),
  contacted_at timestamptz
);
create index pilot_interest_ip_day on public.pilot_interest (ip_hash, created_at);
alter table public.pilot_interest enable row level security;
revoke all on public.pilot_interest from public, anon, authenticated;
grant select, update (contacted_at) on public.pilot_interest to authenticated;
create policy pilot_interest_team_read on public.pilot_interest for select to authenticated using (private.is_admin());
create policy pilot_interest_team_mark on public.pilot_interest for update to authenticated using (private.is_admin()) with check (private.is_admin());

create table public.site_doubts (
  day date not null,
  n smallint not null check (n between 1 and 6),
  opens integer not null default 0,
  primary key (day, n)
);
alter table public.site_doubts enable row level security;
revoke all on public.site_doubts from public, anon, authenticated;
grant select on public.site_doubts to authenticated;
create policy site_doubts_team_read on public.site_doubts for select to authenticated using (private.is_admin());

-- Saves one sign-up. Returns 'ok', or 'limited' when this place already sent 5 today.
create or replace function public.interest_add(p_role text, p_area text, p_school text, p_kids integer, p_driver_phone text,
                                              p_whatsapp text, p_lang text, p_ip_hash text) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.pilot_interest where ip_hash = p_ip_hash and created_at > now() - interval '1 day') >= 5 then
    return 'limited';
  end if;
  insert into public.pilot_interest (role, area, school, kids, driver_phone, whatsapp, lang, ip_hash)
  values (p_role, p_area, nullif(btrim(p_school), ''), p_kids, p_driver_phone, p_whatsapp, coalesce(p_lang, 'en'), p_ip_hash);
  return 'ok';
end $$;

-- Counts one opening of honest answer n (1-6) today (Karachi date).
create or replace function public.interest_doubt(p_n integer) returns void
language sql security definer set search_path = '' as $$
  insert into public.site_doubts (day, n, opens) values (private.karachi_today(), p_n, 1)
  on conflict (day, n) do update set opens = public.site_doubts.opens + 1;
$$;

-- What the website may show: area counts from 3 families, and pilot numbers once they mean something.
create or replace function public.interest_summary() returns jsonb
language sql stable security definer set search_path = '' as $$
  with areas as (
    select area, count(*)::int as n from public.pilot_interest where role = 'parent' and area <> 'other' group by area having count(*) >= 3
  ), nums as (
    select (select count(*) from public.vans where verified_at is not null and switched_off_at is null)::int as vans,
           (select count(*) from public.trips t where not t.is_practice and t.status <> 'cancelled' and private.trip_tracked(t.id))::int as trips,
           coalesce((select sum(sent) from public.push_stats), 0)::int as alerts
  )
  select jsonb_build_object(
    'areas', coalesce((select jsonb_object_agg(area, n) from areas), '{}'::jsonb),
    'proof', (select case when vans >= 3 and trips >= 20 then jsonb_build_object('vans', vans, 'trips', trips, 'alerts', alerts) end from nums)
  );
$$;

revoke all on function public.interest_add(text, text, text, integer, text, text, text, text), public.interest_doubt(integer), public.interest_summary() from public, anon, authenticated;
grant execute on function public.interest_add(text, text, text, integer, text, text, text, text), public.interest_doubt(integer), public.interest_summary() to service_role;

-- The admin page's list of sign-ups (newest first) and the honest-answer counts of the last 30 days.
create or replace function public.admin_interest() returns setof public.pilot_interest
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query select * from public.pilot_interest order by created_at desc limit 300;
end $$;
create or replace function public.admin_doubts() returns table (n smallint, opens bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query select d.n, sum(d.opens)::bigint from public.site_doubts d where d.day > private.karachi_today() - 30 group by d.n order by d.n;
end $$;
revoke all on function public.admin_interest(), public.admin_doubts() from public, anon;
grant execute on function public.admin_interest(), public.admin_doubts() to authenticated;

-- WhatsApp numbers are kept 90 days, then removed (the rest of the row stays for the area counts).
create or replace function private.forget_old_interest_numbers() returns void
language sql security definer set search_path = '' as $$
  update public.pilot_interest set whatsapp = null where whatsapp is not null and created_at < now() - interval '90 days';
$$;
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('forget-old-interest-numbers', '20 22 * * *', 'select private.forget_old_interest_numbers()');
  end if;
end $$;
