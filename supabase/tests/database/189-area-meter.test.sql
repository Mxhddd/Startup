-- The live area meter (v19): bands and a status per area, never exact numbers; schools never counted; since v20
-- only areas with 3 or more families appear at all;
-- the rule matches areaMeter() in packages/core (same cases as its unit test).
begin;
select plan(9);
select tests.seed_world();
select tests.as_service();
-- Gulshan: 2 families, no driver. DHA: 6 families + 1 driver. Clifton: 8 families. Malir: 12 families + 2 drivers. Korangi: a driver only.
select public.interest_add('parent', 'gulshan', null, 1, 'unknown', null, 'en', repeat('a', 64)) from generate_series(1, 2);
select public.interest_add('parent', 'dha', null, 1, 'unknown', null, 'en', md5(g::text) || md5(g::text)) from generate_series(1, 6) g;
select public.interest_add('driver', 'dha', null, null, null, null, 'en', repeat('d', 64));
select public.interest_add('parent', 'clifton', null, 1, 'unknown', null, 'en', md5((100 + g)::text) || md5((100 + g)::text)) from generate_series(1, 8) g;
select public.interest_add('parent', 'malir', null, 1, 'unknown', null, 'en', md5((200 + g)::text) || md5((200 + g)::text)) from generate_series(1, 12) g;
select public.interest_add('driver', 'malir', null, null, null, null, 'en', md5((300 + g)::text) || md5((300 + g)::text)) from generate_series(1, 2) g;
select public.interest_add('driver', 'korangi', null, null, null, null, 'en', repeat('k', 64));
select public.interest_add('school', 'korangi', 'Korangi School', null, null, '+923001112299', 'en', repeat('s', 64));

select is(public.interest_summary() -> 'meter' -> 'gulshan', null, 'two families: the area is not shown (v20: 3 or more only)');
select is(public.interest_summary() -> 'meter' -> 'dha', '{"f":"3-9","d":"yes","s":"needs-families","m":"few"}'::jsonb, 'six families and a driver: needs a few more families');
select is(public.interest_summary() -> 'meter' -> 'clifton', '{"f":"3-9","d":"none","s":"needs-driver","m":null}'::jsonb, 'eight families, no driver: needs a driver');
select is(public.interest_summary() -> 'meter' -> 'malir', '{"f":"10+","d":"yes","s":"ready","m":null}'::jsonb, 'twelve families and drivers: ready');
select is(public.interest_summary() -> 'meter' -> 'korangi', null, 'a driver alone (and a school) is not shown');
select ok((public.interest_summary() -> 'meter')::text !~ '"(f|d)":\s*[0-9]', 'the meter carries no numbers');
select is(public.interest_summary() -> 'areas' -> 'gulshan', null, 'the old exact counts still hide areas under 3');

select tests.as_anon();
select throws_ok($$select public.interest_summary()$$, '42501', null, 'anonymous visitors cannot call the summary directly');
select throws_ok($$select private.family_band(3)$$, '42501', null, 'nor the private helper');
select * from finish();
