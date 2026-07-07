/**
 * Email sending via Resend. Server-only. Configured with:
 *   RESEND_API_KEY   — from resend.com (API keys)
 *   NEWSLETTER_FROM  — e.g. "Desert Opal <newsletter@desertopal.shop>"
 *                      (the domain must be verified in Resend)
 */

import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.NEWSLETTER_FROM;

export function isEmailConfigured(): boolean {
  return Boolean(API_KEY && FROM);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error("Email isn't configured (RESEND_API_KEY / NEWSLETTER_FROM).");
  }
  const resend = new Resend(API_KEY);
  const { error } = await resend.emails.send({
    from: FROM as string,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) {
    throw new Error(
      typeof error === "string" ? error : error.message ?? "Email send failed"
    );
  }
}
