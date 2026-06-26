const RESEND_API = "https://api.resend.com/emails";

export interface InviteEmailParams {
  to: string;
  workspaceName: string;
  inviteUrl: string;
  inviterEmail?: string;
  role: string;
}

export interface EmailResult {
  sent: boolean;
  provider: "resend" | "console";
  message?: string;
}

export async function sendWorkspaceInviteEmail(
  params: InviteEmailParams
): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "CodeMedic AI <onboarding@resend.dev>";

  const subject = `You're invited to join ${params.workspaceName} on CodeMedic AI`;
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#111;margin-bottom:8px">Workspace invitation</h2>
      <p style="color:#444;line-height:1.6">
        ${params.inviterEmail ?? "A teammate"} invited you to join
        <strong>${params.workspaceName}</strong> as <strong>${params.role}</strong>.
      </p>
      <p style="margin:24px 0">
        <a href="${params.inviteUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
          Accept invitation
        </a>
      </p>
      <p style="color:#888;font-size:12px">This link expires in 7 days. If you didn't expect this, ignore this email.</p>
      <p style="color:#888;font-size:11px;word-break:break-all">${params.inviteUrl}</p>
    </div>
  `;

  if (!apiKey) {
    console.info("[email:invite]", params.to, params.inviteUrl);
    return {
      sent: false,
      provider: "console",
      message: "RESEND_API_KEY not set — invitation URL logged server-side",
    };
  }

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Email send failed: ${text.slice(0, 200)}`);
  }

  return { sent: true, provider: "resend" };
}
