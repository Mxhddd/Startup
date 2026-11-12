-- v20 security overhaul (database part).
-- 1. (next migration) The Pohnch team's admin rights need a second login step (an authenticator app).
-- 2. The public area meter keeps the "3 or more families" promise: smaller areas are left out entirely, so
--    nobody can be singled out, and the status can't be nudged into revealing an exact count.
-- 3. Sign-ups: at most one live row per WhatsApp number (a repeat updates it), 5 a day from one place (as
--    before), and at most 60 an hour in total, so a flood can't swamp the team's list or the meter.
-- 4. The visitor's IP hash is only needed for the daily limit, so it is forgotten after a day.
-- 5. The clean-up jobs are (re)scheduled here (pg_cron is switched on if needed), so data is never quietly
--    kept longer than the privacy policy says. The live project is checked after deploying.
-- 6. Clean-up functions can't be called by logged-in users; the admin list no longer returns the IP hash.

-- 1 (the admin second step) is in 20261113000200_admin_two_step.sql, applied once the team has enrolled.

-- 2 ----------------------------------------------------------------------------------------------------
create or replace function public.interest_summary() returns jsonb
language sql stable security definer set search_path = '' as $$
  with areas as (
    select area, count(*)::int as n from public.pilot_interest where role = 'parent' and area <> 'other' group by area having count(*) >= 3
  ), counts as (
    select area, count(*) filter (where role = 'parent')::int as f, count(*) filter (where role = 'driver')::int as d
    from public.pilot_interest where role in ('parent', 'driver') and area <> 'other' group by area
    having count(*) filter (where role = 'parent') >= 3
  ), nums as (
    select (select count(*) from public.vans where verified_at is not null and switched_off_at is null)::int as vans,
           (select count(*) from public.trips t where not t.is_practice and t.status <> 'cancelled' and private.trip_tracked(t.id))::int as trips,
           coalesce((select sum(sent) from public.push_stats), 0)::int as alerts
  )
  select jsonb_build_object(
    'areas', coalesce((select jsonb_object_agg(area, n) from areas), '{}'::jsonb),
    'meter', coalesce((select jsonb_object_agg(area, jsonb_build_object(
        'f', private.family_band(f),
        'd', case when d > 0 then 'yes' else 'none' end,
        's', case when f >= 8 and d > 0 then 'ready' when f >= 8 then 'needs-driver' when d > 0 then 'needs-families' else 'forming' end,
        'm', case when f >= 8 then null when 8 - f <= 3 then 'few' else 'several' end)) from counts), '{}'::jsonb),
    'proof', (select case when vans >= 3 and trips >= 20 then jsonb_build_object('vans', vans, 'trips', trips, 'alerts', alerts) end from nums)
  );
$$;
revoke all on function public.interest_summary() from public, anon, authenticated;
grant execute on function public.interest_summary() to service_role;

-- 3 + 4 ------------------------------------------------------------------------------------------------
alter table public.pilot_interest alter column ip_hash drop not null;
create index if not exists pilot_interest_whatsapp on public.pilot_interest (whatsapp, created_at) where whatsapp is not null;
create index if not exists pilot_interest_created on public.pilot_interest (created_at);

create or replace function public.interest_add(p_role text, p_area text, p_school text, p_kids integer, p_driver_phone text,
                                              p_whatsapp text, p_lang text, p_ip_hash text) returns text
language plpgsql security definer set search_path = '' as $$
declare existing uuid;
begin
  if (select count(*) from public.pilot_interest where ip_hash = p_ip_hash and created_at > now() - interval '1 day') >= 5 then
    return 'limited';
  end if;
  if (select count(*) from public.pilot_interest where created_at > now() - interval '1 hour') >= 60 then
    return 'busy';
  end if;
  -- the same WhatsApp number again within 30 days: update that sign-up instead of adding another
  if p_whatsapp is not null then
    select id into existing from public.pilot_interest where whatsapp = p_whatsapp and created_at > now() - interval '30 days' order by created_at desc limit 1;
    if existing is not null then
      update public.pilot_interest set role = p_role, area = p_area, school = nullif(btrim(p_school), ''), kids = p_kids,
        driver_phone = p_driver_phone, lang = coalesce(p_lang, 'en') where id = existing;
      return 'ok';
    end if;
  end if;
  insert into public.pilot_interest (role, area, school, kids, driver_phone, whatsapp, lang, ip_hash)
  values (p_role, p_area, nullif(btrim(p_school), ''), p_kids, p_driver_phone, p_whatsapp, coalesce(p_lang, 'en'), p_ip_hash);
  return 'ok';
end $$;
revoke all on function public.interest_add(text, text, text, integer, text, text, text, text) from public, anon, authenticated;
grant execute on function public.interest_add(text, text, text, integer, text, text, text, text) to service_role;

create or replace function private.forget_old_interest_numbers() returns void
language sql security definer set search_path = '' as $$
  update public.pilot_interest set whatsapp = null where whatsapp is not null and created_at < now() - interval '90 days';
  update public.pilot_interest set ip_hash = null where ip_hash is not null and created_at < now() - interval '1 day';
$$;

-- 5 ----------------------------------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
      -- only the local test database lacks pg_cron; on Supabase it always exists (and the live project is
      -- checked after every deploy: select jobname from cron.job)
      raise notice 'pg_cron not available here: clean-up jobs not scheduled';
      return;
    end if;
    create extension pg_cron;
  end if;
  perform cron.unschedule(jobname) from cron.job where jobname in ('purge-old-positions', 'end-stale-trips', 'forget-old-interest-numbers');
  perform cron.schedule('purge-old-positions', '10 22 * * *', 'select private.purge_old_positions()');
  perform cron.schedule('end-stale-trips', '*/15 * * * *', 'select private.end_stale_trips()');
  perform cron.schedule('forget-old-interest-numbers', '20 * * * *', 'select private.forget_old_interest_numbers()');
end $$;

-- 6 ----------------------------------------------------------------------------------------------------
revoke all on function private.purge_old_positions(), private.end_stale_trips(), private.forget_old_interest_numbers() from public, anon, authenticated;

drop function if exists public.admin_interest();
create function public.admin_interest() returns table (
  id uuid, created_at timestamptz, role text, area text, school text, kids smallint, driver_phone text,
  whatsapp text, lang text, contacted_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query select p.id, p.created_at, p.role, p.area, p.school, p.kids, p.driver_phone, p.whatsapp, p.lang, p.contacted_at
    from public.pilot_interest p order by p.created_at desc limit 300;
end $$;
revoke all on function public.admin_interest() from public, anon;
grant execute on function public.admin_interest() to authenticated;
