-- B8: the fixes from the review, and the 30-day position cleanup.
begin;
select plan(17);
select tests.seed_world();

-- ---------------------------------------------------------------- 30-day cleanup
insert into public.positions (trip_id, location, recorded_at, created_at)
values (tests.id('t1'), 'POINT(67.1 24.9)', now() - interval '31 days', now() - interval '31 days'),
       (tests.id('t1'), 'POINT(67.1 24.9)', now() - interval '29 days', now() - interval '29 days');
select is(private.purge_old_positions(), 1, 'the cleanup deletes positions older than 30 days');
select is((select count(*)::int from public.positions where created_at < now() - interval '30 days'), 0, 'none older than 30 days remain');
select is((select count(*)::int from public.positions), 2, 'newer positions stay (the fixture''s one and the 29-day-old one)');

-- ---------------------------------------------------------------- one van per driver
select throws_ok($$insert into public.vans (driver_id, name, school_name) values (tests.id('rafiq'), 'Second', 'X')$$, '23505', null, 'a driver cannot have two vans');

-- ---------------------------------------------------------------- a trip left running
-- Pretend the morning trip was yesterday and the phone died: today's start must still work.
update public.trips set service_date = service_date - 1, started_at = now() - interval '1 day' where id = tests.id('t1');
select tests.as_service();
select isnt(public.start_trip(tests.id('rafiq'), tests.id('v1'), 'morning', gen_random_uuid()), null, 'yesterday''s stuck trip does not block today''s start');
select tests.as_admin_db();
select is((select status::text from public.trips where id = tests.id('t1')), 'ended', 'and the stuck trip was ended');
-- A running trip with nothing for 3 hours is ended by the scheduled job.
update public.trips set started_at = now() - interval '4 hours' where status = 'running';
update public.trip_events set created_at = now() - interval '4 hours' where trip_id in (select id from public.trips where status = 'running');
select is(private.end_stale_trips(), 1, 'the job ends a trip with no news for 3 hours');

-- The team can end a trip; nobody else can.
select tests.as_service();
select isnt(public.start_trip(tests.id('nadeem'), tests.id('v2'), 'morning', gen_random_uuid()), null, 'Nadeem starts a trip');
select throws_ok($$select public.admin_end_trip(tests.id('rafiq'), (select id from public.trips where van_id = tests.id('v2') and status = 'running'))$$,
  'P0001', 'not_admin', 'a driver cannot use the team''s "end trip"');
select lives_ok($$select public.admin_end_trip(tests.id('tina'), (select id from public.trips where van_id = tests.id('v2') and status = 'running'))$$, 'the team ends a stuck trip');

-- ---------------------------------------------------------------- leaving a van
select throws_ok($$select public.leave_van(tests.id('pb'), tests.id('ali'))$$, 'P0001', 'not_your_child', 'a parent cannot take someone else''s child off a van');
select lives_ok($$select public.leave_van(tests.id('pa'), tests.id('ali'))$$, 'a parent takes their child off the van');
select is((select status::text from public.memberships where child_id = tests.id('ali') order by created_at desc limit 1), 'left', 'Ali has left V1');
select throws_ok($$select public.remove_rider(tests.id('nadeem'), (select id from public.memberships where child_id = tests.id('sara')))$$, 'P0001', 'not_your_van', 'only the van''s driver removes a rider');

-- ---------------------------------------------------------------- rate limits
select is((select bool_and(public.rate_hit(tests.id('pa'), 'family.add', 3, 3600)) from generate_series(1, 3)), true, 'up to the limit is allowed');
select is(public.rate_hit(tests.id('pa'), 'family.add', 3, 3600), false, 'one more is refused');

-- ---------------------------------------------------------------- deleting a parent's account
select tests.as_admin_db();
delete from auth.users where id = tests.id('pb');
select is((select count(*)::int from public.children where id = tests.id('sara')), 0, 'deleting a parent removes their family''s children and everything about them');

select * from finish();
rollback;
