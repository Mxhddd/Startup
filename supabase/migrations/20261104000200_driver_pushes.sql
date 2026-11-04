-- v9: the driver's phone hears about two things (never during a trip's location sharing, which is
-- separate): a family asking to join the van, and the Pohnch team verifying the van.
-- Both are lists for the server only (the Edge Function sends the pushes).

-- The driver's phones for a van.
create or replace function public.driver_push_targets(p_van uuid)
returns table (token text, lang text)
language sql stable security definer set search_path = '' as $$
  select pt.token, pr.lang
  from public.vans v
  join public.push_tokens pt on pt.user_id = v.driver_id
  join public.profiles pr on pr.id = v.driver_id
  where v.id = p_van
$$;
revoke all on function public.driver_push_targets(uuid) from public, anon, authenticated;
grant execute on function public.driver_push_targets(uuid) to service_role;

-- The driver's phones for a new join request, with the child's first name (the driver sees it in the app anyway).
create or replace function public.request_push_targets(p_membership uuid)
returns table (token text, lang text, first_name text)
language sql stable security definer set search_path = '' as $$
  select pt.token, pr.lang, c.first_name
  from public.memberships m
  join public.vans v on v.id = m.van_id
  join public.children c on c.id = m.child_id
  join public.push_tokens pt on pt.user_id = v.driver_id
  join public.profiles pr on pr.id = v.driver_id
  where m.id = p_membership and m.status = 'pending'
$$;
revoke all on function public.request_push_targets(uuid) from public, anon, authenticated;
grant execute on function public.request_push_targets(uuid) to service_role;
