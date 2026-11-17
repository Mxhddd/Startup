-- v23: Google Play installs, read by the `play-stats` Edge Function from Play Console's daily reports
-- (instead of typing them in). play_installs keeps one row per app per day: the total people who have the
-- app now ("Total User Installs") and the installs that day. Only the server writes them.
alter table public.play_installs add column if not exists daily integer check (daily between 0 and 10000000);
alter table public.play_installs add column if not exists source text not null default 'typed' check (source in ('typed', 'play'));

create or replace function public.play_record_installs(p_app text, p_day date, p_total integer, p_daily integer) returns void
language sql security definer set search_path = '' as $$
  insert into public.play_installs (app, day, installs, daily, source) values (p_app, p_day, p_total, p_daily, 'play')
  on conflict (app, day) do update set installs = excluded.installs, daily = excluded.daily, source = 'play', entered_at = now();
$$;
revoke all on function public.play_record_installs(text, date, integer, integer) from public, anon, authenticated;
grant execute on function public.play_record_installs(text, date, integer, integer) to service_role;
