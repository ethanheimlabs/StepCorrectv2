create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key,
  created_at timestamptz not null default timezone('utc', now()),
  full_name text,
  sobriety_date date,
  tone_mode text
);

alter table if exists public.inventory_entries
  add column if not exists user_id uuid,
  add column if not exists clarification_text text,
  add column if not exists extracted_resentment jsonb,
  add column if not exists extracted_fear jsonb,
  add column if not exists shareable_summary text,
  add column if not exists deleted_at timestamptz;

alter table if exists public.inventory_entries
  alter column status set default 'draft';

update public.inventory_entries
set clarification_text = coalesce(clarification_text, clarifying_answer)
where clarification_text is null;

create table if not exists public.inventory_actions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.inventory_entries(id) on delete cascade,
  user_id uuid,
  action_text text not null,
  completed boolean not null default false,
  completed_at timestamptz
);

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  mood integer not null check (mood between 1 and 10),
  craving integer not null check (craving between 1 and 10),
  halt jsonb not null default '{}'::jsonb,
  note text
);

create table if not exists public.step_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  step_number integer not null check (step_number between 1 and 12),
  status text not null default 'not_started',
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);

create index if not exists inventory_entries_user_id_created_at_idx
  on public.inventory_entries (user_id, created_at desc);

create index if not exists inventory_entries_status_idx
  on public.inventory_entries (status);

create index if not exists inventory_actions_entry_id_idx
  on public.inventory_actions (entry_id);

create index if not exists inventory_actions_user_id_idx
  on public.inventory_actions (user_id);

create index if not exists daily_checkins_user_id_created_at_idx
  on public.daily_checkins (user_id, created_at desc);

create index if not exists step_progress_user_id_step_number_idx
  on public.step_progress (user_id, step_number);

alter table public.profiles enable row level security;
alter table public.inventory_entries enable row level security;
alter table public.inventory_actions enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.step_progress enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_modify_own" on public.profiles;
create policy "profiles_modify_own"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "inventory_entries_select_own" on public.inventory_entries;
create policy "inventory_entries_select_own"
  on public.inventory_entries for select
  using (auth.uid() = user_id);

drop policy if exists "inventory_entries_modify_own" on public.inventory_entries;
create policy "inventory_entries_modify_own"
  on public.inventory_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "inventory_actions_select_own" on public.inventory_actions;
create policy "inventory_actions_select_own"
  on public.inventory_actions for select
  using (auth.uid() = user_id);

drop policy if exists "inventory_actions_modify_own" on public.inventory_actions;
create policy "inventory_actions_modify_own"
  on public.inventory_actions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "daily_checkins_select_own" on public.daily_checkins;
create policy "daily_checkins_select_own"
  on public.daily_checkins for select
  using (auth.uid() = user_id);

drop policy if exists "daily_checkins_modify_own" on public.daily_checkins;
create policy "daily_checkins_modify_own"
  on public.daily_checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "step_progress_select_own" on public.step_progress;
create policy "step_progress_select_own"
  on public.step_progress for select
  using (auth.uid() = user_id);

drop policy if exists "step_progress_modify_own" on public.step_progress;
create policy "step_progress_modify_own"
  on public.step_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
