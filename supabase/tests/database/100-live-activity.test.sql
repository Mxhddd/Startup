-- Live Activity tokens: private, only for your own child on a van you follow; the server's target list.
begin;
select plan(9);
select tests.seed_world();

select tests.as_user(tests.id('pa'));
select public.register_live_token('la-ali-token', 'update', tests.id('t1'), tests.id('ali'));
select is((select count(*)::int from public.live_activity_tokens), 1, 'a parent saves the token of their child''s card');
select throws_ok($$select public.register_live_token('la-x-token', 'update', tests.id('t1'), tests.id('sara'))$$, 'P0001', 'not_your_child', 'not for someone else''s child');
select public.register_live_token('start-a-token', 'start');
select is((select count(*)::int from public.live_activity_tokens where kind = 'start'), 1, 'and the phone''s push-to-start token');

select public.register_live_token('ExponentPushToken[and]', 'android', tests.id('t1'), tests.id('ali'));
select throws_ok($$select public.register_live_token('android-no-trip', 'android')$$, '23514', null, 'an Android token always names its trip');

select tests.as_user(tests.id('pb'));
select is((select count(*)::int from public.live_activity_tokens), 0, 'another parent cannot see them');

select tests.as_service();
select is((select first_name from public.live_activity_targets(tests.id('t1')) where kind = 'update'), 'Ali', 'the server gets the card to update, with the child');
select is((select count(*)::int from public.live_activity_targets(tests.id('t1')) where kind = 'android'), 1, 'and the Android phone to refresh');
select public.mark_activity_pushed(array['la-ali-token', 'ExponentPushToken[and]']);
select is((select count(*)::int from public.live_activity_targets(tests.id('t1'))), 0, 'not again within a minute');
select is((select count(*)::int from public.live_activity_targets(tests.id('t1'), true)), 2, 'unless a step just happened (both phones)');

select * from finish();
rollback;
