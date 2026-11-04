-- v9: peeking at a van invite shows the van and driver by name only, and refuses a bad token.
begin;
select plan(4);
select tests.seed_world();
insert into public.invites (kind, van_id, token_hash, created_by) values ('van', tests.id('v1'), extensions.digest('good-token', 'sha256'), tests.id('rafiq'));
insert into public.invites (kind, van_id, token_hash, created_by, revoked_at) values ('van', tests.id('v1'), extensions.digest('old-token', 'sha256'), tests.id('rafiq'), now());

select tests.as_service();
select is((select van_name || ' · ' || driver_name from public.peek_van_invite(extensions.digest('good-token', 'sha256'))), 'V1 · Rafiq bhai', 'a good link shows the van and the driver');
select throws_ok($$select * from public.peek_van_invite(extensions.digest('old-token', 'sha256'))$$, 'P0001', 'invite_invalid', 'a revoked link shows nothing');
select throws_ok($$select * from public.peek_van_invite(extensions.digest('no-such', 'sha256'))$$, 'P0001', 'invite_invalid', 'an unknown link shows nothing');
select tests.as_user(tests.id('pa'));
select throws_ok($$select * from public.peek_van_invite(extensions.digest('good-token', 'sha256'))$$, '42501', null, 'the apps cannot call it directly');

select * from finish();
rollback;
