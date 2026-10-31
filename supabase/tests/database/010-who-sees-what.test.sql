-- Who can see what. Each block acts as one person and counts the rows they get back.
begin;
select plan(42);
select tests.seed_world();

-- ---------------------------------------------------------------- logged out
select tests.as_anon();
select throws_ok('select count(*) from public.children', '42501', null, 'logged out: children are off limits');
select throws_ok('select count(*) from public.vans', '42501', null, 'logged out: vans are off limits');
select throws_ok('select count(*) from public.positions', '42501', null, 'logged out: positions are off limits');
select throws_ok('select count(*) from public.profiles', '42501', null, 'logged out: profiles are off limits');

-- ---------------------------------------------------------------- parent A (Ali, approved on V1 at S1)
select tests.as_admin_db();
select tests.as_user(tests.id('pa'));
select results_eq('select first_name from public.children', $$values ('Ali'::text)$$, 'parent A sees only Ali');
select results_eq('select name from public.vans', $$values ('V1'::text)$$, 'parent A sees only their van');
select results_eq('select label from public.stops', $$values ('S1'::text)$$, 'parent A sees only their own stop, not other families''');
select is((select count(*)::int from public.trips), 1, 'parent A sees their van''s trip');
select is((select count(*)::int from public.positions), 1, 'parent A sees their van''s position');
select is((select count(*)::int from public.trip_events where child_id is null), 1, 'parent A sees the van-wide "left" step');
select is((select count(*)::int from public.trip_events where child_id = tests.id('ali')), 1, 'parent A sees Ali''s step');
select is((select count(*)::int from public.trip_events where child_id = tests.id('sara')), 0, 'parent A does not see Sara''s step');
select is((select count(*)::int from public.absences), 0, 'parent A does not see Sara''s chutti');
select results_eq('select display_name from public.profiles order by display_name', $$values ('Parent A'::text), ('Rafiq bhai'::text)$$, 'parent A sees themself and their driver''s name only');
select is((select count(*)::int from public.memberships), 1, 'parent A sees only Ali''s membership');
select is((select count(*)::int from public.invites), 0, 'parent A sees no invites');
select is((select count(*)::int from public.push_tokens), 0, 'parent A sees no push tokens');

-- ---------------------------------------------------------------- parent C (another van)
select tests.as_admin_db();
select tests.as_user(tests.id('pc'));
select is((select count(*)::int from public.trips), 0, 'parent C cannot see V1''s trip');
select is((select count(*)::int from public.positions), 0, 'parent C cannot see V1''s position');
select is((select count(*)::int from public.trip_events), 0, 'parent C cannot see V1''s steps');
select results_eq('select name from public.vans', $$values ('V2'::text)$$, 'parent C sees only V2');

-- ---------------------------------------------------------------- parent D (waiting for V1)
select tests.as_admin_db();
select tests.as_user(tests.id('pd'));
select results_eq('select name from public.vans', $$values ('V1'::text)$$, 'waiting parent D sees the van they asked for');
select is((select count(*)::int from public.positions), 0, 'waiting parent D sees no positions before approval');
select is((select count(*)::int from public.trips), 0, 'waiting parent D sees no trips before approval');
select is((select count(*)::int from public.stops), 0, 'waiting parent D sees no stops');

-- ---------------------------------------------------------------- parent E (van not verified by the team)
select tests.as_admin_db();
select tests.as_user(tests.id('pe'));
select is((select count(*)::int from public.trips), 0, 'parent E sees no trips until the team verifies the driver');

-- ---------------------------------------------------------------- driver Rafiq (V1)
select tests.as_admin_db();
select tests.as_user(tests.id('rafiq'));
select results_eq('select first_name from public.children order by first_name', $$values ('Ali'::text), ('Sara'::text), ('Zoya'::text)$$, 'Rafiq sees the children on V1 and the one waiting, not Hamza or Omar');
select is((select count(*)::int from public.stops), 2, 'Rafiq sees both his stops');
select is((select count(*)::int from public.trip_events), 3, 'Rafiq sees every step on his trip');
select is((select count(*)::int from public.absences), 1, 'Rafiq sees Sara''s chutti');
select results_eq('select name from public.vans', $$values ('V1'::text)$$, 'Rafiq sees only his own van');
select is((select count(*)::int from public.families), 0, 'Rafiq cannot see families');
select is((select count(*)::int from public.profiles), 1, 'Rafiq sees only his own profile, no parents');

-- ---------------------------------------------------------------- driver Nadeem (V2)
select tests.as_admin_db();
select tests.as_user(tests.id('nadeem'));
select is((select count(*)::int from public.positions), 0, 'Nadeem cannot see V1''s positions');
select results_eq('select first_name from public.children', $$values ('Hamza'::text)$$, 'Nadeem sees only Hamza');

-- ---------------------------------------------------------------- the Pohnch team
select tests.as_admin_db();
select tests.as_user(tests.id('tina'));
select is((select count(*)::int from public.vans), 3, 'the team sees every van');
select is((select count(*)::int from public.positions), 1, 'the team sees positions');

-- ---------------------------------------------------------------- writes the apps may not do directly
select tests.as_admin_db();
select tests.as_user(tests.id('rafiq'));
select throws_ok($$update public.vans set verified_at = now() where name = 'V1'$$, '42501', null, 'a driver cannot verify their own van');
select throws_ok($$insert into public.trip_events (trip_id, step, client_id, happened_at) values (tests.id('t1'), 'left', gen_random_uuid(), now())$$, '42501', null, 'a driver cannot write steps directly (only through the tap function)');
select throws_ok($$insert into public.positions (trip_id, location, recorded_at) values (tests.id('t1'), 'POINT(67 24)', now())$$, '42501', null, 'a driver cannot write positions directly');
select tests.as_admin_db();
select tests.as_user(tests.id('pa'));
select throws_ok($$update public.memberships set status = 'approved'$$, '42501', null, 'a parent cannot approve themselves');
select is_empty($$update public.children set first_name = 'X' where id = tests.id('sara') returning id$$, 'parent A cannot change Sara');

select * from finish();
rollback;
