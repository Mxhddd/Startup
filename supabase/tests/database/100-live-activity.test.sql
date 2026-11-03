-- Live Activity tokens: private, only for your own child on a van you follow; the server's target list.
begin;
select plan(7);
select tests.seed_world();

select tests.as_user(tests.id('pa'));
insert into public.live_activity_tokens (token, kind, trip_id, child_id) values ('la-ali', 'update', tests.id('t1'), tests.id('ali'));
select is((select count(*)::int from public.live_activity_tokens), 1, 'a parent saves the token of their child''s card');
select throws_ok($$insert into public.live_activity_tokens (token, kind, trip_id, child_id) values ('la-x', 'update', tests.id('t1'), tests.id('sara'))$$, '42501', null, 'not for someone else''s child');
insert into public.live_activity_tokens (token, kind) values ('start-a', 'start');
select is((select count(*)::int from public.live_activity_tokens where kind = 'start'), 1, 'and the phone''s push-to-start token');

select tests.as_user(tests.id('pb'));
select is((select count(*)::int from public.live_activity_tokens), 0, 'another parent cannot see them');

select tests.as_service();
select is((select first_name from public.live_activity_targets(tests.id('t1'))), 'Ali', 'the server gets the card to update, with the child');
select public.mark_activity_pushed(array['la-ali']);
select is((select count(*)::int from public.live_activity_targets(tests.id('t1'))), 0, 'not again within a minute');
select is((select count(*)::int from public.live_activity_targets(tests.id('t1'), true)), 1, 'unless a step just happened');

select * from finish();
rollback;
