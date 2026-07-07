"use server";

import { requireAdmin } from "@/lib/dal";
import { listSubscribers, unsubscribeToken } from "@/lib/newsletter";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export interface SendResult {
  sent?: number;
  failed?: number;
  error?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wrap the plain-text body in a simple branded HTML email + unsubscribe footer. */
function renderHtml(bodyText: string, unsubscribeUrl: string): string {
  const paragraphs = bodyText
    .trim()
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;line-height:1.6;color:#3a3a3a;font-size:16px">${escapeHtml(
          p
        ).replace(/\n/g, "<br/>")}</p>`
    )
    .join("");

  return `<!doctype html>
<html><body style="margin:0;background:#faf6f0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
    <div style="font-size:22px;font-weight:700;color:#5a7a5a;margin-bottom:20px">🌵 ${SITE_NAME}</div>
    ${paragraphs}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="font-size:12px;color:#999;line-height:1.5">
      You're receiving this because you signed up at
      <a href="${SITE_URL}" style="color:#5a7a5a">desertopal.shop</a>.
      <br/>
      <a href="${unsubscribeUrl}" style="color:#999">Unsubscribe</a>
    </p>
  </div>
</body></html>`;
}

function unsubUrl(email: string): string {
  return `${SITE_URL}/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;
}

/** Send a single test email to yourself before the real blast. */
export async function sendTestAction(
  subject: string,
  body: string,
  testEmail: string
): Promise<SendResult> {
  await requireAdmin();
  if (!isEmailConfigured()) return { error: "Email isn't configured yet." };
  if (!subject.trim() || !body.trim()) return { error: "Subject and body are required." };
  if (!testEmail.trim()) return { error: "Enter a test email address." };

  try {
    await sendEmail({
      to: testEmail.trim(),
      subject: `[TEST] ${subject}`,
      html: renderHtml(body, unsubUrl(testEmail.trim())),
    });
    return { sent: 1 };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Send failed." };
  }
}

/** Send the newsletter to every subscriber (each gets their own email). */
export async function sendNewsletterAction(
  subject: string,
  body: string
): Promise<SendResult> {
  await requireAdmin();
  if (!isEmailConfigured()) return { error: "Email isn't configured yet." };
  if (!subject.trim() || !body.trim()) return { error: "Subject and body are required." };

  const subs = listSubscribers();
  if (subs.length === 0) return { error: "No subscribers to send to." };

  let sent = 0;
  let failed = 0;
  for (const s of subs) {
    try {
      await sendEmail({ to: s.email, subject, html: renderHtml(body, unsubUrl(s.email)) });
      sent++;
    } catch {
      failed++;
    }
    // Stay comfortably under Resend's rate limits.
    await new Promise((r) => setTimeout(r, 600));
  }
  return { sent, failed };
}
