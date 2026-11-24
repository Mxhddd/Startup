-- Launch fixes (24 Nov): the school list, vans with several schools, school stops, the required plate,
-- drivers' papers, contact numbers, invite codes, joining before the van is verified, and website
-- sign-ups linked to app accounts.
begin;
select plan(30);
select tests.seed_world();

-- Schools: the list is readable to logged-in people, not to anonymous visitors.
select tests.as_anon();
select throws_ok($$select count(*) from public.schools$$, '42501', null, 'anonymous visitors cannot read the school list');
select tests.as_user(tests.id('pa'));
select ok((select count(*) from public.school_points where verified) >= 30, 'a parent sees the starting list of Karachi schools');
select is((select short from public.schools where name = 'Beaconhouse PECHS'), 'bcp', 'Beaconhouse PECHS has its short link name');
select ok(public.add_school('Little Stars Academy', 'Malir') is not null, 'a parent can add a school that is not listed');
select is(public.add_school('little stars   academy'), (select id from public.schools where name = 'Little Stars Academy'), 'the same name again is the same school');
select tests.as_user(tests.id('pb'));
select is((select count(*)::int from public.schools where name = 'Little Stars Academy'), 0, 'another parent does not see an unchecked school');
select throws_ok($$insert into public.schools (name, verified) values ('Fake School', true)$$, '42501', null, 'nobody marks a school as checked from the app');

-- A child names a school from the list.
select tests.as_user(tests.id('pa'));
select lives_ok($$update public.children set school_id = (select id from public.schools where short = 'bcp') where id = tests.id('ali')$$, 'a parent picks the school from the list');

-- Vans: several schools, school stops, the summary name.
select tests.as_user(tests.id('rafiq'));
select lives_ok($$select public.add_school_stop(tests.id('v1'), (select id from public.schools where short = 'bcp'), 24.87, 67.06)$$, 'a driver adds a school drop-off');
select lives_ok($$insert into public.van_schools (van_id, school_id) values (tests.id('v1'), (select id from public.schools where name = 'The City School PAF Chapter'))$$, 'and a second school');
select is((select school_name from public.vans where id = tests.id('v1')), 'Beaconhouse PECHS · The City School PAF Chapter', 'the van''s school line lists both schools');
select is((select kind || '/' || label from public.stop_points where van_id = tests.id('v1') and kind = 'school'), 'school/bcp', 'the drop-off is a school stop');
select throws_ok($$insert into public.van_schools (van_id, school_id) values (tests.id('v2'), (select id from public.schools where short = 'bcp'))$$, '42501', null, 'a driver cannot change another van''s schools');

-- The plate is required from the app.
select throws_ok($$update public.vans set name = 'V1b', plate = null where id = tests.id('v1')$$, 'P0001', 'plate_required', 'a van cannot be saved without a plate');
select lives_ok($$update public.vans set name = 'V1b', plate = 'BKR-123' where id = tests.id('v1')$$, 'with a plate it saves');

-- Papers: the driver's own folder only; the team reads them with the second login step.
select tests.as_user(tests.id('kamran'));
select throws_ok(format($$select public.submit_driver_document(%L, 'licence', %L)$$, tests.id('v3'), tests.id('rafiq') || '/licence-' || gen_random_uuid() || '.jpg'), 'P0001', 'not_your_file', 'a driver cannot claim someone else''s file');
select lives_ok(format($$select public.submit_driver_document(%L, 'licence', %L)$$, tests.id('v3'), tests.id('kamran') || '/licence-' || gen_random_uuid() || '.jpg'), 'a driver sends their licence');
select throws_ok(format($$select public.submit_driver_document(%L, 'licence', %L)$$, tests.id('v1'), tests.id('kamran') || '/licence-' || gen_random_uuid() || '.jpg'), 'P0001', 'not_your_van', 'not for another van');
select tests.as_user(tests.id('pe'));
select is((select count(*)::int from public.driver_documents), 0, 'parents never see a driver''s papers');
select tests.as_user_one_step(tests.id('tina'));
select throws_ok($$select * from public.admin_driver_documents()$$, 'P0001', 'not_admin', 'the team needs the second login step');
select tests.as_user(tests.id('tina'));
select is((select kind || '/' || status from public.admin_driver_documents() where van_name = 'V3'), 'licence/pending', 'the team sees the waiting licence');

-- Contact numbers: only the person and the team.
select tests.as_user(tests.id('kamran'));
select lives_ok($$select public.set_contact_phone('+923211234567')$$, 'a driver saves a WhatsApp number');
select throws_ok($$select public.set_contact_phone('03211234567')$$, '23514', null, 'only +92 3xx numbers');
select tests.as_user(tests.id('pe'));
select is((select count(*)::int from public.contact_phones), 0, 'a parent of the van cannot read the driver''s number');

-- Invite codes and joining before the van is verified.
select tests.as_service();
select lives_ok($$select public.create_van_invite(tests.id('kamran'), tests.id('v3'), sha256('tok-v3'::bytea), sha256('CODEV3AB'::bytea))$$, 'an unverified driver can make an invite with a code');
select is(public.invite_kind_of(sha256('CODEV3AB'::bytea)), 'van', 'a typed code finds its invite');
select tests.as_admin_db();
insert into public.children (family_id, first_name, school_name) values (tests.id('fam_pd'), 'Bilal', 'School');
select tests.as_service();
select ok(public.accept_van_invite(tests.id('pd'), sha256('CODEV3AB'::bytea), (select id from public.children where first_name = 'Bilal')) is not null, 'a family can ask to join a van that is not verified yet');

-- Website sign-up -> app account.
select tests.as_service();
select public.interest_add('parent', 'pechs', 'Beaconhouse PECHS', 1, 'yes', '+923000000003', 'en', repeat('a', 64));
select tests.as_user(tests.id('pa'));
select is((select school from public.link_my_interest()), 'Beaconhouse PECHS', 'logging in links the website sign-up with the same number');
select tests.as_user(tests.id('tina'));
select is((select stage from public.admin_pipeline() where user_id = tests.id('pa') limit 1), 'first_trip', 'the pipeline shows where the parent is');
select is((select families from public.school_progress('bcp')), 1, 'the school''s count includes that family once');

select * from finish();
rollback;
