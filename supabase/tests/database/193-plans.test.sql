-- Pricing v2: no free tier, no free month. With billing on for a van, only paid children's families
-- get pushes and can follow the van; the Rs 99 intro is once per phone and per seat; prices are never 0;
-- drivers see who is paid and their bonus; only the team records payments and reads the money numbers.
begin;
select plan(26);
select tests.seed_world();
insert into public.push_tokens (user_id, token, platform) values (tests.id('pa'), 'ExponentPushToken[pa]', 'android'), (tests.id('pb'), 'ExponentPushToken[pb]', 'android');

-- ---- billing off: the pilot is unchanged
select tests.as_service();
select ok(exists (select 1 from public.push_recipients(tests.id('t1')) where child_id = tests.id('ali')), 'billing off: Ali''s family gets pushes');
select tests.as_user(tests.id('pa'));
select ok(private.follows(tests.id('v1')), 'billing off: Parent A follows V1');
select is((select billing from public.my_plans() where child_id = tests.id('ali')), false, 'billing off: the app is told so');
select is(public.flag_on('billing'), false, 'billing off for Parent A');

-- ---- only the team switches billing on, for one van
select throws_ok($$select public.admin_set_flag('billing', tests.id('v1'), true)$$, 'P0001', 'not_admin', 'a parent cannot switch billing on');
select tests.as_user(tests.id('tina'));
select lives_ok($$select public.admin_set_flag('billing', tests.id('v1'), true)$$, 'the team switches billing on for V1');
select lives_ok($$select public.admin_set_price_test(tests.id('v1'), 249, false)$$, 'the team tests Rs 249 on V1');

-- ---- unpaid: nothing
select tests.as_service();
select ok(not exists (select 1 from public.push_recipients(tests.id('t1')) where child_id = tests.id('ali')), 'unpaid: no pushes for Ali');
select tests.as_user(tests.id('pa'));
select ok(not private.follows(tests.id('v1')), 'unpaid: Parent A cannot follow V1');
select is((select count(*)::int from public.positions p join public.trips t on t.id = p.trip_id where t.van_id = tests.id('v1')), 0, 'unpaid: no van positions');
select is((select monthly from public.my_plans() where child_id = tests.id('ali')), 249, 'Parent A sees the van''s test price');
select is((select intro_allowed from public.my_plans() where child_id = tests.id('ali')), true, 'the Rs 99 intro is offered');
select is(public.flag_on('billing'), true, 'billing on for Parent A');

-- ---- paying: only the team (or the server) records it, never for Rs 0
select throws_ok($$select public.admin_record_payment(tests.id('ali'), 'intro', 99, 30)$$, 'P0001', 'not_admin', 'a parent cannot mark themself paid');
select throws_ok($$select private.record_payment(tests.id('ali'), 'intro', 'manual', 99, 30, null)$$, '42501', null, 'nor call the inside function');
select tests.as_user(tests.id('tina'));
select throws_ok($$select public.admin_record_payment(tests.id('ali'), 'monthly', 0, 30)$$, '23514', null, 'a price of 0 is refused: nothing is free');
select is(public.admin_record_payment(tests.id('ali'), 'intro', 99, 30), private.karachi_today() + 29, 'Ali''s intro month is paid');
select throws_ok($$select public.admin_record_payment(tests.id('ali'), 'intro', 99, 30)$$, 'P0001', 'intro_used', 'the intro is once per child');
select tests.as_service();
select ok(exists (select 1 from public.push_recipients(tests.id('t1')) where child_id = tests.id('ali')), 'paid: Ali''s family gets pushes again');
select ok(not exists (select 1 from public.push_recipients(tests.id('t1')) where child_id = tests.id('sara')), 'Sara (unpaid, same van) still gets none');

-- ---- the same seat cannot get a second intro under a new account
select tests.as_admin_db();
update public.children set family_id = tests.id('fam_pb') where id = tests.id('ali');
delete from public.subscriptions where child_id = tests.id('ali');
select tests.as_user(tests.id('tina'));
select throws_ok($$select public.admin_record_payment(tests.id('ali'), 'intro', 99, 30)$$, 'P0001', 'intro_used', 'the same child, van and stop under another family: no second intro');

-- ---- drivers and the team
select tests.as_user(tests.id('rafiq'));
select is((select paid from public.van_paid_children(tests.id('v1')) where child_id = tests.id('sara')), false, 'the driver sees Sara is not on Pohnch');
select is((select count(*)::int from public.my_bonus() where open), 1, 'the driver sees this month''s bonus line');
select tests.as_user(tests.id('tina'));
select is((select count(*)::int from public.admin_van_riders(tests.id('v1'))), 2, 'the team sees V1''s riders to record a payment');
select tests.as_user(tests.id('pa'));
select throws_ok($$select * from public.admin_van_riders(tests.id('v1'))$$, 'P0001', 'not_admin', 'a parent cannot list riders');
select tests.as_user(tests.id('tina'));
select is((public.admin_revenue() ->> 'introStarted')::int, 0, 'the team''s numbers add up (the moved child''s plan was removed)');

select * from finish();
rollback;
