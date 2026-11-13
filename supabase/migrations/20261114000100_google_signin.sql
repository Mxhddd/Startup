-- v21: sign in with Google (free, no SMS). Accounts made with Google have a verified email and no phone,
-- so a family's owner can also add someone by their Gmail address. Only emails the provider has verified
-- count, so nobody can claim an address that isn't theirs. Server only (the app function), like the phone lookup.
create or replace function public.user_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from auth.users
  where lower(email) = lower(btrim(p_email)) and email_confirmed_at is not null
  limit 1
$$;
revoke all on function public.user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.user_id_by_email(text) to service_role;
