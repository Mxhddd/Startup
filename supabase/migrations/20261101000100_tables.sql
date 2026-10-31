-- Pohnch stage 1: the tables.
-- Children are first names only: no gender, no photo, no phone. Locations come only from the driver
-- app during a trip. Trip dates are Karachi dates. Row-level security is switched on for every table
-- in the next migration.

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.trip_kind as enum ('morning', 'afternoon');
create type public.trip_status as enum ('running', 'ended', 'cancelled');
-- One step per meaning (design/BRAND.md). 'arriving' is automatic (near the stop); 'late' carries a reason.
create type public.trip_step as enum ('left', 'picked', 'arriving', 'reached_school', 'left_school', 'dropped', 'late');
create type public.membership_status as enum ('pending', 'approved', 'declined', 'left');
-- 'van': a driver invites families. 'driver': a parent invites their driver to Pohnch.
create type public.invite_kind as enum ('van', 'driver');

-- People. The phone number stays in auth.users; it is never copied here.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  lang text not null default 'ur' check (lang in ('ur', 'en')),
  created_at timestamptz not null default now()
);

-- The Pohnch team.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table public.vans (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 40),
  school_name text not null check (char_length(school_name) between 1 and 80),
  plate text check (char_length(plate) <= 16),
  verified_at timestamptz,      -- set by the Pohnch team after checking CNIC, licence and van papers
  switched_off_at timestamptz,  -- set by the Pohnch team to stop a van
  created_at timestamptz not null default now()
);
create index vans_driver_idx on public.vans (driver_id);

-- The driver's stops, in order.
create table public.stops (
  id uuid primary key default gen_random_uuid(),
  van_id uuid not null references public.vans (id) on delete cascade,
  position int not null check (position >= 1),
  label text not null check (char_length(label) between 1 and 40),
  location extensions.geography(point, 4326) not null,
  morning_time time,
  afternoon_time time,
  constraint stops_order unique (van_id, position) deferrable initially deferred
);

-- A family: the parent who signed up and up to 3 more people who follow the same children.
create table public.families (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.family_members (
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  is_owner boolean not null default false,
  added_at timestamptz not null default now(),
  primary key (family_id, user_id)
);
create index family_members_user_idx on public.family_members (user_id);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 30),
  school_name text not null check (char_length(school_name) between 1 and 80),
  home_location extensions.geography(point, 4326), -- placed by hand on the map; never from the phone's GPS
  created_at timestamptz not null default now()
);
create index children_family_idx on public.children (family_id);

-- A child riding a van. The driver approves; until then the family sees only that it is waiting.
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  van_id uuid not null references public.vans (id) on delete cascade,
  stop_id uuid references public.stops (id) on delete set null,
  status public.membership_status not null default 'pending',
  requested_by uuid not null references public.profiles (id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index memberships_one_active on public.memberships (child_id) where status in ('pending', 'approved');
create index memberships_van_idx on public.memberships (van_id) where status in ('pending', 'approved');

-- Invite links (pohnch.pk/i/<token>). Only the SHA-256 of the token is stored; the token itself never is.
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  kind public.invite_kind not null,
  van_id uuid references public.vans (id) on delete cascade,
  child_id uuid references public.children (id) on delete cascade,
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '30 days',
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check ((kind = 'van' and van_id is not null) or (kind = 'driver' and child_id is not null))
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  van_id uuid not null references public.vans (id) on delete cascade,
  service_date date not null, -- the Karachi school day
  kind public.trip_kind not null,
  status public.trip_status not null default 'running',
  is_practice boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create unique index trips_one_real_run on public.trips (van_id, service_date, kind) where not is_practice and status <> 'cancelled';
create index trips_running_idx on public.trips (van_id) where status = 'running';

-- Every tap and automatic step. client_id is made on the phone, so a tap sent twice is stored once.
create table public.trip_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  child_id uuid references public.children (id) on delete cascade, -- null for van-wide steps
  step public.trip_step not null,
  reason text check (reason in ('traffic', 'breakdown', 'roadClosed')),
  client_id uuid not null unique,
  created_by uuid references public.profiles (id), -- null when automatic ("arriving")
  happened_at timestamptz not null,                 -- when it happened on the phone (may be queued offline)
  created_at timestamptz not null default now(),
  undone_at timestamptz,
  check ((step = 'late') = (reason is not null))
);
create index trip_events_trip_idx on public.trip_events (trip_id, happened_at);

-- The van's position, only while a trip runs. Deleted after 30 days.
create table public.positions (
  id bigint generated always as identity primary key,
  trip_id uuid not null references public.trips (id) on delete cascade,
  location extensions.geography(point, 4326) not null,
  heading real check (heading >= 0 and heading <= 360),
  speed real check (speed >= 0),
  recorded_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index positions_trip_idx on public.positions (trip_id, recorded_at desc);
create index positions_age_idx on public.positions (created_at);

-- "Aaj chutti": a child off for one school day.
create table public.absences (
  child_id uuid not null references public.children (id) on delete cascade,
  service_date date not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  primary key (child_id, service_date)
);

-- A whole-van day off, set by the driver.
create table public.van_days_off (
  van_id uuid not null references public.vans (id) on delete cascade,
  service_date date not null,
  created_at timestamptz not null default now(),
  primary key (van_id, service_date)
);

-- Where to send push notifications. Never readable from the apps.
create table public.push_tokens (
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null check (char_length(token) <= 200),
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

-- Live updates for the parent's map and timeline.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.trips, public.trip_events, public.positions;
  end if;
end $$;
