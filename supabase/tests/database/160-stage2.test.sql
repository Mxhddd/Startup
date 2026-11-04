-- v10 stage 2 behind a switch: off means nothing changes; on, each piece checks who is asking and
-- never shows a child's name or a phone number to anyone who couldn't see it already.
begin;
select plan(42);
select tests.seed_world();

-- ---- The switch is off: stage 2 refuses.
select tests.as_user(tests.id('pa'));
select is(public.flag_on('stage2'), false, 'stage 2 starts off');
select throws_ok($$select * from public.vans_near(tests.id('ali'))$$, 'P0001', 'stage2_off', 'off: find a van refuses');
select throws_ok($$select public.start_live_trial()$$, 'P0001', 'stage2_off', 'off: Live refuses');
select throws_ok($$select public.admin_set_flag('stage2', null, true)$$, 'P0001', 'not_admin', 'a parent cannot switch it on');
select is((select count(*)::int from public.app_flags), 0, 'a parent cannot read the switches');

-- ---- On for one van only (V2): only V2's people see it.
select tests.as_admin_db();
select tests.as_user(tests.id('tina'));
select lives_ok($$select public.admin_set_flag('stage2', tests.id('v2'), true)$$, 'the team switches it on for V2');
select tests.as_admin_db();
select tests.as_user(tests.id('pc'));
select is(public.flag_on('stage2'), true, 'on for a family on V2');
select tests.as_admin_db();
select tests.as_user(tests.id('nadeem'));
select is(public.flag_on('stage2'), true, 'on for V2''s driver');
select tests.as_admin_db();
select tests.as_user(tests.id('pa'));
select is(public.flag_on('stage2'), false, 'still off for a family on V1');

-- ---- On for everyone.
select tests.as_admin_db();
select tests.as_user(tests.id('tina'));
select lives_ok($$select public.admin_set_flag('stage2', null, true)$$, 'the team switches it on for everyone');
select is((select count(*)::int from public.admin_flags()), 2, 'the team sees both switches');
select tests.as_admin_db();
select tests.as_user(tests.id('pa'));
select is(public.flag_on('stage2'), true, 'on for everyone');

-- ---- Find a van.
select is((select count(*)::int from public.vans_near(tests.id('ali'))), 1, 'one verified van has a stop near Ali''s home (V3 is not verified, V2 has no stops)');
select is((select van_name from public.vans_near(tests.id('ali'))), 'V1', 'it is V1');
select is((select driver_name from public.vans_near(tests.id('ali'))), 'Rafiq', 'the driver by first name only');
select is((select rating from public.vans_near(tests.id('ali'))), null, 'no rating shown under 5 ratings');
select throws_ok($$select * from public.vans_near(tests.id('hamza'))$$, 'P0001', 'not_your_child', 'not for someone else''s child');
select tests.as_admin_db();
select tests.as_anon();
select throws_ok($$select * from public.vans_near(tests.id('ali'))$$, '42501', null, 'logged out: nothing');

-- ---- Ask for a seat (a new child in Parent A's family).
select tests.as_admin_db();
insert into public.children (family_id, first_name, school_name, home_location) values (tests.id('fam_pa'), 'Nadia', 'School', 'POINT(67.1 24.9)');
insert into tests.ids values ('nadia', (select id from public.children where first_name = 'Nadia'));
select tests.as_user(tests.id('pa'));
select isnt(public.request_seat(tests.id('v1'), tests.id('nadia')), null, 'a seat is asked for');
select tests.as_admin_db();
select is((select status::text from public.memberships where child_id = tests.id('nadia')), 'pending', 'it waits for the driver');
select is((select trial_until from public.memberships where child_id = tests.id('nadia')), private.karachi_today() + 7, 'with a one-week trial');
select tests.as_user(tests.id('pa'));
select throws_ok($$select public.request_seat(tests.id('v1'), tests.id('nadia'))$$, 'P0001', 'child_already_on_a_van', 'only one van at a time');
select throws_ok($$select public.request_seat(tests.id('v3'), tests.id('ali'))$$, 'P0001', 'van_not_open', 'not on an unverified van');

-- ---- Pohnch Live: a free month, once.
select is(public.start_live_trial(), private.karachi_today() + 30, 'the free month starts');
select is((select status from public.live_status()), 'trial', 'Live is on trial');
select is((select days_left from public.live_status()), 30, 'thirty days left');
select throws_ok($$select public.start_live_trial()$$, 'P0001', 'trial_used', 'one free month per family');

-- ---- Ratings: only riders' families, shown from 5 up.
select lives_ok($$select public.rate_van(tests.id('v1'), 5, array['on_time','kind'])$$, 'Parent A rates V1');
select lives_ok($$select public.rate_van(tests.id('v1'), 4, array['safe_driving'])$$, 'rating again this month changes it, not adds');
select is((select ratings from public.vans_near(tests.id('ali'))), 1, 'one rating counted');
select tests.as_admin_db();
select tests.as_user(tests.id('pc'));
select throws_ok($$select public.rate_van(tests.id('v1'), 1)$$, 'P0001', 'not_on_this_van', 'a family not on the van cannot rate it');

-- ---- Request a van: one open request per child; progress counts the same school within 2 km.
select tests.as_admin_db();
select tests.as_user(tests.id('pa'));
select is(public.request_van(tests.id('ali')), public.request_van(tests.id('ali')), 'asking twice keeps one request');
select tests.as_admin_db();
select tests.as_user(tests.id('pb'));
select isnt(public.request_van(tests.id('sara')), null, 'Parent B asks too');
select is(public.request_progress((select id from public.van_requests where child_id = tests.id('sara'))), 2, 'two children for the same school nearby');

-- ---- Fees: the driver sets them and marks "paid in cash"; the parent sees it.
select tests.as_admin_db();
select tests.as_user(tests.id('rafiq'));
select lives_ok($$select public.set_van_fee(tests.id('v1'), 6500, 12)$$, 'Rafiq sets the fee and seats');
select lives_ok($$select public.mark_fee_paid((select id from public.memberships where child_id = tests.id('ali') and status = 'approved'), true)$$, 'Rafiq marks Ali''s family paid');
select is((select paid from public.van_fees(tests.id('v1')) where first_name = 'Ali'), true, 'the driver sees it paid');
select tests.as_admin_db();
select tests.as_user(tests.id('pa'));
select is((select amount from public.child_fees(tests.id('ali')) limit 1), 6500, 'the parent sees this month''s fee');
select throws_ok($$select public.set_van_fee(tests.id('v1'), 1)$$, 'P0001', 'not_your_van', 'a parent cannot set the fee');

-- ---- The driver's help alert, seen by the team only.
select tests.as_admin_db();
select tests.as_user(tests.id('rafiq'));
select isnt(public.send_help_alert(tests.id('t1')), null, 'Rafiq sends a help alert during the trip');
select tests.as_admin_db();
select tests.as_user(tests.id('pa'));
select is((select count(*)::int from public.help_alerts), 0, 'parents do not see help alerts');
select tests.as_admin_db();
select tests.as_user(tests.id('tina'));
select ok((select lat from public.admin_help_alerts() limit 1) is not null, 'the team sees it with the van''s last position');

select * from finish();
rollback;
