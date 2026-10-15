-- Sky Brawl: levels + leaderboard.
-- Run once in Supabase → SQL Editor → New query → paste everything → Run. Safe to run again.
--
-- Players can only READ player_stats. The only way to change it is record_match(), which works out
-- the XP on the server, caps it per match and accepts at most one match every 30 seconds per player.

create table if not exists public.player_stats (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'ผู้เล่น',
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1,
  matches integer not null default 0,
  wins integer not null default 0,
  kos integer not null default 0,
  last_match_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists player_stats_xp_idx on public.player_stats (xp desc);
create index if not exists player_stats_wins_idx on public.player_stats (wins desc);
create index if not exists player_stats_kos_idx on public.player_stats (kos desc);
alter table public.player_stats enable row level security;
drop policy if exists "stats are public" on public.player_stats;
create policy "stats are public" on public.player_stats
  for select to anon, authenticated using (true);
-- Deliberately no insert / update / delete policies: only record_match() below writes this table.

-- Level curve: level L starts at 50 × (L − 1)² XP  (Lv2 = 50, Lv3 = 200, Lv5 = 800, Lv10 = 4050)
create or replace function public.level_for_xp(p_xp integer) returns integer
language sql immutable as $$ select floor(sqrt(greatest(p_xp, 0) / 50.0))::int + 1 $$;

create or replace function public.record_match(p_place int, p_players int, p_kos int, p_dmg int, p_online boolean)
returns table (new_xp int, new_level int, gained int, total_matches int, total_wins int)
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  s public.player_stats;
  g int;
  nm text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_players is null or p_players < 2 or p_players > 124 or p_place is null or p_place < 1 or p_place > p_players then
    raise exception 'bad result';
  end if;
  p_kos := least(greatest(coalesce(p_kos, 0), 0), 30);
  select name into nm from public.profiles where id = uid;
  insert into public.player_stats (id, name) values (uid, coalesce(nm, 'ผู้เล่น')) on conflict (id) do nothing;
  select * into s from public.player_stats where id = uid for update;
  if s.last_match_at is not null and s.last_match_at > now() - interval '30 seconds' then
    raise exception 'too soon';
  end if;
  -- 20 for playing, 5 per KO, +40 for a win / +20 for top 3, +1 per opponent (up to 32), capped at 200
  g := 20 + p_kos * 5
       + case when p_place = 1 then 40 when p_place <= 3 then 20 else 0 end
       + least(p_players - 1, 32);
  g := least(g, 200);
  if p_online then g := round(g * 1.5); end if;
  update public.player_stats set
    xp = s.xp + g,
    level = public.level_for_xp(s.xp + g),
    matches = s.matches + 1,
    wins = s.wins + (p_place = 1)::int,
    kos = s.kos + p_kos,
    name = coalesce(nm, s.name),
    last_match_at = now(),
    updated_at = now()
  where id = uid
  returning player_stats.xp, player_stats.level, g, player_stats.matches, player_stats.wins
  into new_xp, new_level, gained, total_matches, total_wins;
  return next;
end $$;
revoke all on function public.record_match(int, int, int, int, boolean) from public, anon;
grant execute on function public.record_match(int, int, int, int, boolean) to authenticated;
