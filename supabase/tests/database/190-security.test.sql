-- v20 security: admin rights need the second login step; the public meter never shows areas under 3
-- families; one WhatsApp number makes one sign-up; a flood is capped per hour; IP hashes are forgotten
-- after a day; logged-in users can't run the clean-up jobs; the admin list carries no IP hash.
begin;
select plan(12);
select tests.seed_world();

-- 1. a team member who only passed the phone code (aal1) is not an admin; with the second step they are
select tests.as_user_one_step(tests.id('tina'));
select throws_ok($$select * from public.admin_interest()$$, 'P0001', 'not_admin', 'an admin with only the phone code is refused');
select is(private.is_admin(), false, 'is_admin() is false without the second step');
select tests.as_user(tests.id('tina'));
select is(private.is_admin(), true, 'with the authenticator step the team member is an admin');

-- 2. the meter leaves out areas with fewer than 3 families, however many drivers they have
select tests.as_service();
select public.interest_add('parent', 'dha', null, 1, 'unknown', null, 'en', repeat('a', 64));
select public.interest_add('parent', 'dha', null, 1, 'unknown', null, 'en', repeat('b', 64));
select public.interest_add('driver', 'dha', null, null, null, null, 'en', repeat('c', 64));
select is(public.interest_summary() -> 'meter' -> 'dha', null, '2 families and a driver: the area is not shown');
select public.interest_add('parent', 'dha', null, 1, 'unknown', null, 'en', repeat('d', 64));
select is(public.interest_summary() -> 'meter' -> 'dha' ->> 'f', '3-9', 'at 3 families the area shows, as a band');

-- 3. the same WhatsApp number again updates its sign-up instead of adding another
select public.interest_add('parent', 'clifton', null, 1, 'yes', '+923001110000', 'en', repeat('e', 64));
select public.interest_add('parent', 'saddar', null, 2, 'yes', '+923001110000', 'en', repeat('f', 64));
select is((select count(*)::int from public.pilot_interest where whatsapp = '+923001110000'), 1, 'one number, one sign-up');
select is((select area from public.pilot_interest where whatsapp = '+923001110000'), 'saddar', 'the repeat updates the area');

-- 4. at most 60 sign-ups an hour in total
select tests.as_admin_db();
insert into public.pilot_interest (role, area, ip_hash) select 'parent', 'korangi', md5(g::text) || md5(g::text) from generate_series(1, 60) g;
select tests.as_service();
select is(public.interest_add('parent', 'malir', null, 1, 'yes', null, 'en', repeat('9', 64)), 'busy', 'the 61st sign-up in an hour waits');

-- 5. IP hashes are forgotten after a day
select tests.as_admin_db();
update public.pilot_interest set created_at = now() - interval '2 days' where area = 'dha';
select private.forget_old_interest_numbers();
select is((select count(*)::int from public.pilot_interest where area = 'dha' and ip_hash is not null), 0, 'IP hashes older than a day are cleared');

-- 6. logged-in users can't run the clean-up jobs; the admin list has no IP hash
select is(has_function_privilege('authenticated', 'private.purge_old_positions()', 'execute'), false, 'app users cannot purge positions');
select is(has_function_privilege('authenticated', 'private.forget_old_interest_numbers()', 'execute'), false, 'app users cannot run the interest clean-up');
select is((select count(*)::int from information_schema.routines r join information_schema.parameters p on p.specific_name = r.specific_name
           where r.routine_name = 'admin_interest' and p.parameter_name = 'ip_hash'), 0, 'the admin list does not return IP hashes');
select * from finish();
rollback;
