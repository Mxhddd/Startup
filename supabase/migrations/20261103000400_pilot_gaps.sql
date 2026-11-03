-- v8 phase B: the pilot features that had a server half but no screen, or neither.
-- 1. Whole-van day off: who to tell (one push per phone).
-- 2. Family members: the family can see who is in it (names only, never phone numbers), the owner can
--    remove someone, and someone who was added can leave.
-- 3. Deleting your own account from inside the app (Apple requires it; Google expects it).

-- ---------------------------------------------------------------- 1. day-off push list (server only)
-- Everyone in the families of the van's approved children, with their language and sound choice.
-- A day off always goes out (it is not one of the switchable trip steps).
create or replace function public.dayoff_recipients(p_van uuid)
returns table (first_name text, token text, lang text, driver_name text, sound boolean)
language sql stable security definer set search_path = '' as $$
  select c.first_name, pt.token, pr.lang, dp.display_name, coalesce(np.sound, true)
  from public.vans v
  join public.profiles dp on dp.id = v.driver_id
  join public.memberships m on m.van_id = v.id and m.status = 'approved'
  join public.children c on c.id = m.child_id
  join public.family_members fm on fm.family_id = c.family_id
  join public.push_tokens pt on pt.user_id = fm.user_id
  join public.profiles pr on pr.id = fm.user_id
  left join public.notification_prefs np on np.user_id = fm.user_id
  where v.id = p_van and v.verified_at is not null and v.switched_off_at is null
$$;
revoke all on function public.dayoff_recipients(uuid) from public, anon, authenticated;
grant execute on function public.dayoff_recipients(uuid) to service_role;

-- ---------------------------------------------------------------- 2. family members
-- The people in my families: their display names and who owns the family. No phone numbers.
create or replace function public.my_family_members()
returns table (family_id uuid, user_id uuid, display_name text, is_owner boolean, is_me boolean, added_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select fm.family_id, fm.user_id, p.display_name, fm.is_owner, fm.user_id = auth.uid(), fm.added_at
  from public.family_members fm
  join public.profiles p on p.id = fm.user_id
  where fm.family_id in (select family_id from public.family_members where user_id = auth.uid())
  order by fm.is_owner desc, fm.added_at
$$;
revoke all on function public.my_family_members() from public, anon;
grant execute on function public.my_family_members() to authenticated;

-- The family's owner removes someone they added, or someone who was added leaves.
-- The owner cannot be removed (they delete their account instead). The person removed also loses
-- their lock-screen cards for the family's children.
create or replace function public.remove_family_member(p_actor uuid, p_family uuid, p_member uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.family_members where family_id = p_family and user_id = p_member and not is_owner) then
    raise exception 'member_not_found';
  end if;
  if p_actor <> p_member and not exists (select 1 from public.family_members where family_id = p_family and user_id = p_actor and is_owner) then
    raise exception 'not_family_owner';
  end if;
  delete from public.family_members where family_id = p_family and user_id = p_member;
  delete from public.live_activity_tokens
  where user_id = p_member and child_id in (select id from public.children where family_id = p_family);
end $$;
revoke all on function public.remove_family_member(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.remove_family_member(uuid, uuid, uuid) to service_role;

-- ---------------------------------------------------------------- 3. deleting my account
-- What goes:
--   - the person (auth user, profile, push tokens, settings, lock-screen tokens);
--   - a family they own, with its children and everything about them, unless someone else is in the
--     family: then the longest-standing other member becomes the owner and the children stay;
--   - a van they drive, with its stops and trips, but only once no family is on it: a driver with
--     approved families is told to remove them first (or ask Pohnch to hand the van over).
-- What stays: steps they tapped on other people's trips (the "by" becomes empty).
create or replace function public.delete_account(p_actor uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v uuid;
  f record;
  heir uuid;
begin
  if not exists (select 1 from auth.users where id = p_actor) then raise exception 'user_not_found'; end if;

  select id into v from public.vans where driver_id = p_actor;
  if v is not null then
    if exists (select 1 from public.memberships where van_id = v and status = 'approved') then
      raise exception 'van_has_families';
    end if;
    delete from public.vans where id = v;
  end if;

  for f in select family_id from public.family_members where user_id = p_actor and is_owner loop
    select user_id into heir from public.family_members
    where family_id = f.family_id and user_id <> p_actor order by added_at, user_id limit 1;
    if heir is not null then
      update public.family_members set is_owner = true where family_id = f.family_id and user_id = heir;
      update public.families set created_by = heir where id = f.family_id;
    end if;
    -- With no heir the family goes with the profile (families.created_by cascades), and its children with it.
  end loop;

  delete from private.rate_limits where user_id = p_actor;
  delete from auth.users where id = p_actor; -- profiles, family_members, tokens and settings cascade
end $$;
revoke all on function public.delete_account(uuid) from public, anon, authenticated;
grant execute on function public.delete_account(uuid) to service_role;
