-- Who gets which push.
begin;
select plan(9);
select tests.seed_world();
-- Phones: parent A, parent B, Nadeem's family parent C, and a second family member for A.
select tests.create_user('+923009999999') as gran \gset
insert into public.profiles (id, display_name, lang) values (:'gran', 'Dadi', 'en');
insert into public.family_members (family_id, user_id) values (tests.id('fam_pa'), :'gran');
insert into public.push_tokens (user_id, token, platform) values
  (tests.id('pa'), 'tok-a', 'android'), (:'gran', 'tok-gran', 'ios'), (tests.id('pb'), 'tok-b', 'android'), (tests.id('pc'), 'tok-c', 'android');

select tests.as_user(tests.id('rafiq'));
select throws_ok($$select * from public.push_recipients(tests.id('t1'))$$, '42501', null, 'apps cannot ask who gets pushes');

select tests.as_admin_db();
select tests.as_service();
select results_eq($$select token from public.push_recipients(tests.id('t1'), array[tests.id('ali')]) order by token$$,
  $$values ('tok-a'::text), ('tok-gran'::text)$$, 'Ali''s step goes to Ali''s family only (both phones)');
select is((select lang from public.push_recipients(tests.id('t1'), array[tests.id('ali')]) where token = 'tok-gran'), 'en', 'each phone gets its own language');
select is((select distinct driver_name from public.push_recipients(tests.id('t1'), array[tests.id('ali')])), 'Rafiq bhai', 'the driver''s name comes along, for "marked by"');
select results_eq($$select distinct token from public.push_recipients(tests.id('t1')) order by token$$,
  $$values ('tok-a'::text), ('tok-b'::text), ('tok-gran'::text)$$, 'a van-wide step goes to every family on the van, not to another van''s');

-- Sara is off today: no van-wide push for her family.
select tests.as_admin_db();
insert into public.absences (child_id, service_date, created_by) values (tests.id('sara'), (now() at time zone 'Asia/Karachi')::date, tests.id('pb'));
select tests.as_service();
select is((select count(*)::int from public.push_recipients(tests.id('t1')) where token = 'tok-b'), 0, 'no van-wide push about a child on chutti');

-- Practice trips and switched-off vans send nothing.
select tests.as_admin_db();
update public.trips set is_practice = true where id = tests.id('t1');
select tests.as_service();
select is((select count(*)::int from public.push_recipients(tests.id('t1'))), 0, 'practice trips send no pushes');
select tests.as_admin_db();
update public.trips set is_practice = false where id = tests.id('t1');
update public.vans set switched_off_at = now() where id = tests.id('v1');
select tests.as_service();
select is((select count(*)::int from public.push_recipients(tests.id('t1'))), 0, 'a switched-off van sends no pushes');

select is(public.remove_push_tokens(array['tok-c']), 1, 'a token Expo no longer knows is removed');

select * from finish();
rollback;
