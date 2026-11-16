-- v22 Growth panel: only the server counts page views and clicks, only the Pohnch team reads the panel,
-- and the panel adds up views, visitors, sign-ups, accounts and the typed-in Play installs.
begin;
select plan(12);
select tests.seed_world();
select tests.create_user('923008887711') as parent \gset

-- nobody but the server can count, and nobody but the team can read
select tests.as_anon();
select throws_ok($$select public.site_hit('/', 'view')$$, '42501', null, 'anonymous visitors cannot call the counter directly');
select throws_ok($$select * from public.site_daily$$, '42501', null, 'anonymous visitors cannot read the counts');
select tests.as_user(:'parent');
select throws_ok($$select public.site_hit('/', 'view')$$, '42501', null, 'an app user cannot call the counter');
select throws_ok($$select public.admin_growth()$$, 'P0001', 'not_admin', 'an app user cannot read the panel');
select throws_ok($$select public.admin_set_installs('parent', 10)$$, 'P0001', 'not_admin', 'an app user cannot type installs');
select is((select count(*)::int from public.site_daily), 0, 'an app user sees no counts');

-- the server counts; the same page and event on the same day add up in one row
select tests.as_service();
select public.site_hit('/', 'view'); select public.site_hit('/', 'view'); select public.site_hit('/app', 'view');
select public.site_hit('/', 'visitor'); select public.site_hit('/app', 'click_testers');
select is((select n from public.site_daily where page = '/' and event = 'view'), 2, 'two views of the home page are one row of 2');
select throws_ok($$select public.site_hit('/', 'scroll')$$, '23514', null, 'an unknown event is refused by the table');
insert into public.pilot_interest (role, area, whatsapp, ip_hash) values ('parent', 'dha', '+923001112233', repeat('d', 64));

-- the team reads it all in one answer and types in the Play numbers
select tests.as_user(tests.id('tina'));
select public.admin_set_installs('parent', 14); select public.admin_set_installs('parent', 15);
select is((public.admin_growth() -> 'site' -> 'view' ->> 'today')::int, 3, 'views today add up across pages');
select is((public.admin_growth() -> 'signups' -> 'parent' ->> 'week')::int, 1, 'this week''s parent sign-ups are counted');
select is((public.admin_growth() -> 'installs' -> 'parent' ->> 'installs')::int, 15, 'a second entry the same day replaces the first');
select is(jsonb_array_length(public.admin_growth() -> 'series'), 14, 'the chart has 14 days');
select * from finish();
