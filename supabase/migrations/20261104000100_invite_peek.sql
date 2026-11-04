-- v9: a look at a van invite before joining, so the link opens a card ("Join Gulshan van · Rafiq bhai ·
-- Green Valley School") instead of a bare form. Only the van's name, school, the driver's display name
-- and whether the Pohnch team has verified the van: never phone numbers, stops or children.
-- Called by the Edge Function with the SHA-256 of the token (the token itself is never stored).
create or replace function public.peek_van_invite(p_token_hash bytea)
returns table (van_name text, school_name text, driver_name text, verified boolean)
language plpgsql stable security definer set search_path = '' as $$
declare inv public.invites;
begin
  select * into inv from public.invites where token_hash = p_token_hash and kind = 'van';
  if inv.id is null or inv.revoked_at is not null or inv.expires_at < now() then raise exception 'invite_invalid'; end if;
  return query
    select v.name, v.school_name, p.display_name, v.verified_at is not null
    from public.vans v join public.profiles p on p.id = v.driver_id
    where v.id = inv.van_id and v.switched_off_at is null;
end $$;
revoke all on function public.peek_van_invite(bytea) from public, anon, authenticated;
grant execute on function public.peek_van_invite(bytea) to service_role;
