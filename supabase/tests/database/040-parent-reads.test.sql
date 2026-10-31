begin;
select plan(5);
select tests.seed_world();

-- Rafiq's van: S1 (Ali, picked in the fixture), S2 (Sara, picked). Add Zoya at S2 and a new child at S3.
select public.decide_membership(tests.id('rafiq'), (select id from public.memberships where child_id = tests.id('zoya')), true, tests.id('s2'));
-- un-pick Sara so S2 still has a child waiting
update public.trip_events set undone_at = now() where child_id = tests.id('sara');

select tests.as_user(tests.id('pd'));
select is(public.stops_ahead(tests.id('zoya')), 0, 'Zoya''s stop S2: S1 is done (Ali in), nothing ahead');

select tests.as_admin_db();
-- Move Zoya to a new stop S3 after S2: now S2 (Sara waiting) is ahead of her
insert into public.stops (van_id, position, label, location) values (tests.id('v1'), 3, 'S3', 'POINT(67.12 24.92)');
update public.memberships set stop_id = (select id from public.stops where label = 'S3') where child_id = tests.id('zoya');
select tests.as_user(tests.id('pd'));
select is(public.stops_ahead(tests.id('zoya')), 1, 'one stop with a child still waiting is ahead');

select tests.as_admin_db();
insert into public.absences (child_id, service_date, created_by) values (tests.id('sara'), (now() at time zone 'Asia/Karachi')::date, tests.id('pb'));
select tests.as_user(tests.id('pd'));
select is(public.stops_ahead(tests.id('zoya')), 0, 'a stop whose only child is on chutti is not counted');

select throws_ok($$select public.stops_ahead(tests.id('ali'))$$, 'P0001', 'not_your_child', 'a parent cannot ask about another family''s child');
select tests.as_admin_db();
select tests.as_anon();
select throws_ok($$select public.stops_ahead(tests.id('ali'))$$, '42501', null, 'logged out: no access');

select * from finish();
rollback;
