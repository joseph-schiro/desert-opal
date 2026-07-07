"use client";

import { useState, useTransition } from "react";
import { sendTestAction, sendNewsletterAction, type SendResult } from "./actions";

const inputClass =
  "mt-1 w-full rounded-xl2 border border-sand-deep/50 bg-white px-3 py-2 text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/30";

export function ComposeForm({
  subscriberCount,
  defaultTestEmail,
}: {
  subscriberCount: number;
  defaultTestEmail: string;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [testEmail, setTestEmail] = useState(defaultTestEmail);
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function runTest() {
    setMsg(null);
    startTransition(async () => {
      const r: SendResult = await sendTestAction(subject, body, testEmail);
      setMsg(r.error ? { text: r.error, ok: false } : { text: `Test sent to ${testEmail}.`, ok: true });
    });
  }

  function runSend() {
    if (!confirm) return;
    setMsg(null);
    startTransition(async () => {
      const r: SendResult = await sendNewsletterAction(subject, body);
      if (r.error) setMsg({ text: r.error, ok: false });
      else {
        setMsg({ text: `Sent to ${r.sent} subscriber${r.sent === 1 ? "" : "s"}${r.failed ? `, ${r.failed} failed` : ""}.`, ok: !r.failed });
        setConfirm(false);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="subject" className="text-sm font-medium text-ink/80">Subject</label>
        <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="New arrivals just dropped 🌵" className={inputClass} />
      </div>

      <div>
        <label htmlFor="body" className="text-sm font-medium text-ink/80">Message</label>
        <textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder={"Hi friend,\n\nWe just added a batch of new plants…\n\nLeave a blank line between paragraphs."} className={inputClass} />
        <p className="mt-1 text-xs text-muted">Plain text — blank lines become paragraphs. A branded header and unsubscribe link are added automatically.</p>
      </div>

      {msg && (
        <p className={`rounded-xl2 px-4 py-3 text-sm font-medium ${msg.ok ? "bg-mint/50 text-sage-deep" : "bg-blush/60 text-terracotta"}`}>
          {msg.text}
        </p>
      )}

      {/* Test send */}
      <div className="rounded-xl2 bg-white/70 p-4 ring-1 ring-sand-deep/40">
        <p className="text-sm font-medium text-ink/80">Send yourself a test first</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} type="email" placeholder="you@email.com" className="min-w-[14rem] flex-1 rounded-full border border-sand-deep/50 bg-white px-3 py-2 text-sm outline-none focus:border-sage" />
          <button type="button" onClick={runTest} disabled={pending} className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink/80 transition hover:bg-sand-deep/40 disabled:opacity-50">
            {pending ? "Sending…" : "Send test"}
          </button>
        </div>
      </div>

      {/* Full send */}
      <div className="rounded-xl2 border border-sage/40 bg-sage-soft/40 p-4">
        <label className="flex items-start gap-2 text-sm text-ink/80">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-sand-deep/50" />
          <span>I&apos;m ready to email all <strong>{subscriberCount}</strong> subscriber{subscriberCount === 1 ? "" : "s"}. This can&apos;t be undone.</span>
        </label>
        <button type="button" onClick={runSend} disabled={pending || !confirm || subscriberCount === 0} className="mt-3 rounded-full bg-sage px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-sage-deep disabled:cursor-not-allowed disabled:bg-muted/50">
          {pending ? "Sending…" : `Send to ${subscriberCount} subscriber${subscriberCount === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
  );
}
