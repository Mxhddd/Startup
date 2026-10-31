-- Who gets a push for a step (server only).
-- A child's own step (in the van, dropped, arriving): that child's family.
-- A van-wide step (left, reached school, left school, late): every family on the van, except children
-- on chutti today. Nothing for practice trips, unverified vans or switched-off vans.
-- One row per child per phone; the Edge Function groups siblings into one message per phone.
create or replace function public.push_recipients(p_trip uuid, p_children uuid[] default null)
returns table (child_id uuid, first_name text, user_id uuid, token text, platform text, lang text, driver_name text)
language sql stable security definer set search_path = '' as $$
  select c.id, c.first_name, pt.user_id, pt.token, pt.platform, pr.lang, dp.display_name
  from public.trips t
  join public.vans v on v.id = t.van_id and v.verified_at is not null and v.switched_off_at is null
  join public.profiles dp on dp.id = v.driver_id
  join public.memberships m on m.van_id = v.id and m.status = 'approved'
  join public.children c on c.id = m.child_id
  join public.family_members fm on fm.family_id = c.family_id
  join public.push_tokens pt on pt.user_id = fm.user_id
  join public.profiles pr on pr.id = fm.user_id
  where t.id = p_trip and not t.is_practice
    and (
      (p_children is not null and c.id = any (p_children))
      or (p_children is null and not exists (
            select 1 from public.absences a where a.child_id = c.id and a.service_date = t.service_date))
    )
$$;

-- Phones that Expo says no longer exist (app removed): forget their tokens.
create or replace function public.remove_push_tokens(p_tokens text[]) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  delete from public.push_tokens where token = any (p_tokens);
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.push_recipients(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.remove_push_tokens(text[]) from public, anon, authenticated;
grant execute on function public.push_recipients(uuid, uuid[]) to service_role;
grant execute on function public.remove_push_tokens(text[]) to service_role;
