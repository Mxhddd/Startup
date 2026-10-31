-- The writes that matter: each one checks who is asking. Run as the server (service_role), as the
-- Edge Functions will, passing the logged-in user as p_actor.
begin;
select plan(36);
select tests.seed_world();

-- ---------------------------------------------------------------- only the server may call them
select tests.as_user(tests.id('rafiq'));
select throws_ok($$select public.record_tap(tests.id('rafiq'), tests.id('t1'), 'reached_school', null, gen_random_uuid(), now())$$,
  '42501', null, 'the driver app cannot call record_tap directly');
select throws_ok($$select public.verify_van(tests.id('rafiq'), tests.id('v1'))$$, '42501', null, 'nobody can call verify_van from an app');

select tests.as_admin_db();
select tests.as_service();

-- ---------------------------------------------------------------- taps
select is(public.record_tap(tests.id('rafiq'), tests.id('t1'), 'picked', array[tests.id('ali')], '11111111-1111-1111-1111-111111111111', now()), 0,
  'a double tap: Ali already has "in the van" on this trip, so a second tap stores nothing');
select is(public.record_tap(tests.id('rafiq'), tests.id('t1'), 'reached_school', null, '22222222-2222-2222-2222-222222222222', now()), 1, 'a van-wide tap is stored');
select is(public.record_tap(tests.id('rafiq'), tests.id('t1'), 'reached_school', null, '22222222-2222-2222-2222-222222222222', now()), 0, 'the same tap sent again (offline queue) is ignored');
select is((select count(*)::int from public.trip_events where tap_id = '22222222-2222-2222-2222-222222222222'), 1, 'only one row for the repeated tap');
select throws_ok($$select public.record_tap(tests.id('nadeem'), tests.id('t1'), 'reached_school', null, gen_random_uuid(), now())$$,
  'P0001', 'not_your_van', 'another driver cannot tap on Rafiq''s trip');
select throws_ok($$select public.record_tap(tests.id('rafiq'), tests.id('t1'), 'picked', array[tests.id('hamza')], gen_random_uuid(), now())$$,
  'P0001', 'child_not_on_van', 'a child from another van cannot be tapped');
select throws_ok($$select public.record_tap(tests.id('rafiq'), tests.id('t1'), 'picked', array[tests.id('zoya')], gen_random_uuid(), now())$$,
  'P0001', 'child_not_on_van', 'a child still waiting for approval cannot be tapped');
select throws_ok($$select public.record_tap(tests.id('rafiq'), tests.id('t1'), 'picked', null, gen_random_uuid(), now())$$,
  'P0001', 'children_required', 'a child step needs children');
select throws_ok($$select public.record_tap(tests.id('rafiq'), tests.id('t1'), 'arriving', null, gen_random_uuid(), now())$$,
  'P0001', 'step_not_tappable', '"arriving" comes from the map, not a tap');
select is(public.record_tap(tests.id('rafiq'), tests.id('t1'), 'dropped', array[tests.id('ali'), tests.id('sara')], '33333333-3333-3333-3333-333333333333', now() + interval '1 hour'), 2,
  'siblings at one stop: one tap stores a step for each');
select ok((select max(happened_at) from public.trip_events where tap_id = '33333333-3333-3333-3333-333333333333') <= now(), 'a tap time in the future is pulled back to now');

-- undo
select is(public.undo_tap(tests.id('rafiq'), '33333333-3333-3333-3333-333333333333'), 2, 'undo removes both siblings'' steps');
select is(public.undo_tap(tests.id('nadeem'), '22222222-2222-2222-2222-222222222222'), 0, 'another driver cannot undo Rafiq''s tap');

-- late
select is(public.report_late(tests.id('rafiq'), tests.id('t1'), 'traffic', gen_random_uuid()), 1, 'running late is stored with its reason');
select throws_ok($$select public.report_late(tests.id('rafiq'), tests.id('t1'), 'bored', gen_random_uuid())$$, '23514', null, 'only the three late reasons are allowed');

-- ---------------------------------------------------------------- positions and "arriving"
select lives_ok($$select public.decide_membership(tests.id('rafiq'), (select id from public.memberships where child_id = tests.id('zoya')), true, tests.id('s2'))$$,
  'Rafiq approves Zoya at S2');
select is((select count(*)::int from public.record_position(tests.id('rafiq'), tests.id('t1'), 67.112, 24.911, 90, 6, now())), 1,
  'within 300 m of S2: Zoya is arriving (Sara, already in the van, is not)');
select is((select count(*)::int from public.record_position(tests.id('rafiq'), tests.id('t1'), 67.1105, 24.9105, 90, 6, now())), 0,
  '"arriving" is sent once per child per trip');
select throws_ok($$select * from public.record_position(tests.id('rafiq'), tests.id('t1'), -0.1, 51.5, 0, 0, now())$$,
  'P0001', 'position_out_of_range', 'a position outside Pakistan is refused as a GPS glitch');
select throws_ok($$select * from public.record_position(tests.id('nadeem'), tests.id('t1'), 67.1, 24.9, 0, 0, now())$$,
  'P0001', 'not_your_van', 'another driver cannot send positions for this trip');

-- ---------------------------------------------------------------- trips
select throws_ok($$select public.start_trip(tests.id('rafiq'), tests.id('v1'), 'afternoon', gen_random_uuid())$$,
  'P0001', 'trip_already_running', 'one running trip per van');
select lives_ok($$select public.end_trip(tests.id('rafiq'), tests.id('t1'))$$, 'the driver ends the trip');
select throws_ok($$select * from public.record_position(tests.id('rafiq'), tests.id('t1'), 67.1, 24.9, 0, 0, now())$$,
  'P0001', 'trip_not_running', 'no positions after the trip ends: location stops with the trip');
select throws_ok($$select public.start_trip(tests.id('rafiq'), tests.id('v1'), 'morning', gen_random_uuid())$$,
  'P0001', 'trip_already_done', 'the morning run happens once a day');
select isnt(public.start_trip(tests.id('rafiq'), tests.id('v1'), 'afternoon', '44444444-4444-4444-4444-444444444444'), null, 'the afternoon run starts');
select is(public.start_trip(tests.id('rafiq'), tests.id('v1'), 'afternoon', '44444444-4444-4444-4444-444444444444'),
  (select trip_id from public.trip_events where client_id = '44444444-4444-4444-4444-444444444444'), 'the same start sent twice returns the same trip');
select throws_ok($$select public.start_trip(tests.id('kamran'), tests.id('v3'), 'morning', gen_random_uuid())$$,
  'P0001', 'van_not_verified', 'an unverified driver can only practise');

-- ---------------------------------------------------------------- invites and approvals
select lives_ok($$select public.create_van_invite(tests.id('rafiq'), tests.id('v1'), extensions.digest('token-v1', 'sha256'))$$, 'Rafiq makes an invite (only its hash is stored)');
select throws_ok($$select public.create_van_invite(tests.id('pa'), tests.id('v1'), extensions.digest('token-x', 'sha256'))$$,
  'P0001', 'not_your_van', 'a parent cannot make an invite for a van');
select throws_ok($$select public.accept_van_invite(tests.id('pc'), extensions.digest('token-v1', 'sha256'), tests.id('hamza'))$$,
  'P0001', 'child_already_on_a_van', 'a child already on a van cannot join a second one');
select throws_ok($$select public.accept_van_invite(tests.id('pc'), extensions.digest('wrong', 'sha256'), tests.id('hamza'))$$,
  'P0001', 'invite_invalid', 'a wrong link does nothing');
select throws_ok($$select public.decide_membership(tests.id('nadeem'), (select id from public.memberships where child_id = tests.id('zoya')), true)$$,
  'P0001', 'not_your_van', 'only the van''s driver approves');

-- ---------------------------------------------------------------- chutti
select throws_ok($$select public.set_absence(tests.id('pa'), tests.id('sara'), (now() at time zone 'Asia/Karachi')::date)$$,
  'P0001', 'not_your_child', 'a parent cannot mark someone else''s child absent');
select throws_ok($$select public.clear_absence(tests.id('pa'), tests.id('ali'), (now() at time zone 'Asia/Karachi')::date)$$,
  'P0001', 'van_already_left', 'chutti can''t be undone once the van has left');

select * from finish();
rollback;
