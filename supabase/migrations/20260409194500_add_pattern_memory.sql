create table if not exists public.inventory_entry_embeddings (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.inventory_entries(id) on delete cascade,
  user_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  source_text text not null,
  embedding jsonb not null default '[]'::jsonb,
  model text not null,
  dimensions integer not null
);

comment on column public.inventory_entry_embeddings.embedding is
  'JSON embedding fallback. TODO: migrate to pgvector + SQL cosine search if vector support is added to this repo.';

create table if not exists public.pattern_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  timeframe text not null,
  summary jsonb not null default '{}'::jsonb,
  feedback_text text not null,
  model text not null
);

create unique index if not exists inventory_entry_embeddings_entry_id_key
  on public.inventory_entry_embeddings (entry_id);

create index if not exists inventory_entry_embeddings_user_id_created_at_idx
  on public.inventory_entry_embeddings (user_id, created_at desc);

create index if not exists pattern_feedback_user_id_created_at_idx
  on public.pattern_feedback (user_id, created_at desc);

create unique index if not exists pattern_feedback_user_id_timeframe_key
  on public.pattern_feedback (user_id, timeframe);

alter table public.inventory_entry_embeddings enable row level security;
alter table public.pattern_feedback enable row level security;

drop policy if exists "inventory_entry_embeddings_select_own" on public.inventory_entry_embeddings;
create policy "inventory_entry_embeddings_select_own"
  on public.inventory_entry_embeddings for select
  using (auth.uid() = user_id);

drop policy if exists "inventory_entry_embeddings_modify_own" on public.inventory_entry_embeddings;
create policy "inventory_entry_embeddings_modify_own"
  on public.inventory_entry_embeddings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "pattern_feedback_select_own" on public.pattern_feedback;
create policy "pattern_feedback_select_own"
  on public.pattern_feedback for select
  using (auth.uid() = user_id);

drop policy if exists "pattern_feedback_modify_own" on public.pattern_feedback;
create policy "pattern_feedback_modify_own"
  on public.pattern_feedback for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
