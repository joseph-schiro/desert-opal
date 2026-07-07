import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { logoutAction } from "../login/actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Desert Opal Admin" },
};

const NAV = [
  { href: "/admin", label: "Dashboard", emoji: "📊" },
  { href: "/admin/products", label: "Inventory", emoji: "🌿" },
  { href: "/admin/orders", label: "Orders", emoji: "📦" },
  { href: "/admin/newsletter", label: "Newsletter", emoji: "✉️" },
  { href: "/admin/users", label: "Users", emoji: "👥" },
  { href: "/admin/settings", label: "Settings", emoji: "⚙️" },
];

// Admin shell — deliberately separate from the storefront layout. Proxy gates
// these routes; we also `requireAdmin()` here as defense in depth and to show
// who's signed in.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const username = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-sand/40">
      <aside className="hidden w-60 flex-col border-r border-sand-deep/40 bg-white/70 p-4 md:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-2 px-2">
          <span className="text-2xl" aria-hidden>🌵</span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-base font-semibold text-ink">Desert Opal</span>
            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted">Admin</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink/75 transition hover:bg-sage-soft hover:text-sage-deep"
            >
              <span aria-hidden>{item.emoji}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t border-sand-deep/40 pt-3">
          <p className="px-3 text-xs text-muted">
            Signed in as <span className="font-semibold text-ink/80">{username}</span>
          </p>
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-sm text-muted transition hover:text-sage-deep"
          >
            ← View storefront
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition hover:text-terracotta"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-sand-deep/40 bg-white/70 px-4 py-3 md:hidden">
          <span className="text-xl" aria-hidden>🌵</span>
          <span className="font-display font-semibold text-ink">Desert Opal Admin</span>
        </div>
        <div className="mx-auto max-w-5xl p-6">{children}</div>
      </div>
    </div>
  );
}
