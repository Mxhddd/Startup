-- Launch fixes (24 Nov 2026), from testing the apps end to end:
--  1. Schools are a list, not free text. A van can serve several schools (van_schools), and school
--     drop-offs are stops of kind 'school'. vans.school_name stays as a read-only summary for old code.
--  2. A van's number plate is required from the app.
--  3. Drivers upload their papers (CNIC both sides, licence, van registration) for the team to check;
--     the files live in the private storage bucket 'driver-docs' and are deleted once the van is verified.
--  4. A contact WhatsApp number for anyone who signed in with Google (no phone on the account).
--  5. Invites also carry a short code to type after installing (the link is lost through the Play Store);
--     only its SHA-256 is stored, like the token. Families may ask to join a van before it is verified;
--     approving them still waits for the team's check.
--  6. Website sign-ups are linked to the app account with the same phone number, and the team sees one
--     pipeline per person and per school.

-- 1 ---------------------------------------------------------------------------------------------------- schools
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  short text check (short ~ '^[a-z0-9-]{2,20}$'),            -- for links like pohnch.pk/s/bcp
  area text check (char_length(area) <= 40),
  location extensions.geography(point, 4326),
  verified boolean not null default false,                    -- checked by the team; unverified ones are seen only by who added them
  pilot_goal int check (pilot_goal between 1 and 1000),       -- families needed for a school's pilot (BCP: 50)
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index schools_name_unique on public.schools (lower(name));
create unique index schools_short_unique on public.schools (short) where short is not null;
alter table public.schools enable row level security;
revoke all on public.schools from anon, authenticated;
grant select on public.schools to authenticated;
create policy schools_read on public.schools for select to authenticated
  using (verified or added_by = auth.uid() or private.is_admin());

create view public.school_points with (security_invoker = true) as
  select s.id, s.name, s.short, s.area, s.verified,
         extensions.st_y(s.location::extensions.geometry) as lat,
         extensions.st_x(s.location::extensions.geometry) as lng
  from public.schools s;
revoke all on public.school_points from anon;
grant select on public.school_points to authenticated;

-- "My school isn't listed": adds it for this person (the team checks it). Same name twice = the same row.
create or replace function public.add_school(p_name text, p_area text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare s uuid; n text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  if char_length(n) < 2 or char_length(n) > 80 then raise exception 'bad_school_name'; end if;
  select id into s from public.schools where lower(name) = lower(n);
  if s is not null then return s; end if;
  if (select count(*) from public.schools where added_by = auth.uid() and created_at > now() - interval '1 day') >= 5 then
    raise exception 'too_many';
  end if;
  insert into public.schools (name, area, added_by) values (n, nullif(btrim(coalesce(p_area, '')), ''), auth.uid()) returning id into s;
  return s;
end $$;
revoke all on function public.add_school(text, text) from public, anon;
grant execute on function public.add_school(text, text) to authenticated;

-- Where the school is: set by the team, or by the first driver who drops children there.
create or replace function public.set_school_location(p_school uuid, p_lat double precision, p_lng double precision) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  update public.schools set location = extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography
  where id = p_school and (location is null or private.is_admin());
end $$;
revoke all on function public.set_school_location(uuid, double precision, double precision) from public, anon;
grant execute on function public.set_school_location(uuid, double precision, double precision) to authenticated;

-- The starting list: well-known Karachi schools. Families and drivers add the rest; the team checks them.
insert into public.schools (name, short, area, verified, pilot_goal) values
  ('Beaconhouse PECHS', 'bcp', 'PECHS', true, 50)
on conflict do nothing;
insert into public.schools (name, area, verified) values
  ('Beaconhouse Clifton', 'Clifton', true), ('Beaconhouse Defence', 'DHA', true),
  ('Beaconhouse Gulshan', 'Gulshan-e-Iqbal', true), ('Beaconhouse North Nazimabad', 'North Nazimabad', true),
  ('The City School PAF Chapter', 'Shahrah-e-Faisal', true), ('The City School Gulshan', 'Gulshan-e-Iqbal', true),
  ('The City School North Nazimabad', 'North Nazimabad', true), ('The City School Clifton', 'Clifton', true),
  ('Karachi Grammar School Clifton', 'Clifton', true), ('Karachi Grammar School Saddar', 'Saddar', true),
  ('Generation''s School', 'DHA', true), ('Roots Millennium Schools', 'Clifton', true), ('Roots International Schools', 'PECHS', true),
  ('Habib Public School', 'Sultanabad', true), ('St. Patrick''s High School', 'Saddar', true),
  ('St. Joseph''s Convent School', 'Saddar', true), ('Convent of Jesus and Mary', 'Saddar', true),
  ('St. Michael''s Convent School', 'Clifton', true), ('Bay View High School', 'Clifton', true),
  ('Foundation Public School', 'DHA', true), ('The Lyceum School', 'Clifton', true), ('Nixor College', 'DHA', true),
  ('Bahria College Karsaz', 'Karsaz', true), ('Happy Home School', 'Clifton', true), ('DHA Public School', 'DHA', true),
  ('Defence Authority Creek College', 'DHA', true), ('Army Public School', 'Saddar', true),
  ('Cedar College', 'Clifton', true), ('Karachi American School', 'KDA Scheme 1', true),
  ('Mama Parsi Girls Secondary School', 'Saddar', true), ('BVS Parsi High School', 'Saddar', true),
  ('PECHS Girls School', 'PECHS', true), ('Aga Khan School', 'Garden', true), ('Highpoint School', 'PECHS', true),
  ('Headstart School', 'Clifton', true), ('Froebel''s International School', 'DHA', true),
  ('Southshore School', 'DHA', true), ('Westminster School and College', 'DHA', true)
on conflict do nothing;

-- Children name their school from the list; school_name stays as the copy everyone already reads.
alter table public.children add column school_id uuid references public.schools (id) on delete set null;
grant update (school_id) on public.children to authenticated;
grant insert (school_id) on public.children to authenticated;

-- A van serves one or more schools. vans.school_name becomes a summary kept up to date from this list.
create table public.van_schools (
  van_id uuid not null references public.vans (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete restrict,
  added_at timestamptz not null default now(),
  primary key (van_id, school_id)
);
alter table public.van_schools enable row level security;
revoke all on public.van_schools from anon, authenticated;
grant select, insert, delete on public.van_schools to authenticated;
create policy van_schools_read on public.van_schools for select to authenticated
  using (private.drives(van_id) or private.requested(van_id) or private.is_admin());
create policy van_schools_write on public.van_schools for insert to authenticated with check (private.drives(van_id));
create policy van_schools_delete on public.van_schools for delete to authenticated using (private.drives(van_id));

alter table public.vans alter column school_name drop not null;
alter table public.vans drop constraint if exists vans_school_name_check;
alter table public.vans add constraint vans_school_name_len check (school_name is null or char_length(school_name) <= 200);

create or replace function private.sync_van_school_name() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v uuid := coalesce(new.van_id, old.van_id);
begin
  update public.vans set school_name = (
    select left(string_agg(s.name, ' · ' order by vs.added_at, s.name), 200)
    from public.van_schools vs join public.schools s on s.id = vs.school_id where vs.van_id = v)
  where id = v;
  return null;
end $$;
create trigger van_schools_sync after insert or delete on public.van_schools
  for each row execute function private.sync_van_school_name();

-- Stops are a family's home stop or a school drop-off.
alter table public.stops add column kind text not null default 'home' check (kind in ('home', 'school'));
alter table public.stops add column school_id uuid references public.schools (id) on delete restrict;
alter table public.stops add constraint stops_school_needs_school check (kind = 'home' or school_id is not null);

create or replace view public.stop_points with (security_invoker = true) as
  select s.id, s.van_id, s.position, s.label, s.morning_time, s.afternoon_time,
         extensions.st_y(s.location::extensions.geometry) as lat,
         extensions.st_x(s.location::extensions.geometry) as lng,
         s.kind, s.school_id
  from public.stops s;

-- A school drop-off: the stop, plus the school on the van's list, plus the school's place if unknown.
create or replace function public.add_school_stop(p_van uuid, p_school uuid, p_lat double precision, p_lng double precision,
  p_morning time default null, p_afternoon time default null) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare s uuid; nm text;
begin
  select coalesce(short, name) into nm from public.schools where id = p_school;
  if nm is null then raise exception 'school_not_found'; end if;
  insert into public.stops (van_id, position, label, location, morning_time, afternoon_time, kind, school_id)
  values (p_van, coalesce((select max(position) from public.stops where van_id = p_van), 0) + 1, left(nm, 40),
          extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography, p_morning, p_afternoon, 'school', p_school)
  returning id into s;
  insert into public.van_schools (van_id, school_id) values (p_van, p_school) on conflict do nothing;
  perform public.set_school_location(p_school, p_lat, p_lng);
  return s;
end $$;
revoke all on function public.add_school_stop(uuid, uuid, double precision, double precision, time, time) from public, anon;
grant execute on function public.add_school_stop(uuid, uuid, double precision, double precision, time, time) to authenticated;

-- 2 ---------------------------------------------------------------------------------------------------- plate required
-- From the apps (a logged-in person) a van must have a plate; the team's and the tests' own writes are not affected.
create or replace function private.van_plate_required() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and (new.plate is null or char_length(btrim(new.plate)) < 2) then
    raise exception 'plate_required';
  end if;
  return new;
end $$;
create trigger vans_plate_required before insert or update of plate, name on public.vans
  for each row execute function private.van_plate_required();

-- 3 ---------------------------------------------------------------------------------------------------- driver papers
create table public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  van_id uuid not null references public.vans (id) on delete cascade,
  kind text not null check (kind in ('cnic_front', 'cnic_back', 'licence', 'van_registration')),
  path text check (path ~ '^[0-9a-f-]{36}/[a-z_]+-[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$'),  -- <driver id>/<kind>-<uuid>.<ext>
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text check (char_length(note) <= 200),
  uploaded_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (van_id, kind)
);
alter table public.driver_documents enable row level security;
revoke all on public.driver_documents from anon, authenticated;
grant select on public.driver_documents to authenticated;
create policy driver_documents_read on public.driver_documents for select to authenticated
  using (private.drives(van_id) or private.is_admin());

-- The driver tells us a file is uploaded (to their own folder); a new upload replaces the old one.
create or replace function public.submit_driver_document(p_van uuid, p_kind text, p_path text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare d uuid;
begin
  perform private.require_driver(auth.uid(), p_van);
  if split_part(p_path, '/', 1) <> auth.uid()::text then raise exception 'not_your_file'; end if;
  insert into public.driver_documents (van_id, kind, path) values (p_van, p_kind, p_path)
  on conflict (van_id, kind) do update set path = excluded.path, status = 'pending', note = null, uploaded_at = now(), decided_at = null
  returning id into d;
  return d;
end $$;
revoke all on function public.submit_driver_document(uuid, text, text) from public, anon;
grant execute on function public.submit_driver_document(uuid, text, text) to authenticated;

-- The team: the waiting papers, then approve or reject one (with a reason the driver sees).
create or replace function public.admin_driver_documents()
returns table (id uuid, van_id uuid, van_name text, plate text, driver_name text, phone text, contact text,
               kind text, path text, status text, note text, uploaded_at timestamptz, verified boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query
    select d.id, v.id, v.name, v.plate, p.display_name, u.phone::text, cp.phone, d.kind, d.path, d.status, d.note, d.uploaded_at, v.verified_at is not null
    from public.driver_documents d
    join public.vans v on v.id = d.van_id
    join public.profiles p on p.id = v.driver_id
    left join auth.users u on u.id = v.driver_id
    left join public.contact_phones cp on cp.user_id = v.driver_id
    order by v.verified_at is not null, d.uploaded_at desc;
end $$;

create or replace function public.admin_decide_document(p_doc uuid, p_approve boolean, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  update public.driver_documents set status = case when p_approve then 'approved' else 'rejected' end,
    note = case when p_approve then null else left(p_note, 200) end, decided_at = now()
  where id = p_doc;
end $$;

-- After the van is verified the files are no longer needed: the server deletes them and forgets the paths.
create or replace function public.van_document_paths(p_van uuid) returns setof text
language sql stable security definer set search_path = '' as $$
  select path from public.driver_documents where van_id = p_van and path is not null
$$;
create or replace function public.forget_van_documents(p_van uuid) returns void
language sql security definer set search_path = '' as $$
  update public.driver_documents set path = null where van_id = p_van
$$;
revoke all on function public.van_document_paths(uuid), public.forget_van_documents(uuid) from public, anon, authenticated;
grant execute on function public.van_document_paths(uuid), public.forget_van_documents(uuid) to service_role;

-- 4 ---------------------------------------------------------------------------------------------------- contact number
-- Only the person and the team read it. Google sign-in accounts have no phone, so the apps ask once.
create table public.contact_phones (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text not null check (phone ~ '^\+923[0-9]{9}$'),
  updated_at timestamptz not null default now()
);
alter table public.contact_phones enable row level security;
revoke all on public.contact_phones from anon, authenticated;
grant select on public.contact_phones to authenticated;
create policy contact_phones_read on public.contact_phones for select to authenticated
  using (user_id = auth.uid() or private.is_admin());

create or replace function public.set_contact_phone(p_phone text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  insert into public.contact_phones (user_id, phone) values (auth.uid(), p_phone)
  on conflict (user_id) do update set phone = excluded.phone, updated_at = now();
end $$;
revoke all on function public.set_contact_phone(text) from public, anon;
grant execute on function public.set_contact_phone(text) to authenticated;

-- The admin queue now uses the admin_driver_documents function above (it reads contact_phones).
revoke all on function public.admin_driver_documents() from public, anon;
grant execute on function public.admin_driver_documents() to authenticated;
revoke all on function public.admin_decide_document(uuid, boolean, text) from public, anon;
grant execute on function public.admin_decide_document(uuid, boolean, text) to authenticated;

-- 5 ---------------------------------------------------------------------------------------------------- invite codes
alter table public.invites add column code_hash bytea unique check (code_hash is null or octet_length(code_hash) = 32);

drop function if exists public.create_van_invite(uuid, uuid, bytea);
create or replace function public.create_van_invite(p_actor uuid, p_van uuid, p_token_hash bytea, p_code_hash bytea default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare i uuid; v public.vans;
begin
  v := private.require_driver(p_actor, p_van);
  if v.switched_off_at is not null then raise exception 'van_switched_off'; end if;
  insert into public.invites (kind, van_id, token_hash, code_hash, created_by) values ('van', p_van, p_token_hash, p_code_hash, p_actor) returning id into i;
  return i;
end $$;

drop function if exists public.create_driver_invite(uuid, uuid, bytea);
create or replace function public.create_driver_invite(p_actor uuid, p_child uuid, p_token_hash bytea, p_code_hash bytea default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare i uuid;
begin
  perform private.require_family(p_actor, p_child);
  insert into public.invites (kind, child_id, token_hash, code_hash, created_by) values ('driver', p_child, p_token_hash, p_code_hash, p_actor) returning id into i;
  return i;
end $$;

-- What an invite is (van or driver), for a typed code: the app needs to know which screen to open.
create or replace function public.invite_kind_of(p_hash bytea) returns text
language sql stable security definer set search_path = '' as $$
  select kind::text from public.invites
  where (token_hash = p_hash or code_hash = p_hash) and revoked_at is null and expires_at > now()
$$;

create or replace function public.peek_van_invite(p_token_hash bytea)
returns table (van_name text, school_name text, driver_name text, verified boolean)
language plpgsql stable security definer set search_path = '' as $$
declare inv public.invites;
begin
  select * into inv from public.invites where (token_hash = p_token_hash or code_hash = p_token_hash) and kind = 'van';
  if inv.id is null or inv.revoked_at is not null or inv.expires_at < now() then raise exception 'invite_invalid'; end if;
  return query
    select v.name, coalesce(v.school_name, ''), p.display_name, v.verified_at is not null
    from public.vans v join public.profiles p on p.id = v.driver_id
    where v.id = inv.van_id and v.switched_off_at is null;
end $$;

-- A family may ask to join before the team has checked the van; the driver can approve once it is verified.
create or replace function public.accept_van_invite(p_actor uuid, p_token_hash bytea, p_child uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  inv public.invites;
  v public.vans;
  m uuid;
begin
  select * into inv from public.invites where (token_hash = p_token_hash or code_hash = p_token_hash) and kind = 'van';
  if inv.id is null or inv.revoked_at is not null or inv.expires_at < now() then raise exception 'invite_invalid'; end if;
  select * into v from public.vans where id = inv.van_id;
  if v.switched_off_at is not null then raise exception 'van_switched_off'; end if;
  perform private.require_family(p_actor, p_child);
  if exists (select 1 from public.memberships where child_id = p_child and status in ('pending', 'approved')) then raise exception 'child_already_on_a_van'; end if;
  insert into public.memberships (child_id, van_id, requested_by) values (p_child, inv.van_id, p_actor) returning id into m;
  return m;
end $$;

create or replace function public.accept_driver_invite(p_actor uuid, p_token_hash bytea, p_van uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  inv public.invites;
  m uuid;
begin
  select * into inv from public.invites where (token_hash = p_token_hash or code_hash = p_token_hash) and kind = 'driver';
  if inv.id is null or inv.revoked_at is not null or inv.used_at is not null or inv.expires_at < now() then raise exception 'invite_invalid'; end if;
  perform private.require_driver(p_actor, p_van);
  if exists (select 1 from public.memberships where child_id = inv.child_id and status in ('pending', 'approved')) then raise exception 'child_already_on_a_van'; end if;
  insert into public.memberships (child_id, van_id, requested_by) values (inv.child_id, p_van, inv.created_by) returning id into m;
  update public.invites set used_at = now() where id = inv.id;
  return m;
end $$;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('create_van_invite', 'create_driver_invite', 'invite_kind_of',
             'peek_van_invite', 'accept_van_invite', 'accept_driver_invite')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;

-- 6 ---------------------------------------------------------------------------------------------------- website <-> app
alter table public.pilot_interest add column user_id uuid references auth.users (id) on delete set null;
alter table public.pilot_interest add column linked_at timestamptz;

-- Run by the app after login: website sign-ups with this person's phone number become theirs. Returns
-- what they told us (role, area, school), so the app can fill it in.
create or replace function public.link_my_interest()
returns table (role text, area text, school text, kids smallint)
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); phones text[];
begin
  if uid is null then raise exception 'not_logged_in'; end if;
  select array_remove(array[
           case when u.phone is null or u.phone = '' then null else '+' || ltrim(u.phone, '+') end,
           (select cp.phone from public.contact_phones cp where cp.user_id = uid)], null)
    into phones from auth.users u where u.id = uid;
  update public.pilot_interest pi set user_id = uid, linked_at = now()
    where pi.user_id is null and pi.whatsapp = any (phones);
  return query
    select pi.role, pi.area, pi.school, pi.kids from public.pilot_interest pi
    where pi.user_id = uid order by pi.created_at desc limit 1;
end $$;
revoke all on function public.link_my_interest() from public, anon;
grant execute on function public.link_my_interest() to authenticated;

-- Keep the number of anyone who joined the app (they're now a user); forget the rest after 90 days as before.
create or replace function private.forget_old_interest_numbers() returns void
language sql security definer set search_path = '' as $$
  update public.pilot_interest set whatsapp = null where whatsapp is not null and user_id is null and created_at < now() - interval '90 days';
  update public.pilot_interest set ip_hash = null where ip_hash is not null and created_at < now() - interval '1 day';
$$;

-- Where each person is, from first sign-up to paying. One row per website sign-up, plus app parents
-- who never used the website.
create or replace function public.admin_pipeline()
returns table (source text, created_at timestamptz, role text, name text, school text, area text, whatsapp text,
               stage text, user_id uuid)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query
  with people as (
    select 'site'::text as source, pi.created_at, pi.role, null::text as name, pi.school, pi.area, pi.whatsapp, pi.user_id
    from public.pilot_interest pi
    union all
    select 'app', p.created_at, case when exists (select 1 from public.vans v where v.driver_id = p.id) then 'driver' else 'parent' end,
           p.display_name, null, null, coalesce(cp.phone, case when u.phone is null or u.phone = '' then null else '+' || ltrim(u.phone, '+') end), p.id
    from public.profiles p
    left join auth.users u on u.id = p.id
    left join public.contact_phones cp on cp.user_id = p.id
    where not exists (select 1 from public.pilot_interest pi where pi.user_id = p.id)
      and not exists (select 1 from public.admins a where a.user_id = p.id)
  )
  select pe.source, pe.created_at, pe.role, coalesce(pe.name, pr.display_name), coalesce(pe.school, ch.school_name), pe.area, pe.whatsapp,
    case
      when pe.user_id is null then 'signed_up'
      when pe.role = 'driver' then case
        when v.id is null then 'app_account'
        when v.verified_at is null and exists (select 1 from public.driver_documents d where d.van_id = v.id) then 'papers_sent'
        when v.verified_at is null then 'van_set_up'
        when exists (select 1 from public.trips t where t.van_id = v.id and not t.is_practice and t.ended_at is not null) then 'first_trip'
        else 'verified' end
      when ch.id is null then 'app_account'
      when exists (select 1 from public.subscriptions s where s.child_id = ch.id and s.paid_until >= (now() at time zone 'Asia/Karachi')::date) then 'paying'
      when exists (select 1 from public.trip_events e join public.memberships m on m.child_id = e.child_id
                   where e.child_id = ch.id and m.status = 'approved') then 'first_trip'
      when exists (select 1 from public.memberships m where m.child_id = ch.id and m.status = 'approved') then 'approved'
      when exists (select 1 from public.memberships m where m.child_id = ch.id and m.status = 'pending') then 'asked_van'
      else 'child_added' end,
    pe.user_id
  from people pe
  left join public.profiles pr on pr.id = pe.user_id
  left join public.vans v on v.driver_id = pe.user_id
  left join lateral (select c.* from public.children c join public.family_members fm on fm.family_id = c.family_id
                     where fm.user_id = pe.user_id order by c.created_at limit 1) ch on true
  order by pe.created_at desc;
end $$;
revoke all on function public.admin_pipeline() from public, anon;
grant execute on function public.admin_pipeline() to authenticated;

-- A school's pilot count: website sign-ups naming it (by link or by spelling) plus app families with a
-- child there, counted once per person. Used by the admin page and, as a bare number, by pohnch.pk/s/<short>.
create or replace function public.school_progress(p_short text)
returns table (name text, goal int, families int)
language sql stable security definer set search_path = '' as $$
  with s as (select * from public.schools where short = lower(p_short) and verified),
  site as (
    select coalesce(pi.user_id::text, pi.id::text) as who from public.pilot_interest pi, s
    where pi.role = 'parent' and (lower(pi.school) = lower(s.name)
       or lower(regexp_replace(pi.school, '[^a-z0-9]', '', 'gi')) = lower(regexp_replace(s.name, '[^a-z0-9]', '', 'gi')))),
  app as (
    select fm.user_id::text as who from public.children c join s on c.school_id = s.id
    join public.family_members fm on fm.family_id = c.family_id and fm.is_owner)
  select s.name, coalesce(s.pilot_goal, 50), (select count(distinct who)::int from (select who from site union select who from app) x)
  from s
$$;
revoke all on function public.school_progress(text) from public, anon, authenticated;
grant execute on function public.school_progress(text) to service_role, authenticated;

-- The server checks a team member may open a driver's file before making a short-lived link to it.
create or replace function public.admin_doc_path_ok(p_actor uuid, p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = p_actor)
     and exists (select 1 from public.driver_documents where path = p_path)
$$;
revoke all on function public.admin_doc_path_ok(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_doc_path_ok(uuid, text) to service_role;
