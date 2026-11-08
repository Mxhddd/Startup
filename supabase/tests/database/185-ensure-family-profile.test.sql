-- A parent with no profile (never finished the name screen) can still make their family and add a child.
begin;
select plan(5);
select tests.seed_world();
select tests.create_user('923009998877') as uid \gset
select tests.as_user(:'uid');
select is((select count(*)::int from public.profiles where id = :'uid'), 0, 'starts with no profile');
select lives_ok($$select public.ensure_family()$$, 'ensure_family works without a profile');
select is((select count(*)::int from public.profiles where id = auth.uid()), 1, 'and made a placeholder profile');
select lives_ok($$insert into public.children (family_id, first_name, school_name) values (public.ensure_family(), 'Ali', 'Green Valley')$$, 'the child can be added');
select is(public.ensure_family(), public.ensure_family(), 'calling it again returns the same family');
select * from finish();
rollback;
