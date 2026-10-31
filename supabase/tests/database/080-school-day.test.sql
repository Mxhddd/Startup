-- A full school day, start to finish, as the apps and the Edge Function would run it:
-- Sara is off today (chutti); the morning run with "arriving", a tap, an undo and the tap again;
-- reached school; the afternoon run with a drop-off. Checked from the parent's view, the push list,
-- and the admin numbers at the end.
begin;
select plan(16);
select tests.seed_world();
delete from public.trips where id = tests.id('t1'); -- start the day clean
insert into public.push_tokens (user_id, token, platform) values (tests.id('pa'), 'tok-a', 'android'), (tests.id('pb'), 'tok-b', 'ios');
create temp table day (k text primary key, v uuid);
grant all on day to service_role, authenticated;

select tests.as_service();
-- 6:50 Parent B marks Sara off today.
select lives_ok($$select public.set_absence(tests.id('pb'), tests.id('sara'), (now() at time zone 'Asia/Karachi')::date)$$, 'Sara''s parent marks chutti');

-- 7:05 Rafiq starts the morning run.
insert into day values ('am', public.start_trip(tests.id('rafiq'), tests.id('v1'), 'morning', gen_random_uuid()));
select results_eq($$select distinct token from public.push_recipients((select v from day where k = 'am')) order by token$$, $$values ('tok-a'::text)$$,
  '"The van has left" goes to Ali''s family, not to Sara''s (she is off today)');
select throws_ok($$select public.clear_absence(tests.id('pb'), tests.id('sara'), (now() at time zone 'Asia/Karachi')::date)$$, 'P0001', 'van_already_left',
  'once the van has left, chutti can''t be undone');

-- 7:11 Near S1: Ali is arriving.
select is((select count(*)::int from public.record_position(tests.id('rafiq'), (select v from day where k = 'am'), 67.1005, 24.9005, 90, 3, now())), 1, 'Ali''s family gets "at your door"');

-- 7:12 Ali in; an accidental undo; Ali in again.
insert into day values ('tap1', gen_random_uuid());
select is(public.record_tap(tests.id('rafiq'), (select v from day where k = 'am'), 'picked', array[tests.id('ali')], (select v from day where k = 'tap1'), now()), 1, 'Ali is in');
select is(public.undo_tap(tests.id('rafiq'), (select v from day where k = 'tap1')), 1, 'undo within the window');
select is(public.record_tap(tests.id('rafiq'), (select v from day where k = 'am'), 'picked', array[tests.id('ali')], gen_random_uuid(), now()), 1, 'Ali is in again');

-- What Ali's parent sees.
select tests.as_admin_db();
select tests.as_user(tests.id('pa'));
select is((select count(*)::int from public.trip_events where child_id = tests.id('ali') and step = 'picked' and undone_at is null), 1, 'the parent sees exactly one "in the van"');
select is((select count(*)::int from public.latest_positions), 1, 'the parent sees the van on the map');
select tests.as_admin_db();
select tests.as_user(tests.id('pc'));
select is((select count(*)::int from public.trip_events), 0, 'another van''s parent sees nothing of this run');

-- 7:40 Reached school; the run ends.
select tests.as_admin_db();
select tests.as_service();
select is(public.record_tap(tests.id('rafiq'), (select v from day where k = 'am'), 'reached_school', null, gen_random_uuid(), now()), 1, 'reached school');
select lives_ok($$select public.end_trip(tests.id('rafiq'), (select v from day where k = 'am'))$$, 'morning run ends');
select throws_ok($$select * from public.record_position(tests.id('rafiq'), (select v from day where k = 'am'), 67.1, 24.9, 0, 0, now())$$, 'P0001', 'trip_not_running',
  'no location after the run ends');

-- 1:30 The afternoon run: left school, Ali dropped home.
insert into day values ('pm', public.start_trip(tests.id('rafiq'), tests.id('v1'), 'afternoon', gen_random_uuid()));
select is((select count(*)::int from public.record_position(tests.id('rafiq'), (select v from day where k = 'pm'), 67.12, 24.92, 90, 8, now())), 0, 'far from any stop: no "arriving"');
select is(public.record_tap(tests.id('rafiq'), (select v from day where k = 'pm'), 'dropped', array[tests.id('ali')], gen_random_uuid(), now()), 1, 'Ali dropped home');
select public.end_trip(tests.id('rafiq'), (select v from day where k = 'pm'));

-- The team's numbers: both runs tracked end to end (Sara was off; Zoya isn't approved yet).
select tests.as_admin_db();
select tests.as_user(tests.id('tina'));
select is((public.admin_stats(1) ->> 'tripsTracked')::int, 2, 'both runs count as tracked end to end');

select * from finish();
rollback;
