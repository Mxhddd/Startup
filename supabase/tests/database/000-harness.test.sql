-- Checks the harness itself: users can be created and acted as.
begin;
select plan(3);
select tests.create_user('+920000000001') as u \gset
select tests.as_user(:'u');
select is(auth.uid(), :'u'::uuid, 'auth.uid() is the user we act as');
select is(current_user::text, 'authenticated', 'requests run as the authenticated role');
select tests.as_anon();
select is(auth.uid(), null, 'a logged-out request has no user');
select * from finish();
rollback;
