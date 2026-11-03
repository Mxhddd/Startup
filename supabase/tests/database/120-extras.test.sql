-- v8 phase E: planning limit, the school pin, and "we're ready".
begin;
select plan(12);
select tests.seed_world();

-- ---- at most 60 days ahead
select throws_ok($$select public.set_absence(tests.id('pa'), tests.id('ali'), ((now() at time zone 'Asia/Karachi')::date + 61))$$, 'P0001', 'date_too_far', 'chutti can''t be planned more than 60 days ahead');
select lives_ok($$select public.set_absence(tests.id('pa'), tests.id('ali'), ((now() at time zone 'Asia/Karachi')::date + 60))$$, '60 days ahead is fine');
select throws_ok($$select public.set_van_day_off(tests.id('rafiq'), tests.id('v1'), ((now() at time zone 'Asia/Karachi')::date + 61), true)$$, 'P0001', 'date_too_far', 'nor a van day off');

-- ---- the school pin
select tests.as_user(tests.id('nadeem'));
select throws_ok($$select public.set_school_pin(tests.id('v1'), 24.93, 67.12)$$, 'P0001', 'not_your_van', 'only the van''s driver places its school');
select tests.as_user(tests.id('rafiq'));
select lives_ok($$select public.set_school_pin(tests.id('v1'), 24.93, 67.12)$$, 'the driver places the school');
select throws_ok($$select public.set_school_pin(tests.id('v1'), 51.5, -0.1)$$, 'P0001', 'position_out_of_range', 'a pin outside Pakistan is refused');
select tests.as_user(tests.id('pa'));
select is((select round(lat::numeric, 2) from public.school_point(tests.id('v1'))), 24.93, 'a family on the van sees the school');
select tests.as_user(tests.id('pc'));
select is((select count(*)::int from public.school_point(tests.id('v1'))), 0, 'another van''s family does not');

-- ---- "we're ready"
select tests.as_user(tests.id('pa'));
select lives_ok($$insert into public.ready_signals (trip_id, child_id, created_by) values (tests.id('t1'), tests.id('ali'), tests.id('pa'))$$, 'a parent says their child is ready');
select throws_ok($$insert into public.ready_signals (trip_id, child_id, created_by) values (tests.id('t1'), tests.id('sara'), tests.id('pa'))$$, '42501', null, 'never for someone else''s child');
select tests.as_user(tests.id('rafiq'));
select is((select count(*)::int from public.ready_signals where trip_id = tests.id('t1')), 1, 'the driver sees it');
select tests.as_user(tests.id('pc'));
select is((select count(*)::int from public.ready_signals), 0, 'another family does not');

select * from finish();
rollback;
