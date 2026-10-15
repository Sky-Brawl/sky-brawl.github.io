-- Sky Brawl: daily login rewards (7-day streak → hats and titles).
-- Run once in Supabase → SQL Editor → New query → paste everything → Run. Safe to run again.
--
-- Players can only READ their own row. The only way to change it is claim_daily(), which uses the
-- server's clock (Thai time), so changing the date on a phone or PC does not give extra rewards.

create table if not exists public.daily_login (
  id uuid primary key references auth.users(id) on delete cascade,
  streak integer not null default 0,          -- days in a row up to last_day
  best integer not null default 0,            -- longest streak ever
  total integer not null default 0,           -- days claimed in total
  last_day date,                              -- last day a reward was claimed (Asia/Bangkok)
  unlocks text[] not null default '{}',       -- 'h:<hat>' and 't:<title>' the player owns
  updated_at timestamptz not null default now()
);
alter table public.daily_login enable row level security;
drop policy if exists "read own daily row" on public.daily_login;
create policy "read own daily row" on public.daily_login
  for select to authenticated using (id = auth.uid());
-- Deliberately no insert / update / delete policies: only claim_daily() below writes this table.

create or replace function public.daily_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Bangkok')::date $$;

-- What the reward screen needs. A broken streak reads as 0 (the next claim starts again at day 1).
create or replace function public.daily_status()
returns table (streak int, best int, total int, can_claim boolean, unlocks text[])
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  d public.daily_login;
  t date := public.daily_today();
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into d from public.daily_login dl where dl.id = uid;
  if not found then
    return query select 0, 0, 0, true, '{}'::text[];
    return;
  end if;
  return query select
    case when d.last_day >= t - 1 then d.streak else 0 end,
    d.best, d.total, (d.last_day is null or d.last_day < t), d.unlocks;
end $$;

-- Claim today's reward. Day 1–7 of the streak each give one item; day 7 also gives a title.
-- Milestones by total days: 14 and 30.
create or replace function public.claim_daily()
returns table (streak int, best int, total int, day int, reward text[], unlocks text[])
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  d public.daily_login;
  t date := public.daily_today();
  s int;
  dy int;
  r text[];
  cyc text[] := array['t:regular', 'h:halo', 't:steady', 'h:tophat', 't:guardian', 'h:flower', 'h:star'];
begin
  if uid is null then raise exception 'not signed in'; end if;
  insert into public.daily_login (id) values (uid) on conflict (id) do nothing;
  select * into d from public.daily_login dl where dl.id = uid for update;
  if d.last_day = t then raise exception 'already claimed'; end if;
  s := case when d.last_day = t - 1 then d.streak + 1 else 1 end;
  dy := ((s - 1) % 7) + 1;
  r := array[cyc[dy]];
  if dy = 7 then r := r || 't:legend7'::text; end if;
  if d.total + 1 = 14 then r := r || 't:d14'::text; end if;
  if d.total + 1 = 30 then r := r || 't:d30'::text; end if;
  update public.daily_login dl set
    streak = s,
    best = greatest(d.best, s),
    total = d.total + 1,
    last_day = t,
    unlocks = array(select distinct x from unnest(d.unlocks || r) as x order by x),
    updated_at = now()
  where dl.id = uid;
  return query select dl.streak, dl.best, dl.total, dy, r, dl.unlocks from public.daily_login dl where dl.id = uid;
end $$;

revoke all on function public.daily_status() from public, anon;
revoke all on function public.claim_daily() from public, anon;
grant execute on function public.daily_status() to authenticated;
grant execute on function public.claim_daily() to authenticated;
