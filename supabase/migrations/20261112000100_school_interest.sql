-- v18: "For schools" on pohnch.pk (interest only; Pohnch for Schools stays a stage 3 plan).
-- A school can leave its name, area and an office WhatsApp number in pilot_interest, with role 'school'.
-- Nothing else changes: the public summary still counts parents only, and only the Pohnch team can
-- read the rows (the policies from 20261110000100 apply unchanged).
alter table public.pilot_interest drop constraint if exists pilot_interest_role_check;
alter table public.pilot_interest add constraint pilot_interest_role_check check (role in ('parent', 'driver', 'school'));
-- a school row must say which school. (A WhatsApp number is required when a school signs up, by the
-- website and the interest function; the table can't insist on it, because numbers are erased after 90 days.)
alter table public.pilot_interest add constraint pilot_interest_school_needs check (role <> 'school' or school is not null);
