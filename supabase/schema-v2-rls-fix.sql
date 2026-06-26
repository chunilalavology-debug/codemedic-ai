-- Fix infinite recursion in workspace_members RLS policies
-- Run after schema-v2.sql and schema-v2-security.sql

create or replace function public.is_workspace_member(p_workspace_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = p_user_id
  );
$$;

create or replace function public.is_workspace_admin(p_workspace_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = p_user_id
      and role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_workspace_member(uuid, uuid) from public;
revoke all on function public.is_workspace_admin(uuid, uuid) from public;
grant execute on function public.is_workspace_member(uuid, uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid, uuid) to authenticated;

-- Workspaces
drop policy if exists "Members can view workspace" on public.workspaces;
create policy "Members can view workspace"
  on public.workspaces for select
  using (public.is_workspace_member(id, auth.uid()));

drop policy if exists "Owners and admins can update workspace" on public.workspaces;
create policy "Owners and admins can update workspace"
  on public.workspaces for update
  using (public.is_workspace_admin(id, auth.uid()));

-- Workspace members (no self-referencing subqueries)
drop policy if exists "Members can view membership" on public.workspace_members;
create policy "Members can view membership"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "Owners and admins can manage members" on public.workspace_members;
create policy "Owners and admins can manage members"
  on public.workspace_members for all
  using (public.is_workspace_admin(workspace_id, auth.uid()))
  with check (public.is_workspace_admin(workspace_id, auth.uid()));

-- Invitations
drop policy if exists "Members can view invitations" on public.workspace_invitations;
create policy "Members can view invitations"
  on public.workspace_invitations for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "Admins can manage invitations" on public.workspace_invitations;
create policy "Admins can manage invitations"
  on public.workspace_invitations for all
  using (public.is_workspace_admin(workspace_id, auth.uid()))
  with check (public.is_workspace_admin(workspace_id, auth.uid()));

-- Activity feed
drop policy if exists "Workspace members view workspace activity" on public.activity_events;
create policy "Workspace members view workspace activity"
  on public.activity_events for select
  using (
    workspace_id is not null
    and public.is_workspace_member(workspace_id, auth.uid())
  );
