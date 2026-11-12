-- For schools (v18): a school can leave its interest; it never shows in the public summary; only the
-- Pohnch team reads it; and the 90-day number clean-up still works with school rows present.
begin;
select plan(7);
select tests.seed_world();

select tests.as_anon();
select throws_ok($$insert into public.pilot_interest (role, area, school, ip_hash) values ('school', 'dha', 'Bay View School', repeat('a', 64))$$, '42501', null, 'anonymous visitors cannot write a school sign-up');

select tests.as_service();
select is(public.interest_add('school', 'gulshan', 'City School Gulshan', null, null, '+923001112233', 'en', repeat('d', 64)), 'ok', 'the server saves a school''s interest');
select throws_ok($$select public.interest_add('school', 'gulshan', null, null, null, '+923001112233', 'en', repeat('d', 64))$$, '23514', null, 'a school row without the school''s name is refused');
select throws_ok($$select public.interest_add('principal', 'gulshan', 'X School', null, null, null, 'en', repeat('d', 64))$$, '23514', null, 'an unknown role is still refused');
select public.interest_add('school', 'gulshan', 'Another School', null, null, '+923001112244', 'en', repeat('e', 64));
select public.interest_add('school', 'gulshan', 'Third School', null, null, '+923001112255', 'en', repeat('f', 64));
select is(public.interest_summary() -> 'areas', '{}'::jsonb, 'schools never count as waiting families in the public summary');

select tests.as_admin_db();
update public.pilot_interest set created_at = now() - interval '91 days' where role = 'school';
select lives_ok($$select private.forget_old_interest_numbers()$$, 'the 90-day clean-up still runs with school rows');
select is((select count(*)::int from public.pilot_interest where role = 'school' and whatsapp is null), 3, 'old school numbers are erased too');
select * from finish();
