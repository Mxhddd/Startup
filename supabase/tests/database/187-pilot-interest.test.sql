-- Join the pilot: only the server writes sign-ups, only the Pohnch team reads them, the public
-- summary shows areas only from 3 families, and one place can send at most 5 a day.
begin;
select plan(14);
select tests.seed_world();
select tests.create_user('923008887700') as parent \gset

-- nobody but the server can write or read sign-ups
select tests.as_anon();
select throws_ok($$insert into public.pilot_interest (role, area, ip_hash) values ('parent', 'dha', repeat('a', 64))$$, '42501', null, 'anonymous visitors cannot write sign-ups');
select throws_ok($$select * from public.pilot_interest$$, '42501', null, 'anonymous visitors cannot read sign-ups');
select throws_ok($$select public.interest_add('parent', 'dha', null, 1, 'yes', null, 'en', repeat('a', 64))$$, '42501', null, 'anonymous visitors cannot call the save function directly');
select tests.as_user(:'parent');
select is((select count(*)::int from public.pilot_interest), 0, 'an app user sees no sign-ups');
select throws_ok($$select public.interest_summary()$$, '42501', null, 'an app user cannot call the summary directly');

-- the server saves sign-ups; the sixth from one place in a day is refused
select tests.as_service();
select is(public.interest_add('parent', 'gulshan', 'City School', 2, 'yes', '+923001234567', 'en', repeat('b', 64)), 'ok', 'the server saves a sign-up');
select is(public.interest_add('parent', 'gulshan', null, 1, 'unknown', null, 'ur', repeat('b', 64)), 'ok', 'a second one from the same place is fine');
select public.interest_add('parent', 'gulshan', null, 1, 'unknown', null, 'en', repeat('b', 64));
select public.interest_add('parent', 'dha', null, 1, 'unknown', null, 'en', repeat('b', 64));
select public.interest_add('parent', 'dha', null, 1, 'unknown', null, 'en', repeat('b', 64));
select is(public.interest_add('parent', 'dha', null, 1, 'unknown', null, 'en', repeat('b', 64)), 'limited', 'the sixth from one place in a day is refused');
select throws_ok($$select public.interest_add('parent', 'dha', null, 1, 'yes', '0300123', 'en', repeat('c', 64))$$, '23514', null, 'a malformed number is rejected by the table');

-- the summary shows only areas with 3 or more families, and no pilot numbers yet
select is(public.interest_summary() -> 'areas', '{"gulshan": 3}'::jsonb, 'Gulshan (3) shows, DHA (2) does not');
select is(public.interest_summary() -> 'proof', 'null'::jsonb, 'no pilot numbers before there are enough vans and trips');
select public.interest_doubt(2); select public.interest_doubt(2);
select is((select opens from public.site_doubts where n = 2), 2, 'opening an honest answer is counted');

-- the Pohnch team can read the list; old numbers are forgotten after 90 days
select tests.as_admin_db();
update public.pilot_interest set created_at = now() - interval '91 days' where whatsapp is not null;
select private.forget_old_interest_numbers();
select is((select count(*)::int from public.pilot_interest where whatsapp is not null), 0, 'numbers older than 90 days are removed');
select tests.as_user(tests.id('tina'));
select is((select count(*)::int from public.admin_interest()), 5, 'the Pohnch team sees every sign-up');
select * from finish();
rollback;
