-- v12: seat check, rain, speed watch, learned ride minutes, one run off, time change, notices,
-- quick signals, lost and found: each only for the people it belongs to.
begin;
select plan(24);
select tests.seed_world();

-- ---- seat check: only the van's driver
select tests.as_user(tests.id('rafiq'));
select lives_ok($$select public.confirm_seat_check(tests.id('t1'))$$, 'Rafiq confirms the van is empty');
select tests.as_admin_db();
select isnt((select seat_checked_at from public.trips where id = tests.id('t1')), null, 'the check is recorded');
select tests.as_user(tests.id('nadeem'));
select throws_ok($$select public.confirm_seat_check(tests.id('t1'))$$, 'P0001', 'not_your_van', 'another driver cannot');

-- ---- rain is a late reason
select tests.as_admin_db();
select tests.as_service();
select is(public.report_late(tests.id('rafiq'), tests.id('t1'), 'rain', gen_random_uuid()), 1, 'a rain delay is stored');

-- ---- speed watch: the team only
select tests.as_admin_db();
insert into public.positions (trip_id, location, heading, speed, recorded_at) values (tests.id('t1'), 'POINT(67.1 24.9)', 90, 16.7, now());
select tests.as_user(tests.id('tina'));
select is((select max_kmh from public.admin_speeding_today() where van_name = 'V1'), 60, 'the team sees 60 km/h on V1');
select tests.as_admin_db();
select tests.as_user(tests.id('rafiq'));
select throws_ok($$select * from public.admin_speeding_today()$$, 'P0001', 'not_admin', 'drivers do not get the team''s list');

-- ---- learned ride minutes: from past runs, for the child's family only
select tests.as_admin_db();
insert into public.trips (id, van_id, service_date, kind, status, started_at, ended_at)
  select gen_random_uuid(), tests.id('v1'), (now() at time zone 'Asia/Karachi')::date - d, 'morning', 'ended', now() - make_interval(days => d), now() - make_interval(days => d) + interval '40 minutes'
  from generate_series(1, 3) as d;
insert into public.trip_events (trip_id, step, client_id, created_by, happened_at)
  select t.id, 'left', gen_random_uuid(), tests.id('rafiq'), t.started_at from public.trips t where t.van_id = tests.id('v1') and t.status = 'ended';
insert into public.trip_events (trip_id, child_id, step, client_id, created_by, happened_at)
  select t.id, tests.id('ali'), 'picked', gen_random_uuid(), tests.id('rafiq'), t.started_at + interval '12 minutes' from public.trips t where t.van_id = tests.id('v1') and t.status = 'ended';
select tests.as_user(tests.id('pa'));
select is((select minutes from public.child_ride_minutes(tests.id('ali')) where kind = 'morning'), 12, 'Ali''s van usually reaches him 12 minutes after leaving');
select throws_ok($$select * from public.child_ride_minutes(tests.id('hamza'))$$, 'P0001', 'not_your_child', 'not for someone else''s child');

-- ---- one run off
select lives_ok($$insert into public.run_absences (child_id, service_date, kind, created_by) values (tests.id('ali'), (now() at time zone 'Asia/Karachi')::date, 'afternoon', tests.id('pa'))$$, 'Ali is off this afternoon only');
select throws_ok($$insert into public.run_absences (child_id, service_date, kind, created_by) values (tests.id('hamza'), (now() at time zone 'Asia/Karachi')::date, 'afternoon', tests.id('pa'))$$, '42501', null, 'not for someone else''s child');
select tests.as_admin_db();
select is(private.off_for(tests.id('ali'), private.karachi_today(), 'afternoon'), true, 'off for the afternoon run');
select is(private.off_for(tests.id('ali'), private.karachi_today(), 'morning'), false, 'still riding in the morning');
select tests.as_user(tests.id('rafiq'));
select is((select count(*)::int from public.run_absences where child_id = tests.id('ali')), 1, 'the driver sees it');

-- ---- one-day time change (through the Edge Function)
select tests.as_admin_db();
select tests.as_service();
select lives_ok($$select public.set_run_change(tests.id('rafiq'), tests.id('v1'), (now() at time zone 'Asia/Karachi')::date, 'afternoon', '11:30')$$, 'Rafiq moves today''s afternoon run to 11:30');
select throws_ok($$select public.set_run_change(tests.id('nadeem'), tests.id('v1'), (now() at time zone 'Asia/Karachi')::date, 'afternoon', '11:30')$$, 'P0001', 'not_your_van', 'not another driver');
select tests.as_admin_db();
select tests.as_user(tests.id('pa'));
select is((select start_time from public.run_changes where van_id = tests.id('v1'))::text, '11:30:00', 'Ali''s family sees the new time');
select tests.as_admin_db();
select tests.as_user(tests.id('pc'));
select is((select count(*)::int from public.run_changes), 0, 'another van''s family does not');

-- ---- notices
select tests.as_admin_db();
select tests.as_service();
select isnt(public.post_notice(tests.id('tina'), null, 'Shahrah-e-Faisal closed'), null, 'the team posts a notice for everyone');
select throws_ok($$select public.post_notice(tests.id('rafiq'), null, 'x')$$, 'P0001', 'not_admin', 'a driver cannot post one');
select tests.as_admin_db();
select tests.as_user(tests.id('pc'));
select is((select count(*)::int from public.notices), 1, 'every family sees an everyone notice');

-- ---- quick signals
select tests.as_admin_db();
select tests.as_user(tests.id('pa'));
select lives_ok($$insert into public.signals (child_id, kind, created_by) values (tests.id('ali'), 'two_minutes', tests.id('pa'))$$, 'Ali''s family says "2 minutes"');
select tests.as_admin_db();
select tests.as_user(tests.id('rafiq'));
select is((select kind from public.signals where child_id = tests.id('ali')), 'two_minutes', 'the driver sees it');

-- ---- lost and found
select lives_ok($$insert into public.found_items (van_id, child_id, what) values (tests.id('v1'), tests.id('ali'), 'bottle')$$, 'Rafiq found Ali''s bottle');
select tests.as_admin_db();
select tests.as_user(tests.id('pb'));
select is((select count(*)::int from public.found_items), 0, 'Sara''s family does not see Ali''s item');

select * from finish();
rollback;
