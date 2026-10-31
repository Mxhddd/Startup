-- The admin page's numbers are for the Pohnch team only, and they count correctly.
begin;
select plan(12);
select tests.seed_world();

select tests.as_user(tests.id('rafiq'));
select throws_ok($$select public.admin_stats()$$, 'P0001', 'not_admin', 'a driver cannot see the pilot numbers');
select throws_ok($$select * from public.admin_vans()$$, 'P0001', 'not_admin', 'a driver cannot see the van list (with phone numbers)');
select tests.as_admin_db();
select tests.as_anon();
select throws_ok($$select public.admin_stats()$$, '42501', null, 'logged out: nothing');

select tests.as_admin_db();
select tests.as_user(tests.id('tina'));
select is((public.admin_stats() ->> 'trips')::int, 1, 'one real trip this week');
select is((public.admin_stats() ->> 'tripsTracked')::int, 0, 'still running, so not yet tracked end to end');
select is((public.admin_stats() ->> 'familiesActive')::int, 3, 'three families on verified vans (Omar''s van is not verified yet)');
select is((select count(*)::int from public.admin_trips_today()), 1, 'today''s trips');
select is((select done from public.admin_trips_today()), 2, 'two children tapped in so far');
select is((select count(*)::int from public.admin_vans() where verified_at is null), 1, 'one driver waiting for the check');
select ok((select driver_phone from public.admin_vans() where van_name = 'V3') is not null, 'the team sees the driver''s phone to call them');

-- End the trip: everyone riding was tapped and there is a position, so it counts as tracked.
select tests.as_admin_db();
update public.trips set status = 'ended', ended_at = now() where id = tests.id('t1');
select tests.as_user(tests.id('tina'));
select is((public.admin_stats() ->> 'tripsTracked')::int, 1, 'an ended trip with every child tapped counts as tracked end to end');

select tests.as_admin_db();
select tests.as_service();
select public.record_push_stats(5, 1, 0);
select public.record_push_stats(3, 0, 1);
select tests.as_admin_db();
select tests.as_user(tests.id('tina'));
select is((public.admin_stats() ->> 'alertsSent')::int, 8, 'push counts add up per day');

select * from finish();
rollback;
