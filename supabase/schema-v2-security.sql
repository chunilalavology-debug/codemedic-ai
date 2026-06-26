-- CodeMedic AI — security hardening (run after schema-v2.sql)

-- Remove overly permissive policies
drop policy if exists "Users can join workspace on invite" on public.workspace_members;
drop policy if exists "Public can read pending invitations" on public.workspace_invitations;
drop policy if exists "Anyone can read valid share links" on public.share_links;

-- Workspace owner bootstrap (first member row)
drop policy if exists "Workspace owners can add themselves" on public.workspace_members;
create policy "Workspace owners can add themselves"
  on public.workspace_members for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

-- Invite accept: member insert must match a pending invitation
drop policy if exists "Users can accept valid invitations" on public.workspace_members;
create policy "Users can accept valid invitations"
  on public.workspace_members for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.workspace_invitations inv
      where inv.workspace_id = workspace_members.workspace_id
        and lower(inv.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and inv.role = workspace_members.role
        and inv.accepted_at is null
        and (inv.expires_at is null or inv.expires_at > now())
    )
  );

-- Invite accept: invitee can mark invitation accepted
drop policy if exists "Invitees can accept invitation" on public.workspace_invitations;
create policy "Invitees can accept invitation"
  on public.workspace_invitations for update
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and accepted_at is null
  )
  with check (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Public share view counter (token-scoped)
create or replace function public.increment_share_view_count(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.share_links
  set view_count = view_count + 1
  where token = p_token
    and (expires_at is null or expires_at > now());
end;
$$;

revoke all on function public.increment_share_view_count(text) from public;
grant execute on function public.increment_share_view_count(text) to anon, authenticated;
