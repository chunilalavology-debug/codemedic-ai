-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Analyses table
create table if not exists public.analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled Analysis',
  original_code text not null,
  error_message text,
  language text not null default 'unknown',
  analysis_type text not null default 'all',
  result jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes
create index if not exists analyses_user_id_idx on public.analyses(user_id);
create index if not exists analyses_created_at_idx on public.analyses(created_at desc);
create index if not exists analyses_language_idx on public.analyses(language);

-- Row Level Security
alter table public.analyses enable row level security;

create policy "Users can view own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.analyses for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.analyses
  for each row execute function public.handle_updated_at();

-- Avatar storage (see supabase/avatars-bucket.sql — run in Supabase SQL Editor)
