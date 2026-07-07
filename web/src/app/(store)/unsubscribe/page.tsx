import type { Metadata } from "next";
import Link from "next/link";
import { removeSubscriber, verifyUnsubscribe } from "@/lib/newsletter";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string }>;
}) {
  const { e, t } = await searchParams;
  const email = (e ?? "").trim();
  const valid = email && t && verifyUnsubscribe(email, t);

  // Removing on load is fine here — the signed token prevents forged links.
  if (valid) removeSubscriber(email);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      {valid ? (
        <>
          <p className="text-4xl" aria-hidden>👋</p>
          <h1 className="mt-4 text-3xl font-semibold text-ink">You&apos;re unsubscribed</h1>
          <p className="mt-2 text-ink/60">
            {email} won&apos;t receive any more newsletters from us. We&apos;ll miss you!
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold text-ink">Link not valid</h1>
          <p className="mt-2 text-ink/60">
            This unsubscribe link looks incomplete or expired. If you&apos;d like to
            stop receiving emails, just reply to any newsletter and we&apos;ll remove you.
          </p>
        </>
      )}
      <Link href="/" className="mt-6 inline-block rounded-full bg-sage px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-sage-deep">
        Back to the shop
      </Link>
    </div>
  );
}
