-- v20 security: the Pohnch team's admin rights need a second login step (an authenticator app, Supabase MFA).
-- A session that only passed the phone code (aal1) is not an admin, so a stolen or guessed phone code alone
-- can't open the team's data. Applied after the team has added Pohnch to their authenticator app on
-- pohnch.pk/admin (the page asks for the app before showing anything), so nobody is locked out.
create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
     and coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
$$;
