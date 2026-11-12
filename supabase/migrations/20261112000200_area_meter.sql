-- v19: the live area meter on pohnch.pk. interest_summary() gains `meter`: for each area with sign-ups,
-- families as a band ('few' 1-2, '3-9', '10+'), whether a driver is interested ('none'/'yes'), a status
-- (a van can start at 8 families and a driver) and how many more families are needed, as a band.
-- Exact numbers never leave the database through this; schools are never counted. The rule mirrors
-- areaMeter() in packages/core/src/interest.ts (tests keep the two equal).
create or replace function private.family_band(n integer) returns text
language sql immutable set search_path = '' as $$
  select case when n <= 0 then null when n < 3 then 'few' when n < 10 then '3-9' else '10+' end;
$$;

create or replace function public.interest_summary() returns jsonb
language sql stable security definer set search_path = '' as $$
  with areas as (
    select area, count(*)::int as n from public.pilot_interest where role = 'parent' and area <> 'other' group by area having count(*) >= 3
  ), counts as (
    select area, count(*) filter (where role = 'parent')::int as f, count(*) filter (where role = 'driver')::int as d
    from public.pilot_interest where role in ('parent', 'driver') and area <> 'other' group by area
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
