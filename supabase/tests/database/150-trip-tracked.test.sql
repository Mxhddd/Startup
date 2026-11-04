-- v10: "tracked end to end" follows the brief: start tap, every rider, reached school, positions throughout.
begin;
select plan(7);
select tests.seed_world();
select tests.as_admin_db();

-- A 30-minute morning run with a position every 2 minutes, Ali and Sara picked (from the fixtures).
update public.trips set started_at = now() - interval '30 minutes', status = 'ended', ended_at = now() where id = tests.id('t1');
delete from public.positions where trip_id = tests.id('t1');
insert into public.positions (trip_id, location, heading, speed, recorded_at)
  select tests.id('t1'), 'POINT(67.105 24.905)', 90, 8, now() - make_interval(mins => m) from generate_series(0, 30, 2) as m;

select is(private.trip_tracked(tests.id('t1')), false, 'no "reached school" yet: not tracked end to end');

insert into public.trip_events (trip_id, step, client_id, created_by, happened_at) values (tests.id('t1'), 'reached_school', gen_random_uuid(), tests.id('rafiq'), now());
select is(private.trip_tracked(tests.id('t1')), true, 'start, every rider, reached school, positions throughout: tracked');

-- A 10-minute hole in the positions.
delete from public.positions where trip_id = tests.id('t1') and recorded_at between now() - interval '20 minutes' and now() - interval '11 minutes';
select is(private.trip_tracked(tests.id('t1')), false, 'a gap of more than 5 minutes between positions: not tracked');
insert into public.positions (trip_id, location, heading, speed, recorded_at)
  select tests.id('t1'), 'POINT(67.105 24.905)', 90, 8, now() - make_interval(mins => m) from generate_series(11, 20, 3) as m;
select is(private.trip_tracked(tests.id('t1')), true, 'positions sent later fill the gap (they count by recorded time)');

-- No positions at the start of the run.
update public.trips set started_at = now() - interval '45 minutes' where id = tests.id('t1');
select is(private.trip_tracked(tests.id('t1')), false, 'the first position came 15 minutes after the start: not tracked');
update public.trips set started_at = now() - interval '30 minutes' where id = tests.id('t1');

-- An undone start does not count.
update public.trip_events set undone_at = now() where trip_id = tests.id('t1') and step = 'left';
select is(private.trip_tracked(tests.id('t1')), false, 'the "left" tap was undone: not tracked');
update public.trip_events set undone_at = null where trip_id = tests.id('t1') and step = 'left';

-- A rider not tapped in.
update public.trip_events set undone_at = now() where trip_id = tests.id('t1') and child_id = tests.id('sara');
select is(private.trip_tracked(tests.id('t1')), false, 'Sara was never tapped in: not tracked');

select * from finish();
rollback;
