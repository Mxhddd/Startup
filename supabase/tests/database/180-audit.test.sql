-- Audit fixes (5 Nov 2026): the map points view, live tokens that follow the trip, one-run chutti in
-- pushes and through the server, one van-wide step per trip, one signal a day, tighter table rights,
-- the queued seat check, and the time change / notice checks.
begin;
select plan(24);
select tests.seed_world();

-- ---- 1. map points: lat/lng for the van's families only
select tests.as_user(tests.id('pa'));
select is((select count(*)::int from public.position_points where trip_id = tests.id('t1')), 1, 'Ali''s family reads the van''s positions with lat/lng');
select ok((select abs(lat - 24.905) < 0.0001 and abs(lng - 67.105) < 0.0001 from public.position_points where trip_id = tests.id('t1')), 'the point is where the van was');
select tests.as_admin_db();
select tests.as_user(tests.id('pc'));
select is((select count(*)::int from public.position_points where trip_id = tests.id('t1')), 0, 'another van''s family sees nothing');

-- ---- 2. live notification tokens follow the trip
select tests.as_admin_db();
insert into public.trips (van_id, service_date, kind, status, started_at, ended_at)
  values (tests.id('v1'), (now() at time zone 'Asia/Karachi')::date - 1, 'afternoon', 'ended', now() - interval '1 day', now() - interval '23 hours')
  returning id \gset t2_
select tests.as_user(tests.id('pa'));
select lives_ok($$select public.register_live_token('android-token-0001', 'android', tests.id('t1'), tests.id('ali'))$$, 'the phone registers its token for this trip');
select lives_ok(format($$select public.register_live_token('android-token-0001', 'android', %L, tests.id('ali'))$$, :'t2_id'), 'and again for another trip');
select is((select count(*)::int from public.live_activity_tokens where token = 'android-token-0001'), 1, 'still one row for the token');
select is((select trip_id from public.live_activity_tokens where token = 'android-token-0001'), :'t2_id'::uuid, 'it now points at the newer trip');
select throws_ok($$select public.register_live_token('android-token-0002', 'android', tests.id('t1'), tests.id('hamza'))$$, 'P0001', 'not_your_child', 'not for someone else''s child');
select throws_ok($$insert into public.live_activity_tokens (token, kind) values ('direct-0001', 'start')$$, '42501', null, 'no direct inserts any more');

-- ---- 3. off for one run: pushes skip the child
select tests.as_admin_db();
insert into public.push_tokens (user_id, token, platform) values (tests.id('pa'), 'ExponentPushToken[pa]', 'android'), (tests.id('pb'), 'ExponentPushToken[pb]', 'android');
insert into public.run_absences (child_id, service_date, kind, created_by) values (tests.id('ali'), private.karachi_today(), 'morning', tests.id('pa'));
select tests.as_service();
select is((select count(*)::int from public.push_recipients(tests.id('t1'), null, 'left') where child_id = tests.id('ali')), 0, 'a van-wide push skips a child off this run');
select is((select count(*)::int from public.push_recipients(tests.id('t1'), null, 'left') where child_id = tests.id('sara')), 1, 'and still reaches the others');

-- ---- 4. one-run chutti through the server, with the cut-off
select throws_ok($$select public.set_run_absence(tests.id('pb'), tests.id('sara'), private.karachi_today(), 'morning', true)$$, 'P0001', 'van_already_left', 'not once this morning''s run has started');
select lives_ok($$select public.set_run_absence(tests.id('pb'), tests.id('sara'), private.karachi_today(), 'afternoon', true)$$, 'this afternoon is fine');
select throws_ok($$select public.set_run_absence(tests.id('pa'), tests.id('hamza'), private.karachi_today(), 'afternoon', true)$$, 'P0001', 'not_your_child', 'only for your own child');
select tests.as_admin_db();
select tests.as_user(tests.id('pb'));
select throws_ok($$delete from public.run_absences where child_id = tests.id('sara')$$, '42501', null, 'families can''t delete it directly any more');

-- ---- 5. a van-wide step is recorded once
select tests.as_admin_db();
select tests.as_service();
select is(public.record_tap(tests.id('rafiq'), tests.id('t1'), 'reached_school', null, gen_random_uuid(), now()), 1, 'reached school is recorded');
select is(public.record_tap(tests.id('rafiq'), tests.id('t1'), 'reached_school', null, gen_random_uuid(), now()), 0, 'a second hold changes nothing (no second push)');

-- ---- 6. one signal of each kind a day
select tests.as_admin_db();
select tests.as_user(tests.id('pa'));
select lives_ok($$insert into public.signals (child_id, kind, created_by) values (tests.id('ali'), 'coming_down', tests.id('pa'))$$, 'Ali''s family says "coming down"');
select throws_ok($$insert into public.signals (child_id, kind, created_by) values (tests.id('ali'), 'coming_down', tests.id('pa'))$$, '23505', null, 'not twice the same day');

-- ---- 7. table rights: families can only mark an item collected
select tests.as_admin_db();
insert into public.found_items (van_id, child_id, what) values (tests.id('v1'), tests.id('ali'), 'bottle');
select tests.as_user(tests.id('pa'));
select throws_ok($$update public.found_items set what = 'bag'$$, '42501', null, 'a family can''t change what was found');
select lives_ok($$insert into public.notification_prefs (user_id, off_steps) values (tests.id('pa'), '{late}') on conflict (user_id) do update set off_steps = excluded.off_steps, user_id = excluded.user_id$$, 'alert settings still save (upsert)');

-- ---- 8-10. queued seat check, time change name and date, unknown van
select tests.as_admin_db();
select tests.as_service();
select throws_ok($$select public.set_seat_checked(tests.id('nadeem'), tests.id('t1'))$$, 'P0001', 'not_your_van', 'only the van''s driver can confirm the seat check');
select is(public.set_run_change(tests.id('rafiq'), tests.id('v1'), private.karachi_today(), 'afternoon', '13:15'), 'Rafiq bhai', 'the push uses the driver''s profile name');
select throws_ok($$select public.post_notice(tests.id('tina'), gen_random_uuid(), 'x')$$, 'P0001', 'van_not_found', 'a notice to an unknown van is refused');

select * from finish();
rollback;
