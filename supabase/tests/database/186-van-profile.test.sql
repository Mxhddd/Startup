-- A driver with no profile (never finished the name screen) can still add their van.
begin;
select plan(4);
select tests.seed_world();
select tests.create_user('923008887766') as uid \gset
select tests.as_user(:'uid');
select is((select count(*)::int from public.profiles where id = :'uid'), 0, 'starts with no profile');
select lives_ok($$insert into public.vans (driver_id, name, school_name, plate) values (auth.uid(), 'Gulshan van', 'Green Valley', 'KHI 1')$$, 'the van can be added');
select is((select count(*)::int from public.profiles where id = auth.uid()), 1, 'and a placeholder profile was made');
select throws_ok($$insert into public.vans (driver_id, name, school_name) values (gen_random_uuid(), 'x', 'y')$$, null, null, 'but nobody can add a van for someone else');
select * from finish();
rollback;
