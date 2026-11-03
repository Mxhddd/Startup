-- v8 phase B: day-off push list, family members, and deleting an account.
begin;
select plan(17);
select tests.seed_world();
insert into public.push_tokens (user_id, token, platform) values (tests.id('pa'), 'tok-a', 'android'), (tests.id('pb'), 'tok-b', 'ios'), (tests.id('pd'), 'tok-d', 'ios');

-- ---- day off: the families on the van hear about it; a family still waiting does not.
select tests.as_service();
select is((select count(*)::int from public.dayoff_recipients(tests.id('v1'))), 2, 'a day off reaches each approved family''s phone');
select is((select count(*)::int from public.dayoff_recipients(tests.id('v1')) where token = 'tok-d'), 0, 'a family still waiting is not told');
select tests.as_user(tests.id('rafiq'));
select throws_ok($$select * from public.dayoff_recipients(tests.id('v1'))$$, '42501', null, 'the apps cannot read the push list');

-- ---- family members: Parent A adds Parent C (who has their own family too).
select tests.as_admin_db();
select public.add_family_member(tests.id('pa'), tests.id('pc'));
select tests.as_user(tests.id('pa'));
select is((select count(*)::int from public.my_family_members()), 2, 'the family sees who is in it');
select is((select display_name from public.my_family_members() where not is_me), 'Parent C', 'by name');
select tests.as_user(tests.id('pb'));
select is((select count(*)::int from public.my_family_members() where family_id = tests.id('fam_pa')), 0, 'another family sees nothing');

select tests.as_admin_db();
select throws_ok($$select public.remove_family_member(tests.id('pb'), tests.id('fam_pa'), tests.id('pc'))$$, 'P0001', 'not_family_owner', 'only the owner removes people');
select throws_ok($$select public.remove_family_member(tests.id('pc'), tests.id('fam_pa'), tests.id('pa'))$$, 'P0001', 'member_not_found', 'the owner cannot be removed');
select public.remove_family_member(tests.id('pa'), tests.id('fam_pa'), tests.id('pc'));
select is((select count(*)::int from public.family_members where family_id = tests.id('fam_pa')), 1, 'the owner removed them');
select public.add_family_member(tests.id('pa'), tests.id('pc'));
select public.remove_family_member(tests.id('pc'), tests.id('fam_pa'), tests.id('pc'));
select is((select count(*)::int from public.family_members where family_id = tests.id('fam_pa')), 1, 'someone added can leave by themselves');

-- ---- deleting an account
-- A parent alone in their family: they, the family and the child are gone; the van's history stays.
select public.delete_account(tests.id('pa'));
select is((select count(*)::int from public.children where id = tests.id('ali')), 0, 'deleting a parent removes their child');
select is((select count(*)::int from auth.users where id = tests.id('pa')), 0, 'and the person');
select is((select count(*)::int from public.trips where id = tests.id('t1')), 1, 'the van''s trip stays');

-- A parent with someone else in the family: that person becomes the owner and the child stays.
select public.add_family_member(tests.id('pb'), tests.id('pd'));
select public.delete_account(tests.id('pb'));
select is((select is_owner from public.family_members where family_id = tests.id('fam_pb') and user_id = tests.id('pd')), true, 'the other member becomes the owner');
select is((select count(*)::int from public.children where id = tests.id('sara')), 1, 'and the child stays with them');

-- A driver with families on the van is stopped; a driver whose van has none goes with the van.
select throws_ok($$select public.delete_account(tests.id('nadeem'))$$, 'P0001', 'van_has_families', 'a driver with families is asked to remove them first');
delete from public.memberships where van_id = tests.id('v2');
select public.delete_account(tests.id('nadeem'));
select is((select count(*)::int from public.vans where id = tests.id('v2')), 0, 'then the van goes with them');

select * from finish();
rollback;
