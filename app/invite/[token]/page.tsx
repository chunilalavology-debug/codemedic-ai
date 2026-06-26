import { InviteAcceptShell } from "@/components/workspace/invite-accept-shell";

export const metadata = { title: "Accept Invitation — CodeMedic AI" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InviteAcceptShell token={token} />;
}
