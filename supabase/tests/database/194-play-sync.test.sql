-- v23: only the server writes Google Play install numbers; the team reads them.
begin;
select plan(4);
select tests.seed_world();
select tests.as_user(tests.id('tina'));
select throws_ok($$select public.play_record_installs('parent', '2026-11-16', 13, 2)$$, '42501', null, 'the team cannot write Play numbers by hand through this');
select tests.as_service();
select lives_ok($$select public.play_record_installs('parent', '2026-11-16', 13, 2)$$, 'the server records a day');
select lives_ok($$select public.play_record_installs('parent', '2026-11-16', 14, 3)$$, 'and updates it when Play revises it');
select tests.as_admin_db();
select is((select installs || '/' || daily || '/' || source from public.play_installs where app = 'parent' and day = '2026-11-16'), '14/3/play', 'one row per app per day, marked as from Play');
select * from finish();
rollback;
