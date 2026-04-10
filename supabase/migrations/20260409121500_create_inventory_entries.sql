create extension if not exists "pgcrypto";

create table if not exists public.inventory_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  status text not null default 'captured',
  raw_text text not null,
  entry_type text not null default 'unknown',
  confidence jsonb not null default '{"resentment": 0, "fear": 0}'::jsonb,
  needs_clarification boolean not null default false,
  clarifying_question text,
  clarifying_answer text,
  structured_review jsonb,
  action_plan jsonb
);

create index if not exists inventory_entries_created_at_idx
  on public.inventory_entries (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists inventory_entries_set_updated_at on public.inventory_entries;

create trigger inventory_entries_set_updated_at
before update on public.inventory_entries
for each row
execute function public.set_updated_at();
