-- Notification settings (v7): each person chooses which trip alerts reach their phone, and whether
-- they use Pohnch's sounds. The map and timeline always show everything; this only filters pushes.
-- Rows are private: you read and change only your own (row-level security), nobody else's.

create table public.notification_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Steps this person does NOT want a push for. Empty = every alert (the default for everyone).
  off_steps text[] not null default '{}'
    check (off_steps <@ array['left', 'picked', 'arriving', 'reached_school', 'left_school', 'dropped', 'late']::text[]),
  -- Pohnch's own sounds (soft chime, two-note "pohnch"); false = quiet alerts.
  sound boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;

create policy notification_prefs_read_own on public.notification_prefs for select to authenticated
  using (user_id = auth.uid());
create policy notification_prefs_insert_own on public.notification_prefs for insert to authenticated
  with check (user_id = auth.uid());
create policy notification_prefs_update_own on public.notification_prefs for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.notification_prefs from anon;
grant select, insert, update (off_steps, sound, updated_at) on public.notification_prefs to authenticated;

-- push_recipients now knows which step it is for, leaves out people who switched that step off, and
-- says whether each phone wants Pohnch's sounds.
drop function if exists public.push_recipients(uuid, uuid[]);
create function public.push_recipients(p_trip uuid, p_children uuid[] default null, p_step text default null)
returns table (child_id uuid, first_name text, user_id uuid, token text, platform text, lang text, driver_name text, sound boolean)
language sql stable security definer set search_path = '' as $$
  select c.id, c.first_name, pt.user_id, pt.token, pt.platform, pr.lang, dp.display_name, coalesce(np.sound, true)
  from public.trips t
  join public.vans v on v.id = t.van_id and v.verified_at is not null and v.switched_off_at is null
  join public.profiles dp on dp.id = v.driver_id
  join public.memberships m on m.van_id = v.id and m.status = 'approved'
  join public.children c on c.id = m.child_id
  join public.family_members fm on fm.family_id = c.family_id
  join public.push_tokens pt on pt.user_id = fm.user_id
  join public.profiles pr on pr.id = fm.user_id
  left join public.notification_prefs np on np.user_id = fm.user_id
  where t.id = p_trip and not t.is_practice
    and (p_step is null or np.user_id is null or not (p_step = any (np.off_steps)))
    and (
      (p_children is not null and c.id = any (p_children))
      or (p_children is null and not exists (
            select 1 from public.absences a where a.child_id = c.id and a.service_date = t.service_date))
    )
$$;

revoke all on function public.push_recipients(uuid, uuid[], text) from public, anon, authenticated;
grant execute on function public.push_recipients(uuid, uuid[], text) to service_role;
