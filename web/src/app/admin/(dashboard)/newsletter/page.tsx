import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listSubscribers } from "@/lib/newsletter";
import { isEmailConfigured } from "@/lib/email";
import { ComposeForm } from "./compose-form";

export const metadata: Metadata = { title: "Newsletter" };

export default async function NewsletterPage() {
  await requireAdmin();
  const count = listSubscribers().length;
  const configured = isEmailConfigured();

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Newsletter</h1>
          <p className="mt-1 text-ink/60">
            {count} subscriber{count === 1 ? "" : "s"} ·{" "}
            <Link href="/admin/settings" className="text-sage-deep hover:underline">manage</Link>
          </p>
        </div>
      </header>

      {!configured ? (
        <div className="rounded-xl2 bg-peach/40 p-6 text-sm text-ink/80 ring-1 ring-terracotta/30">
          <h2 className="font-display text-lg font-semibold text-ink">One-time email setup</h2>
          <p className="mt-2">To send newsletters, connect an email service (Resend):</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Create a free account at <a href="https://resend.com" className="font-semibold text-sage-deep underline" target="_blank" rel="noopener noreferrer">resend.com</a>.</li>
            <li>Add and <strong>verify your domain</strong> <code>desertopal.shop</code> — Resend gives you a few DNS records to add in Cloudflare (SPF/DKIM). This is what lets email actually deliver.</li>
            <li>Create an <strong>API key</strong>.</li>
            <li>Add these to <code>web/.env.local</code> and restart:
              <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-3 text-xs">RESEND_API_KEY=re_xxxxxxxx
NEWSLETTER_FROM=&quot;Desert Opal &lt;newsletter@desertopal.shop&gt;&quot;</pre>
            </li>
          </ol>
          <p className="mt-3 text-ink/60">Once that&apos;s done, this page becomes a compose-and-send screen.</p>
        </div>
      ) : (
        <ComposeForm subscriberCount={count} defaultTestEmail="" />
      )}
    </div>
  );
}
