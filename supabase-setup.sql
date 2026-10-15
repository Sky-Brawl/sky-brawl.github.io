-- Sky Brawl: player profiles + lobby chat.
-- Run once in Supabase → SQL Editor → New query → paste everything → Run.
-- Safe to run again: it drops and recreates the policies and trigger.

-- Profiles: one row per player account (anonymous accounts included)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 12),
  look jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles readable by signed-in players" on public.profiles;
drop policy if exists "players insert own profile" on public.profiles;
drop policy if exists "players update own profile" on public.profiles;
create policy "profiles readable by signed-in players" on public.profiles
  for select to authenticated using (true);
create policy "players insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "players update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Lobby chat: players can read everything and post only as themselves
create table if not exists public.lobby_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 12),
  body text not null check (char_length(body) between 1 and 120),
  created_at timestamptz not null default now()
);
create index if not exists lobby_messages_created_idx on public.lobby_messages (created_at desc);
alter table public.lobby_messages enable row level security;
drop policy if exists "chat readable by signed-in players" on public.lobby_messages;
drop policy if exists "players post as themselves" on public.lobby_messages;
create policy "chat readable by signed-in players" on public.lobby_messages
  for select to authenticated using (true);
create policy "players post as themselves" on public.lobby_messages
  for insert to authenticated with check (auth.uid() = user_id);

-- Server-side flood guard: at most one message per second per player
create or replace function public.lobby_message_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.lobby_messages
             where user_id = new.user_id and created_at > now() - interval '1 second') then
    raise exception 'slow down';
  end if;
  return new;
end $$;
drop trigger if exists lobby_message_rate_limit on public.lobby_messages;
create trigger lobby_message_rate_limit before insert on public.lobby_messages
  for each row execute function public.lobby_message_rate_limit();
