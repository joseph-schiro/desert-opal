import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { listSubscribers } from "@/lib/newsletter";

export const metadata: Metadata = { title: "Settings" };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminSettings() {
  await requireAdmin();
  const subs = [...listSubscribers()].reverse(); // newest first

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold text-ink">Settings</h1>

      {/* Newsletter subscribers */}
      <section className="mt-6 rounded-xl2 bg-white p-6 shadow-soft ring-1 ring-sand-deep/40">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Newsletter subscribers</h2>
            <p className="text-sm text-ink/60">People who signed up via the storefront footer.</p>
          </div>
          <span className="rounded-full bg-mint/60 px-3 py-1 text-sm font-semibold text-sage-deep">
            {subs.length}
          </span>
        </div>

        {subs.length === 0 ? (
          <p className="mt-4 text-sm text-ink/60">No subscribers yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-sand-deep/30">
            {subs.map((s) => (
              <li key={s.email} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">{s.email}</span>
                <span className="text-muted">{formatDate(s.subscribedAt)}</span>
              </li>
            ))}
          </ul>
        )}
        {subs.length > 0 && (
          <p className="mt-4 text-xs text-muted">
            Tip: export these to your email tool (or Shopify) to send restock &amp;
            new-arrival announcements.
          </p>
        )}
      </section>

      <section className="mt-6 rounded-xl2 bg-white p-6 shadow-soft ring-1 ring-sand-deep/40">
        <h2 className="font-display text-lg font-semibold text-ink">Store settings</h2>
        <p className="mt-2 text-sm text-ink/60">
          Payments, shipping rates, and taxes are managed in your Shopify admin.
          Admin logins are on the <strong>Users</strong> page.
        </p>
      </section>
    </div>
  );
}
