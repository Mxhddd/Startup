-- The read views and the driver's stop editing follow the same security rules as the tables.
begin;
select plan(12);
select tests.seed_world();

select tests.as_user(tests.id('pa'));
select results_eq('select label from public.stop_points', $$values ('S1'::text)$$, 'stop_points: a parent still sees only their own stop');
select is((select round(lat::numeric, 2) from public.stop_points), 24.90::numeric, 'stop_points gives plain latitude');
select results_eq('select first_name from public.child_points', $$values ('Ali'::text)$$, 'child_points: a parent sees only their child');
select is((select count(*)::int from public.latest_positions), 1, 'latest_positions: the parent''s van');
select throws_ok($$select public.add_stop(tests.id('v1'), 'Mine', 24.9, 67.1)$$, '42501', null, 'a parent cannot add stops to a van');
select throws_ok($$select public.set_home_pin(tests.id('sara'), 24.9, 67.1)$$, 'P0001', 'not_your_child', 'a parent cannot move another child''s pin');
select lives_ok($$select public.set_home_pin(tests.id('ali'), 24.95, 67.12)$$, 'a parent places their own child''s home pin by hand');

select tests.as_admin_db();
select tests.as_user(tests.id('pc'));
select is((select count(*)::int from public.latest_positions), 0, 'latest_positions: nothing from another van');

select tests.as_admin_db();
select tests.as_user(tests.id('rafiq'));
select lives_ok($$select public.add_stop(tests.id('v1'), 'S3', 24.92, 67.12)$$, 'the driver adds a stop by tapping the map');
select is((select position from public.stops where label = 'S3'), 3, 'a new stop goes to the end of the route');
select lives_ok($$select public.reorder_stops(tests.id('v1'), array[(select id from public.stops where label = 'S3'), tests.id('s1'), tests.id('s2')])$$, 'the driver reorders all stops at once');
select results_eq('select label from public.stops order by position', $$values ('S3'::text), ('S1'::text), ('S2'::text)$$, 'the new order is saved');

select * from finish();
rollback;
