-- iPhone Live Activity tokens (v7). Each running Live Activity has its own push token ("update"),
-- and iOS also gives a per-phone token to start one remotely ("start"). The server uses them to update
-- the lock-screen card while the phone is locked, and to start it when the van leaves.
-- A token is only kept for the person who owns it; nobody else can read it.

create table public.live_activity_tokens (
  token text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('update', 'start')),
  -- For "update" tokens: the trip and child the card is about (null for "start" tokens).
  trip_id uuid references public.trips (id) on delete cascade,
  child_id uuid references public.children (id) on delete cascade,
  -- When the server last pushed to it (it sends at most about once a minute per card).
  last_pushed_at timestamptz,
  created_at timestamptz not null default now(),
  check ((kind = 'update') = (trip_id is not null))
);

create index live_activity_tokens_trip on public.live_activity_tokens (trip_id) where trip_id is not null;

alter table public.live_activity_tokens enable row level security;

-- You may save a token for yourself, and only about a child of yours on a trip of a van you follow.
create policy live_activity_tokens_insert_own on public.live_activity_tokens for insert to authenticated
  with check (
    user_id = auth.uid()
    and (child_id is null or private.my_child(child_id))
    and (trip_id is null or exists (select 1 from public.trips t where t.id = trip_id and private.follows(t.van_id)))
  );
create policy live_activity_tokens_read_own on public.live_activity_tokens for select to authenticated
  using (user_id = auth.uid());
create policy live_activity_tokens_delete_own on public.live_activity_tokens for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.live_activity_tokens from anon;
grant select, delete on public.live_activity_tokens to authenticated;
grant insert (token, kind, trip_id, child_id) on public.live_activity_tokens to authenticated;

-- For the server: the cards to update for a trip (one row per Live Activity), with what it needs to
-- fill them, skipping cards pushed in the last 50 seconds unless p_force (a step just happened).
create or replace function public.live_activity_targets(p_trip uuid, p_force boolean default false)
returns table (token text, child_id uuid, first_name text, lang text, stop_lat double precision, stop_lng double precision, driver_name text)
language sql stable security definer set search_path = '' as $$
  select la.token, c.id, c.first_name, pr.lang,
         extensions.st_y(s.location::extensions.geometry), extensions.st_x(s.location::extensions.geometry), dp.display_name
  from public.live_activity_tokens la
  join public.trips t on t.id = la.trip_id and t.status = 'running' and not t.is_practice
  join public.vans v on v.id = t.van_id and v.switched_off_at is null
  join public.profiles dp on dp.id = v.driver_id
  join public.children c on c.id = la.child_id
  join public.memberships m on m.child_id = c.id and m.van_id = v.id and m.status = 'approved'
  left join public.stops s on s.id = m.stop_id
  join public.profiles pr on pr.id = la.user_id
  where la.trip_id = p_trip and la.kind = 'update'
    and (p_force or la.last_pushed_at is null or la.last_pushed_at < now() - interval '50 seconds')
$$;

create or replace function public.mark_activity_pushed(p_tokens text[], p_dead text[] default '{}') returns void
language sql security definer set search_path = '' as $$
  update public.live_activity_tokens set last_pushed_at = now() where token = any (p_tokens);
  delete from public.live_activity_tokens where token = any (p_dead);
$$;

revoke all on function public.live_activity_targets(uuid, boolean) from public, anon, authenticated;
revoke all on function public.mark_activity_pushed(text[], text[]) from public, anon, authenticated;
grant execute on function public.live_activity_targets(uuid, boolean) to service_role;
grant execute on function public.mark_activity_pushed(text[], text[]) to service_role;
