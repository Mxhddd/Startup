-- Notification settings: private to each person, and respected by the push list.
begin;
select plan(8);
select tests.seed_world();
insert into public.push_tokens (user_id, token, platform) values (tests.id('pa'), 'tok-a', 'android'), (tests.id('pb'), 'tok-b', 'ios');

-- Parent A switches off "van left" and Pohnch's sounds.
select tests.as_user(tests.id('pa'));
insert into public.notification_prefs (user_id, off_steps, sound) values (tests.id('pa'), array['left'], false);
select is((select off_steps from public.notification_prefs), array['left']::text[], 'a parent saves their own settings');
select throws_ok($$insert into public.notification_prefs (user_id) values (tests.id('pb'))$$, '42501', null, 'nobody can write someone else''s settings');
select throws_ok($$update public.notification_prefs set off_steps = array['nonsense']$$, '23514', null, 'only real alert steps can be switched off');

select tests.as_user(tests.id('pb'));
select is((select count(*)::int from public.notification_prefs), 0, 'another parent cannot see them');

select tests.as_anon();
select throws_ok($$select * from public.notification_prefs$$, '42501', null, 'logged-out users see nothing');

select tests.as_service();
select is((select count(*)::int from public.push_recipients(tests.id('t1'), null, 'left') where token = 'tok-a'), 0, 'a switched-off step sends no push to that phone');
select is((select count(*)::int from public.push_recipients(tests.id('t1'), null, 'picked') where token = 'tok-a'), 1, 'other steps still go');
select is((select sound from public.push_recipients(tests.id('t1'), null, 'picked') where token = 'tok-a' limit 1), false, 'the quiet choice comes along');

select * from finish();
rollback;
