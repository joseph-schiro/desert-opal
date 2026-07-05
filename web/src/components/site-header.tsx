import Link from "next/link";

const NAV = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?category=succulents", label: "Succulents" },
  { href: "/shop?category=cacti", label: "Cacti" },
  { href: "/shop?category=accessories", label: "Pots & Extras" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-sand-deep/40 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            🌵
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold text-ink">
              Desert Opal
            </span>
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted">
              Succulents &amp; Cacti
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink/80 transition hover:text-sage-deep"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/shop"
            className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-deep"
          >
            Shop
          </Link>
        </div>
      </div>
    </header>
  );
}
