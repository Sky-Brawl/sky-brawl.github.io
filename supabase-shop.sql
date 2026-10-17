-- Sky Brawl: coins 🪙 + shop (classes, cosmetics, boosts).
-- Run once in Supabase → SQL Editor → New query → paste everything → Run. Safe to run again.
-- Needs supabase-levels.sql and supabase-daily.sql to have been run first.
--
-- Players can only READ their own wallet. Coins are added by triggers on the tables the server already
-- writes (player_stats via record_match / claim_quest, daily_login via claim_daily) and spent only through
-- buy_item(), which looks up the price here on the server. So editing the game's code cannot add coins.
--
-- Earning:  coins = the XP the server gives (match or quest) · daily login +50, +150 more on day 7 of a streak
-- Boosts:   'b:coin2' = coins ×2 for the next 5 recorded matches · 'b:xp2' = XP ×2 for the next 5 matches
-- Prices must match SHOP_ITEMS / classPrice() in js/shop.js (the game only shows them; this file decides).

create table if not exists public.wallet (
  id uuid primary key references auth.users(id) on delete cascade,
  coins integer not null default 0 check (coins >= 0),
  earned integer not null default 0,           -- coins ever earned
  spent integer not null default 0,            -- coins ever spent
  owned text[] not null default '{}',          -- 'c:<class>', 'h:<hat>', 't:<title>' bought in the shop
  coin_boost integer not null default 0,       -- matches left with coins ×2
  xp_boost integer not null default 0,         -- matches left with XP ×2
  updated_at timestamptz not null default now()
);
alter table public.wallet enable row level security;
drop policy if exists "read own wallet" on public.wallet;
create policy "read own wallet" on public.wallet
  for select to authenticated using (id = auth.uid());
-- Deliberately no insert / update / delete policies: only the functions below write this table.

-- Price of one shop item, null = not for sale. Classes with difficulty ★ are free and not sold.
-- A class key that is not listed costs 800 (★★), so a class added to the game later can be sold without
-- touching this file; give it its own line here if it should cost something else.
create or replace function public.shop_price(p_item text) returns integer
language sql immutable as $$
  select case
    when p_item in ('c:none', 'c:knight', 'c:warrior', 'c:mage', 'c:priest', 'c:archer', 'c:gunner', 'c:pony',
                    'c:merchant', 'c:taekwon', 'c:soldier', 'c:shaman', 'c:lancer') then null
    when p_item in ('c:assassin', 'c:crusader', 'c:rogue') then 1500                                    -- ★★★
    when p_item in ('c:engineer', 'c:werewolf', 'c:tamer', 'c:reaper', 'c:dragonblade') then 1200      -- ★★ transform / summon
    when p_item ~ '^c:[a-z0-9]+$' then 800                                                             -- ★★
    when p_item = 'h:chef' then 400
    when p_item = 'h:headphones' then 500
    when p_item = 'h:wizard' then 600
    when p_item = 'h:pirate' then 700
    when p_item = 'h:propeller' then 800
    when p_item = 't:shopper' then 300
    when p_item = 't:cute' then 500
    when p_item = 't:bigboss' then 800
    when p_item = 't:shadow' then 800
    when p_item = 't:ace' then 1200
    when p_item = 't:rich' then 2000
    when p_item = 'b:coin2' then 300
    when p_item = 'b:xp2' then 400
  end
$$;

create or replace function public.wallet_status()
returns table (coins int, owned text[], coin_boost int, xp_boost int, earned int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  return query select w.coins, w.owned, w.coin_boost, w.xp_boost, w.earned from public.wallet w where w.id = uid;
  if not found then return query select 0, '{}'::text[], 0, 0, 0; end if;
end $$;

create or replace function public.buy_item(p_item text)
returns table (coins int, owned text[], coin_boost int, xp_boost int, earned int, price int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  w public.wallet;
  pr int := public.shop_price(p_item);
  boost boolean := p_item like 'b:%';
begin
  if uid is null then raise exception 'not signed in'; end if;
  if pr is null then raise exception 'not for sale'; end if;
  insert into public.wallet (id) values (uid) on conflict (id) do nothing;
  select * into w from public.wallet wl where wl.id = uid for update;
  if not boost and p_item = any(w.owned) then raise exception 'already owned'; end if;
  if (p_item = 'b:coin2' and w.coin_boost >= 20) or (p_item = 'b:xp2' and w.xp_boost >= 20) then raise exception 'boost full'; end if;
  if w.coins < pr then raise exception 'not enough coins'; end if;
  update public.wallet wl set
    coins = w.coins - pr,
    spent = w.spent + pr,
    owned = case when boost then w.owned else array(select distinct x from unnest(w.owned || p_item) as x order by x) end,
    coin_boost = w.coin_boost + case when p_item = 'b:coin2' then 5 else 0 end,
    xp_boost = w.xp_boost + case when p_item = 'b:xp2' then 5 else 0 end,
    updated_at = now()
  where wl.id = uid;
  return query select wl.coins, wl.owned, wl.coin_boost, wl.xp_boost, wl.earned, pr from public.wallet wl where wl.id = uid;
end $$;

-- Every XP gain on player_stats pays the same number of coins. A recorded match (matches + 1) also uses up
-- one match of each boost: the XP boost doubles the XP right here, before the row is saved.
create or replace function public.wallet_on_stats() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  g int := new.xp - old.xp;
  c int;
  m boolean := new.matches > old.matches;
  w public.wallet;
begin
  if g <= 0 then return new; end if;
  insert into public.wallet (id) values (new.id) on conflict (id) do nothing;
  select * into w from public.wallet where id = new.id for update;
  c := g;
  if m and w.xp_boost > 0 then
    new.xp := new.xp + g;
    new.level := public.level_for_xp(new.xp);
  end if;
  if m and w.coin_boost > 0 then c := c * 2; end if;
  update public.wallet set
    coins = w.coins + c,
    earned = w.earned + c,
    coin_boost = greatest(w.coin_boost - m::int, 0),
    xp_boost = greatest(w.xp_boost - m::int, 0),
    updated_at = now()
  where id = new.id;
  return new;
end $$;
drop trigger if exists wallet_on_stats on public.player_stats;
create trigger wallet_on_stats before update on public.player_stats
  for each row execute function public.wallet_on_stats();

-- Daily login: +50 coins a day, +150 more on day 7 of each 7-day round
create or replace function public.wallet_on_daily() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c int;
begin
  if new.total <= old.total then return new; end if;
  c := 50 + case when ((new.streak - 1) % 7) + 1 = 7 then 150 else 0 end;
  insert into public.wallet (id) values (new.id) on conflict (id) do nothing;
  update public.wallet set coins = coins + c, earned = earned + c, updated_at = now() where id = new.id;
  return new;
end $$;
drop trigger if exists wallet_on_daily on public.daily_login;
create trigger wallet_on_daily after update on public.daily_login
  for each row execute function public.wallet_on_daily();

revoke all on function public.wallet_status() from public, anon;
revoke all on function public.buy_item(text) from public, anon;
revoke all on function public.wallet_on_stats() from public, anon, authenticated;
revoke all on function public.wallet_on_daily() from public, anon, authenticated;
grant execute on function public.wallet_status() to authenticated;
grant execute on function public.buy_item(text) to authenticated;
