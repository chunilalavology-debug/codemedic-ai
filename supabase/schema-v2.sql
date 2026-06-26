-- CodeMedic AI v2 — run after schema.sql in Supabase SQL Editor

-- Workspaces
create table if not exists public.workspaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now() not null,
  primary key (workspace_id, user_id)
);

create table if not exists public.workspace_invitations (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz default now() not null
);

-- User preferences
create table if not exists public.user_preferences (
  user_id uuid references auth.users(id) on delete cascade primary key,
  preferred_text_model text default 'llama-3.3-70b-versatile',
  preferred_vision_model text default 'meta-llama/llama-4-scout-17b-16e-instruct',
  active_workspace_id uuid references public.workspaces(id) on delete set null,
  onboarding_completed boolean default false not null,
  onboarding_step int default 0 not null,
  chat_history jsonb default '[]'::jsonb not null,
  updated_at timestamptz default now() not null
);

-- Unified activity feed
create table if not exists public.activity_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  title text not null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

create index if not exists activity_events_user_id_idx on public.activity_events(user_id, created_at desc);
create index if not exists activity_events_workspace_id_idx on public.activity_events(workspace_id, created_at desc);

-- Public share links
create table if not exists public.share_links (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  resource_type text not null,
  resource_id text,
  resource_data jsonb not null,
  expires_at timestamptz,
  view_count int default 0 not null,
  created_at timestamptz default now() not null
);

create index if not exists share_links_token_idx on public.share_links(token);

-- Integration tokens (GitHub / GitLab)
create table if not exists public.integration_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null check (provider in ('github', 'gitlab')),
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  account_login text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  unique (user_id, provider)
);

-- Optional workspace_id on analyses
alter table public.analyses add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

-- RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.user_preferences enable row level security;
alter table public.activity_events enable row level security;
alter table public.share_links enable row level security;
alter table public.integration_tokens enable row level security;

-- Workspace policies
create policy "Members can view workspace"
  on public.workspaces for select
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = auth.uid()
    )
  );

create policy "Users can create workspace"
  on public.workspaces for insert
  with check (auth.uid() = owner_id);

create policy "Owners and admins can update workspace"
  on public.workspaces for update
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = auth.uid() and wm.role in ('owner', 'admin')
    )
  );

-- Members policies
create policy "Members can view membership"
  on public.workspace_members for select
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id and wm.user_id = auth.uid()
    )
  );

create policy "Owners and admins can manage members"
  on public.workspace_members for all
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

-- Invitations
create policy "Members can view invitations"
  on public.workspace_invitations for select
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_invitations.workspace_id and wm.user_id = auth.uid()
    )
  );

create policy "Admins can manage invitations"
  on public.workspace_invitations for all
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_invitations.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

-- User preferences
create policy "Users manage own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Activity
create policy "Users view own activity"
  on public.activity_events for select
  using (auth.uid() = user_id);

create policy "Users insert own activity"
  on public.activity_events for insert
  with check (auth.uid() = user_id);

create policy "Workspace members view workspace activity"
  on public.activity_events for select
  using (
    workspace_id is not null and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = activity_events.workspace_id and wm.user_id = auth.uid()
    )
  );

-- Share links
create policy "Users manage own share links"
  on public.share_links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public read for share links by token (anon via service or public policy)
create policy "Anyone can read valid share links"
  on public.share_links for select
  using (expires_at is null or expires_at > now());

-- Integrations
create policy "Users manage own integrations"
  on public.integration_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Invite: users may join a workspace as themselves (accept flow)
drop policy if exists "Users can join workspace on invite" on public.workspace_members;
create policy "Users can join workspace on invite"
  on public.workspace_members for insert
  with check (auth.uid() = user_id);

-- Invite: allow reading pending invitation by token (public accept page)
drop policy if exists "Public can read pending invitations" on public.workspace_invitations;
create policy "Public can read pending invitations"
  on public.workspace_invitations for select
  using (accepted_at is null and (expires_at is null or expires_at > now()));
