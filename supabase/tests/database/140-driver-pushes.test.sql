-- v9: the driver's push lists: only that van's driver, only pending requests, never for the apps.
begin;
select plan(4);
select tests.seed_world();
insert into public.push_tokens (user_id, token, platform) values (tests.id('rafiq'), 'tok-rafiq', 'android'), (tests.id('nadeem'), 'tok-nadeem', 'ios');

select tests.as_service();
select is((select token from public.driver_push_targets(tests.id('v1'))), 'tok-rafiq', 'a van''s pushes go to its own driver');
select is((select first_name from public.request_push_targets((select id from public.memberships where child_id = tests.id('zoya')))), 'Zoya', 'a waiting request names the child for the driver');
select is((select count(*)::int from public.request_push_targets((select id from public.memberships where child_id = tests.id('ali')))), 0, 'an approved membership is not a request');
select tests.as_user(tests.id('rafiq'));
select throws_ok($$select * from public.driver_push_targets(tests.id('v1'))$$, '42501', null, 'the apps cannot read push lists');

select * from finish();
rollback;
