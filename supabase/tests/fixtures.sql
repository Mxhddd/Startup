-- A small made-up world for the security tests (made-up first names, fake phone numbers):
--   Rafiq drives van V1 (verified) with stops S1 and S2. Nadeem drives van V2 (verified).
--   Parent A: child Ali on V1 at S1 (approved).  Parent B: child Sara on V1 at S2 (approved).
--   Parent C: child Hamza on V2 (approved).      Parent D: child Zoya waiting for V1.
--   Parent E: child Omar on V3, a van the team has not verified yet (approved by its driver Kamran).
--   A morning trip on V1 today with events and a position.  Tina is on the Pohnch team.
create table if not exists tests.ids (name text primary key, id uuid not null);
grant select on tests.ids to authenticated, anon, service_role;

create or replace function tests.id(p_name text) returns uuid language sql stable as $$
  select id from tests.ids where name = p_name
$$;
grant execute on function tests.id(text) to authenticated, anon, service_role;

create or replace function tests.seed_world() returns void language plpgsql security definer set search_path = public, extensions, tests as $$
declare
  u record;
  v1 uuid; v2 uuid; v3 uuid; s1 uuid; s2 uuid; t1 uuid;
  fam uuid; kid uuid;
begin
  delete from tests.ids;
  for u in select * from (values ('rafiq', 'Rafiq bhai'), ('nadeem', 'Nadeem bhai'), ('kamran', 'Kamran bhai'),
                                  ('pa', 'Parent A'), ('pb', 'Parent B'), ('pc', 'Parent C'), ('pd', 'Parent D'), ('pe', 'Parent E'),
                                  ('tina', 'Tina')) as x(key, name) loop
    insert into tests.ids values (u.key, tests.create_user('+92300000' || lpad((select count(*) from tests.ids)::text, 4, '0')));
    insert into profiles (id, display_name) values (tests.id(u.key), u.name);
  end loop;
  insert into admins values (tests.id('tina'));

  insert into vans (driver_id, name, school_name, verified_at) values (tests.id('rafiq'), 'V1', 'School One', now()) returning id into v1;
  insert into vans (driver_id, name, school_name, verified_at) values (tests.id('nadeem'), 'V2', 'School Two', now()) returning id into v2;
  insert into vans (driver_id, name, school_name) values (tests.id('kamran'), 'V3', 'School Three') returning id into v3;
  insert into tests.ids values ('v1', v1), ('v2', v2), ('v3', v3);
  insert into stops (van_id, position, label, location) values (v1, 1, 'S1', 'POINT(67.10 24.90)') returning id into s1;
  insert into stops (van_id, position, label, location) values (v1, 2, 'S2', 'POINT(67.11 24.91)') returning id into s2;
  insert into tests.ids values ('s1', s1), ('s2', s2);

  for u in select * from (values ('pa', 'ali', 'Ali', v1, s1, 'approved'), ('pb', 'sara', 'Sara', v1, s2, 'approved'),
                                  ('pc', 'hamza', 'Hamza', v2, null, 'approved'), ('pd', 'zoya', 'Zoya', v1, null, 'pending'),
                                  ('pe', 'omar', 'Omar', v3, null, 'approved')) as x(parent, key, name, van, stop, status) loop
    insert into families (created_by) values (tests.id(u.parent)) returning id into fam;
    insert into family_members (family_id, user_id, is_owner) values (fam, tests.id(u.parent), true);
    insert into children (family_id, first_name, school_name, home_location) values (fam, u.name, 'School', 'POINT(67.1 24.9)') returning id into kid;
    insert into memberships (child_id, van_id, stop_id, status, requested_by) values (kid, u.van, u.stop, u.status::membership_status, tests.id(u.parent));
    insert into tests.ids values (u.key, kid), ('fam_' || u.parent, fam);
  end loop;

  insert into trips (van_id, service_date, kind) values (v1, (now() at time zone 'Asia/Karachi')::date, 'morning') returning id into t1;
  insert into tests.ids values ('t1', t1);
  insert into trip_events (trip_id, step, client_id, created_by, happened_at) values (t1, 'left', gen_random_uuid(), tests.id('rafiq'), now());
  insert into trip_events (trip_id, child_id, step, client_id, created_by, happened_at) values (t1, tests.id('ali'), 'picked', gen_random_uuid(), tests.id('rafiq'), now());
  insert into trip_events (trip_id, child_id, step, client_id, created_by, happened_at) values (t1, tests.id('sara'), 'picked', gen_random_uuid(), tests.id('rafiq'), now());
  insert into positions (trip_id, location, heading, speed, recorded_at) values (t1, 'POINT(67.105 24.905)', 90, 8, now());
  insert into absences (child_id, service_date, created_by) values (tests.id('sara'), (now() at time zone 'Asia/Karachi')::date + 1, tests.id('pb'));
end $$;
