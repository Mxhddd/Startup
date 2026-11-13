-- v21: family members can be found by a verified email (people who sign in with Google), only by the
-- server, and an email that was never verified is not found.
begin;
select plan(5);
select tests.seed_world();

select tests.as_admin_db();
insert into auth.users (id, email, email_confirmed_at)
values ('00000000-0000-4000-8000-00000000e001', 'nani.jaan@gmail.com', now()),
       ('00000000-0000-4000-8000-00000000e002', 'unverified@gmail.com', null);

select tests.as_service();
select is(public.user_id_by_email('nani.jaan@gmail.com'), '00000000-0000-4000-8000-00000000e001'::uuid, 'a verified email is found');
select is(public.user_id_by_email('  NANI.JAAN@gmail.com '), '00000000-0000-4000-8000-00000000e001'::uuid, 'case and spaces do not matter');
select is(public.user_id_by_email('unverified@gmail.com'), null, 'an unverified email is never found');
select is(has_function_privilege('authenticated', 'public.user_id_by_email(text)', 'execute'), false, 'apps cannot look people up');
select is(has_function_privilege('anon', 'public.user_id_by_email(text)', 'execute'), false, 'nobody logged out can either');
select * from finish();
rollback;
