-- Positions are kept for 30 days, then deleted (CLAUDE.md, data rules).
create or replace function private.purge_old_positions() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  n integer;
begin
  delete from public.positions where created_at < now() - interval '30 days';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function private.purge_old_positions() from public, authenticated;
grant execute on function private.purge_old_positions() to service_role;

-- Run it every night at 3:10 Karachi time (22:10 UTC) where pg_cron is available (Supabase: enable it
-- under Database > Extensions). Plain Postgres in tests skips this.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('purge-old-positions', '10 22 * * *', 'select private.purge_old_positions()');
  end if;
end $$;
